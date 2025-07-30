from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime
import uuid
import logging

from app.database import get_db
from app.models.database import Match, Team, Season
from app.schemas.matches import MatchCreate, MatchUpdate, Match as MatchSchema, MatchList, MatchStats
from app.core.security import get_current_user
from app.models.database import User

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=MatchList)
async def get_matches(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    team_id: Optional[uuid.UUID] = Query(None),
    season_id: Optional[uuid.UUID] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get matches with filtering and pagination"""
    try:
        # Build query
        query = select(Match).options(
            selectinload(Match.home_team),
            selectinload(Match.away_team),
            selectinload(Match.season)
        ).where(Match.is_deleted == False)
        
        # Apply filters
        if status:
            query = query.where(Match.status == status)
        
        if team_id:
            query = query.where(
                or_(Match.home_team_id == team_id, Match.away_team_id == team_id)
            )
        
        if season_id:
            query = query.where(Match.season_id == season_id)
        
        if date_from:
            query = query.where(Match.match_date >= date_from)
        
        if date_to:
            query = query.where(Match.match_date <= date_to)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.order_by(Match.match_date.desc())
        query = query.offset((page - 1) * size).limit(size)
        
        # Execute query
        result = await db.execute(query)
        matches = result.scalars().all()
        
        return MatchList(
            matches=matches,
            total=total,
            page=page,
            size=size,
            pages=(total + size - 1) // size
        )
        
    except Exception as e:
        logger.error(f"Get matches error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve matches"
        )

@router.get("/{match_id}", response_model=MatchSchema)
async def get_match(
    match_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get match by ID"""
    try:
        result = await db.execute(
            select(Match).options(
                selectinload(Match.home_team),
                selectinload(Match.away_team),
                selectinload(Match.season)
            ).where(Match.id == match_id, Match.is_deleted == False)
        )
        match = result.scalar_one_or_none()
        
        if not match:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Match not found"
            )
        
        return match
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get match error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve match"
        )

@router.post("/", response_model=MatchSchema)
async def create_match(
    match_data: MatchCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new match"""
    try:
        # Validate teams exist
        teams_result = await db.execute(
            select(Team).where(
                Team.id.in_([match_data.home_team_id, match_data.away_team_id]),
                Team.is_deleted == False
            )
        )
        teams = teams_result.scalars().all()
        
        if len(teams) != 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or both teams not found"
            )
        
        # Validate season exists
        season_result = await db.execute(
            select(Season).where(Season.id == match_data.season_id)
        )
        season = season_result.scalar_one_or_none()
        
        if not season:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Season not found"
            )
        
        # Create match
        match = Match(**match_data.dict())
        db.add(match)
        await db.commit()
        await db.refresh(match)
        
        # Load relationships
        result = await db.execute(
            select(Match).options(
                selectinload(Match.home_team),
                selectinload(Match.away_team),
                selectinload(Match.season)
            ).where(Match.id == match.id)
        )
        match = result.scalar_one()
        
        logger.info(f"Match created: {match.id}")
        return match
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create match error: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create match"
        )

@router.put("/{match_id}", response_model=MatchSchema)
async def update_match(
    match_id: uuid.UUID,
    match_data: MatchUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update match"""
    try:
        # Get existing match
        result = await db.execute(
            select(Match).where(Match.id == match_id, Match.is_deleted == False)
        )
        match = result.scalar_one_or_none()
        
        if not match:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Match not found"
            )
        
        # Update fields
        update_data = match_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(match, field, value)
        
        await db.commit()
        await db.refresh(match)
        
        # Load relationships
        result = await db.execute(
            select(Match).options(
                selectinload(Match.home_team),
                selectinload(Match.away_team),
                selectinload(Match.season)
            ).where(Match.id == match.id)
        )
        match = result.scalar_one()
        
        logger.info(f"Match updated: {match.id}")
        return match
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update match error: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update match"
        )

@router.delete("/{match_id}")
async def delete_match(
    match_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete match (soft delete)"""
    try:
        result = await db.execute(
            select(Match).where(Match.id == match_id, Match.is_deleted == False)
        )
        match = result.scalar_one_or_none()
        
        if not match:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Match not found"
            )
        
        match.is_deleted = True
        await db.commit()
        
        logger.info(f"Match deleted: {match.id}")
        return {"message": "Match deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete match error: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete match"
        )

@router.get("/stats/overview", response_model=MatchStats)
async def get_match_stats(
    season_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get match statistics"""
    try:
        # Build base query
        query = select(Match).where(Match.is_deleted == False)
        
        if season_id:
            query = query.where(Match.season_id == season_id)
        
        # Get total matches
        total_result = await db.execute(
            select(func.count()).select_from(query.subquery())
        )
        total_matches = total_result.scalar()
        
        # Get matches by status
        status_query = query.add_columns(Match.status)
        status_result = await db.execute(status_query)
        matches = status_result.all()
        
        finished_matches = len([m for m in matches if m.status == 'finished'])
        upcoming_matches = len([m for m in matches if m.status == 'scheduled'])
        live_matches = len([m for m in matches if m.status == 'live'])
        
        # Calculate statistics for finished matches
        finished_query = query.where(Match.status == 'finished')
        finished_result = await db.execute(finished_query)
        finished_matches_data = finished_result.scalars().all()
        
        if finished_matches_data:
            total_goals = sum((m.home_goals or 0) + (m.away_goals or 0) for m in finished_matches_data)
            average_goals = total_goals / len(finished_matches_data) if finished_matches_data else 0
            
            home_wins = len([m for m in finished_matches_data if m.winner == 'home'])
            away_wins = len([m for m in finished_matches_data if m.winner == 'away'])
            draws = len([m for m in finished_matches_data if m.winner == 'draw'])
            
            home_win_percentage = (home_wins / len(finished_matches_data)) * 100
            away_win_percentage = (away_wins / len(finished_matches_data)) * 100
            draw_percentage = (draws / len(finished_matches_data)) * 100
        else:
            average_goals = 0
            home_win_percentage = 0
            away_win_percentage = 0
            draw_percentage = 0
        
        return MatchStats(
            total_matches=total_matches,
            finished_matches=finished_matches,
            upcoming_matches=upcoming_matches,
            live_matches=live_matches,
            average_goals_per_match=round(average_goals, 2),
            home_win_percentage=round(home_win_percentage, 1),
            away_win_percentage=round(away_win_percentage, 1),
            draw_percentage=round(draw_percentage, 1)
        )
        
    except Exception as e:
        logger.error(f"Get match stats error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve match statistics"
        )
