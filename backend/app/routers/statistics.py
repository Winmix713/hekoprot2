from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import uuid
import logging

from app.database import get_db
from app.models.database import Match, Team, Season, TeamStats, User
from app.core.security import get_current_user
from app.services.statistics_service import statistics_service
from app.schemas.statistics import (
    TeamAnalysisResponse, PredictionResponse, TeamStatsResponse,
    LeagueStatsResponse, MatchStatsResponse
)

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/team-analysis", response_model=TeamAnalysisResponse)
async def get_team_analysis(
    home_team_id: uuid.UUID = Query(..., description="Home team ID"),
    away_team_id: uuid.UUID = Query(..., description="Away team ID"),
    season_id: Optional[uuid.UUID] = Query(None, description="Season ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive team analysis"""
    try:
        analysis = await statistics_service.get_team_analysis(
            db, str(home_team_id), str(away_team_id), str(season_id) if season_id else None
        )
        
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teams not found or no data available"
            )
        
        return analysis
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Team analysis error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get team analysis"
        )

@router.get("/prediction", response_model=PredictionResponse)
async def get_match_prediction(
    home_team_id: uuid.UUID = Query(..., description="Home team ID"),
    away_team_id: uuid.UUID = Query(..., description="Away team ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get match prediction using statistical models"""
    try:
        prediction = await statistics_service.run_comprehensive_prediction(
            db, str(home_team_id), str(away_team_id)
        )
        
        return prediction
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate prediction"
        )

@router.get("/team-stats/{team_id}", response_model=TeamStatsResponse)
async def get_team_stats(
    team_id: uuid.UUID,
    season_id: Optional[uuid.UUID] = Query(None),
    home_only: bool = Query(False),
    away_only: bool = Query(False),
    last_n_matches: Optional[int] = Query(None, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed team statistics"""
    try:
        # Build query for team matches
        query = select(Match).options(
            selectinload(Match.home_team),
            selectinload(Match.away_team)
        ).where(
            or_(Match.home_team_id == team_id, Match.away_team_id == team_id),
            Match.status == 'finished',
            Match.is_deleted == False
        )
        
        if season_id:
            query = query.where(Match.season_id == season_id)
        
        if home_only:
            query = query.where(Match.home_team_id == team_id)
        elif away_only:
            query = query.where(Match.away_team_id == team_id)
        
        query = query.order_by(Match.match_date.desc())
        
        if last_n_matches:
            query = query.limit(last_n_matches)
        
        result = await db.execute(query)
        matches = result.scalars().all()
        
        if not matches:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No matches found for this team"
            )
        
        # Calculate statistics
        total_matches = len(matches)
        wins = draws = losses = 0
        goals_for = goals_against = 0
        home_wins = home_draws = home_losses = 0
        away_wins = away_draws = away_losses = 0
        
        for match in matches:
            is_home = match.home_team_id == team_id
            team_goals = match.home_goals if is_home else match.away_goals
            opponent_goals = match.away_goals if is_home else match.home_goals
            
            goals_for += team_goals or 0
            goals_against += opponent_goals or 0
            
            if match.winner == ('home' if is_home else 'away'):
                wins += 1
                if is_home:
                    home_wins += 1
                else:
                    away_wins += 1
            elif match.winner == 'draw':
                draws += 1
                if is_home:
                    home_draws += 1
                else:
                    away_draws += 1
            else:
                losses += 1
                if is_home:
                    home_losses += 1
                else:
                    away_losses += 1
        
        # Calculate form index
        form_index = await statistics_service.calculate_form_index(db, str(team_id))
        
        # Calculate averages
        avg_goals_for = round(goals_for / total_matches, 2) if total_matches > 0 else 0
        avg_goals_against = round(goals_against / total_matches, 2) if total_matches > 0 else 0
        
        return {
            'team_id': team_id,
            'total_matches': total_matches,
            'wins': wins,
            'draws': draws,
            'losses': losses,
            'goals_for': goals_for,
            'goals_against': goals_against,
            'goal_difference': goals_for - goals_against,
            'points': (wins * 3) + draws,
            'win_percentage': round((wins / total_matches) * 100, 2) if total_matches > 0 else 0,
            'home_record': {
                'wins': home_wins,
                'draws': home_draws,
                'losses': home_losses
            },
            'away_record': {
                'wins': away_wins,
                'draws': away_draws,
                'losses': away_losses
            },
            'averages': {
                'goals_for': avg_goals_for,
                'goals_against': avg_goals_against
            },
            'form_index': form_index
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Team stats error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get team statistics"
        )

@router.get("/league-table", response_model=List[Dict[str, Any]])
async def get_league_table(
    season_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get league table standings"""
    try:
        # Get current season if not specified
        if not season_id:
            season_result = await db.execute(
                select(Season).where(Season.is_active == True)
            )
            season = season_result.scalar_one_or_none()
            if not season:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No active season found"
                )
            season_id = season.id
        
        # Get team stats for the season
        result = await db.execute(
            select(TeamStats).options(
                selectinload(TeamStats.team)
            ).where(
                TeamStats.season_id == season_id
            ).order_by(
                TeamStats.points.desc(),
                TeamStats.goal_difference.desc(),
                TeamStats.goals_for.desc()
            )
        )
        team_stats = result.scalars().all()
        
        # Format league table
        league_table = []
        for position, stats in enumerate(team_stats, 1):
            league_table.append({
                'position': position,
                'team_id': stats.team_id,
                'team_name': stats.team.name,
                'matches_played': stats.matches_played,
                'wins': stats.wins,
                'draws': stats.draws,
                'losses': stats.losses,
                'goals_for': stats.goals_for,
                'goals_against': stats.goals_against,
                'goal_difference': stats.goal_difference,
                'points': stats.points,
                'form': stats.form_last_5 or 'N/A'
            })
        
        return league_table
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"League table error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get league table"
        )

@router.get("/match-stats", response_model=MatchStatsResponse)
async def get_match_statistics(
    season_id: Optional[uuid.UUID] = Query(None),
    team_id: Optional[uuid.UUID] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive match statistics"""
    try:
        # Build query
        query = select(Match).where(
            Match.status == 'finished',
            Match.is_deleted == False
        )
        
        if season_id:
            query = query.where(Match.season_id == season_id)
        
        if team_id:
            query = query.where(
                or_(Match.home_team_id == team_id, Match.away_team_id == team_id)
            )
        
        if date_from:
            query = query.where(Match.match_date >= date_from)
        
        if date_to:
            query = query.where(Match.match_date <= date_to)
        
        result = await db.execute(query)
        matches = result.scalars().all()
        
        if not matches:
            return {
                'total_matches': 0,
                'average_goals_per_match': 0.0,
                'both_teams_scored_percentage': 0.0,
                'home_win_percentage': 0.0,
                'away_win_percentage': 0.0,
                'draw_percentage': 0.0,
                'over_2_5_goals_percentage': 0.0,
                'under_2_5_goals_percentage': 0.0,
                'clean_sheets_percentage': 0.0
            }
        
        # Calculate statistics
        total_matches = len(matches)
        total_goals = sum((m.home_goals or 0) + (m.away_goals or 0) for m in matches)
        both_teams_scored = sum(1 for m in matches if (m.home_goals or 0) > 0 and (m.away_goals or 0) > 0)
        home_wins = sum(1 for m in matches if m.winner == 'home')
        away_wins = sum(1 for m in matches if m.winner == 'away')
        draws = sum(1 for m in matches if m.winner == 'draw')
        over_2_5 = sum(1 for m in matches if ((m.home_goals or 0) + (m.away_goals or 0)) > 2.5)
        clean_sheets = sum(1 for m in matches if (m.home_goals or 0) == 0 or (m.away_goals or 0) == 0)
        
        return {
            'total_matches': total_matches,
            'average_goals_per_match': round(total_goals / total_matches, 2),
            'both_teams_scored_percentage': round((both_teams_scored / total_matches) * 100, 2),
            'home_win_percentage': round((home_wins / total_matches) * 100, 2),
            'away_win_percentage': round((away_wins / total_matches) * 100, 2),
            'draw_percentage': round((draws / total_matches) * 100, 2),
            'over_2_5_goals_percentage': round((over_2_5 / total_matches) * 100, 2),
            'under_2_5_goals_percentage': round(((total_matches - over_2_5) / total_matches) * 100, 2),
            'clean_sheets_percentage': round((clean_sheets / total_matches) * 100, 2)
        }
        
    except Exception as e:
        logger.error(f"Match stats error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get match statistics"
        )
