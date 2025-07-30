from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
import logging
from decimal import Decimal

from app.models.database import Match, Team, TeamStats, Season
from app.core.config import settings

logger = logging.getLogger(__name__)

class StatisticsService:
    """Service for calculating football statistics and analytics"""
    
    def __init__(self):
        pass
    
    async def calculate_both_teams_scored_percentage(self, db: AsyncSession, matches: List[Match]) -> float:
        """Calculate percentage of matches where both teams scored"""
        if not matches:
            return 0.0
        
        finished_matches = [m for m in matches if m.status == 'finished' and m.home_goals is not None and m.away_goals is not None]
        
        if not finished_matches:
            return 0.0
        
        both_scored_count = sum(1 for m in finished_matches if m.home_goals > 0 and m.away_goals > 0)
        
        return round((both_scored_count / len(finished_matches)) * 100, 2)
    
    async def calculate_average_goals(self, db: AsyncSession, matches: List[Match]) -> Dict[str, float]:
        """Calculate average goals statistics"""
        finished_matches = [m for m in matches if m.status == 'finished' and m.home_goals is not None and m.away_goals is not None]
        
        if not finished_matches:
            return {
                'average_total_goals': 0.0,
                'average_home_goals': 0.0,
                'average_away_goals': 0.0
            }
        
        total_matches = len(finished_matches)
        total_goals = sum((m.home_goals or 0) + (m.away_goals or 0) for m in finished_matches)
        home_goals = sum(m.home_goals or 0 for m in finished_matches)
        away_goals = sum(m.away_goals or 0 for m in finished_matches)
        
        return {
            'average_total_goals': round(total_goals / total_matches, 2),
            'average_home_goals': round(home_goals / total_matches, 2),
            'average_away_goals': round(away_goals / total_matches, 2)
        }
    
    async def calculate_form_index(self, db: AsyncSession, team_id: str, before_date: datetime = None, recent_games: int = 5) -> float:
        """Calculate team form index based on recent games"""
        try:
            query = select(Match).where(
                or_(Match.home_team_id == team_id, Match.away_team_id == team_id),
                Match.status == 'finished',
                Match.is_deleted == False
            )
            
            if before_date:
                query = query.where(Match.match_date < before_date)
            
            query = query.order_by(Match.match_date.desc()).limit(recent_games)
            
            result = await db.execute(query)
            recent_matches = result.scalars().all()
            
            if not recent_matches:
                return 0.0
            
            points = 0
            for match in recent_matches:
                if match.home_team_id == team_id:
                    # Team was home
                    if match.winner == 'home':
                        points += 3
                    elif match.winner == 'draw':
                        points += 1
                else:
                    # Team was away
                    if match.winner == 'away':
                        points += 3
                    elif match.winner == 'draw':
                        points += 1
            
            max_possible_points = len(recent_matches) * 3
            return round((points / max_possible_points) * 100, 2) if max_possible_points > 0 else 0.0
            
        except Exception as e:
            logger.error(f"Error calculating form index: {str(e)}")
            return 0.0
    
    async def calculate_head_to_head_stats(self, db: AsyncSession, home_team_id: str, away_team_id: str, limit: int = 10) -> Dict[str, Any]:
        """Calculate head-to-head statistics between two teams"""
        try:
            # Get head-to-head matches
            result = await db.execute(
                select(Match).where(
                    or_(
                        and_(Match.home_team_id == home_team_id, Match.away_team_id == away_team_id),
                        and_(Match.home_team_id == away_team_id, Match.away_team_id == home_team_id)
                    ),
                    Match.status == 'finished',
                    Match.is_deleted == False
                ).order_by(Match.match_date.desc()).limit(limit)
            )
            h2h_matches = result.scalars().all()
            
            if not h2h_matches:
                return {
                    'total_matches': 0,
                    'home_wins': 0,
                    'away_wins': 0,
                    'draws': 0,
                    'home_win_percentage': 0.0,
                    'away_win_percentage': 0.0,
                    'draw_percentage': 0.0,
                    'home_goals_avg': 0.0,
                    'away_goals_avg': 0.0,
                    'both_teams_scored_percentage': 0.0
                }
            
            home_wins = 0
            away_wins = 0
            draws = 0
            home_goals_total = 0
            away_goals_total = 0
            both_scored_count = 0
            
            for match in h2h_matches:
                if match.home_team_id == home_team_id:
                    # Current home team was home in this H2H match
                    home_goals_total += match.home_goals or 0
                    away_goals_total += match.away_goals or 0
                    
                    if match.winner == 'home':
                        home_wins += 1
                    elif match.winner == 'away':
                        away_wins += 1
                    else:
                        draws += 1
                else:
                    # Current home team was away in this H2H match
                    home_goals_total += match.away_goals or 0
                    away_goals_total += match.home_goals or 0
                    
                    if match.winner == 'away':
                        home_wins += 1
                    elif match.winner == 'home':
                        away_wins += 1
                    else:
                        draws += 1
                
                # Check if both teams scored
                if (match.home_goals or 0) > 0 and (match.away_goals or 0) > 0:
                    both_scored_count += 1
            
            total_matches = len(h2h_matches)
            
            return {
                'total_matches': total_matches,
                'home_wins': home_wins,
                'away_wins': away_wins,
                'draws': draws,
                'home_win_percentage': round((home_wins / total_matches) * 100, 2),
                'away_win_percentage': round((away_wins / total_matches) * 100, 2),
                'draw_percentage': round((draws / total_matches) * 100, 2),
                'home_goals_avg': round(home_goals_total / total_matches, 2),
                'away_goals_avg': round(away_goals_total / total_matches, 2),
                'both_teams_scored_percentage': round((both_scored_count / total_matches) * 100, 2)
            }
            
        except Exception as e:
            logger.error(f"Error calculating H2H stats: {str(e)}")
            return {
                'total_matches': 0,
                'home_wins': 0,
                'away_wins': 0,
                'draws': 0,
                'home_win_percentage': 0.0,
                'away_win_percentage': 0.0,
                'draw_percentage': 0.0,
                'home_goals_avg': 0.0,
                'away_goals_avg': 0.0,
                'both_teams_scored_percentage': 0.0
            }
    
    async def calculate_expected_goals(self, db: AsyncSession, team_id: str, is_home: bool = True, limit: int = 10) -> float:
        """Calculate expected goals for a team based on recent performance"""
        try:
            if is_home:
                query = select(Match).where(
                    Match.home_team_id == team_id,
                    Match.status == 'finished',
                    Match.is_deleted == False
                )
            else:
                query = select(Match).where(
                    Match.away_team_id == team_id,
                    Match.status == 'finished',
                    Match.is_deleted == False
                )
            
            query = query.order_by(Match.match_date.desc()).limit(limit)
            
            result = await db.execute(query)
            recent_matches = result.scalars().all()
            
            if not recent_matches:
                return 0.0
            
            total_goals = 0
            for match in recent_matches:
                if is_home:
                    total_goals += match.home_goals or 0
                else:
                    total_goals += match.away_goals or 0
            
            return round(total_goals / len(recent_matches), 2)
            
        except Exception as e:
            logger.error(f"Error calculating expected goals: {str(e)}")
            return 0.0
    
    async def calculate_both_teams_to_score_probability(self, db: AsyncSession, home_team_id: str, away_team_id: str) -> float:
        """Calculate probability of both teams to score based on recent matches"""
        try:
            # Get recent matches for both teams
            home_matches_result = await db.execute(
                select(Match).where(
                    or_(Match.home_team_id == home_team_id, Match.away_team_id == home_team_id),
                    Match.status == 'finished',
                    Match.is_deleted == False
                ).order_by(Match.match_date.desc()).limit(10)
            )
            home_matches = home_matches_result.scalars().all()
            
            away_matches_result = await db.execute(
                select(Match).where(
                    or_(Match.home_team_id == away_team_id, Match.away_team_id == away_team_id),
                    Match.status == 'finished',
                    Match.is_deleted == False
                ).order_by(Match.match_date.desc()).limit(10)
            )
            away_matches = away_matches_result.scalars().all()
            
            # Combine and get unique matches
            all_matches = list(set(home_matches + away_matches))
            
            if not all_matches:
                return 0.0
            
            both_scored_count = sum(1 for m in all_matches if (m.home_goals or 0) > 0 and (m.away_goals or 0) > 0)
            
            return round((both_scored_count / len(all_matches)) * 100, 2)
            
        except Exception as e:
            logger.error(f"Error calculating BTTS probability: {str(e)}")
            return 0.0
    
    async def predict_winner_simple(self, db: AsyncSession, home_team_id: str, away_team_id: str) -> Dict[str, Any]:
        """Simple winner prediction based on head-to-head and form"""
        try:
            # Get H2H stats
            h2h_stats = await self.calculate_head_to_head_stats(db, home_team_id, away_team_id)
            
            # Get form indices
            home_form = await self.calculate_form_index(db, home_team_id)
            away_form = await self.calculate_form_index(db, away_team_id)
            
            # Simple prediction logic
            if h2h_stats['total_matches'] == 0:
                # No H2H data, use form
                if home_form > away_form + 10:  # Home advantage + form
                    return {'winner': 'home', 'confidence': 0.6}
                elif away_form > home_form + 5:  # Away team significantly better
                    return {'winner': 'away', 'confidence': 0.55}
                else:
                    return {'winner': 'draw', 'confidence': 0.4}
            
            # Use H2H data with form adjustment
            home_h2h_rate = h2h_stats['home_win_percentage'] / 100
            away_h2h_rate = h2h_stats['away_win_percentage'] / 100
            draw_h2h_rate = h2h_stats['draw_percentage'] / 100
            
            # Adjust with form (simple weighted average)
            form_weight = 0.3
            h2h_weight = 0.7
            
            home_prob = (h2h_weight * home_h2h_rate) + (form_weight * (home_form / 100))
            away_prob = (h2h_weight * away_h2h_rate) + (form_weight * (away_form / 100))
            draw_prob = (h2h_weight * draw_h2h_rate) + (form_weight * 0.25)  # Base draw probability
            
            # Normalize probabilities
            total_prob = home_prob + away_prob + draw_prob
            if total_prob > 0:
                home_prob /= total_prob
                away_prob /= total_prob
                draw_prob /= total_prob
            
            # Determine winner
            if home_prob > away_prob and home_prob > draw_prob:
                return {'winner': 'home', 'confidence': round(home_prob, 2)}
            elif away_prob > home_prob and away_prob > draw_prob:
                return {'winner': 'away', 'confidence': round(away_prob, 2)}
            else:
                return {'winner': 'draw', 'confidence': round(draw_prob, 2)}
                
        except Exception as e:
            logger.error(f"Error predicting winner: {str(e)}")
            return {'winner': 'unknown', 'confidence': 0.0}
    
    async def run_comprehensive_prediction(self, db: AsyncSession, home_team_id: str, away_team_id: str) -> Dict[str, Any]:
        """Run comprehensive prediction analysis similar to PHP version"""
        try:
            # Calculate expected goals
            home_expected_goals = await self.calculate_expected_goals(db, home_team_id, is_home=True)
            away_expected_goals = await self.calculate_expected_goals(db, away_team_id, is_home=False)
            
            # Calculate BTTS probability
            btts_prob = await self.calculate_both_teams_to_score_probability(db, home_team_id, away_team_id)
            
            # Get winner prediction
            winner_prediction = await self.predict_winner_simple(db, home_team_id, away_team_id)
            
            # Calculate win probabilities (ELO-style)
            win_probabilities = await self.calculate_win_probabilities(db, home_team_id, away_team_id)
            
            return {
                'home_expected_goals': home_expected_goals,
                'away_expected_goals': away_expected_goals,
                'both_teams_to_score_prob': btts_prob,
                'predicted_winner': winner_prediction['winner'],
                'confidence': winner_prediction['confidence'],
                'model_predictions': {
                    'simple_model': {
                        'winner': winner_prediction['winner'],
                        'confidence': winner_prediction['confidence']
                    },
                    'poisson': {
                        'home_goals': round(home_expected_goals),
                        'away_goals': round(away_expected_goals)
                    },
                    'elo': {
                        'home_win_prob': win_probabilities['home_win_prob'],
                        'draw_prob': win_probabilities['draw_prob'],
                        'away_win_prob': win_probabilities['away_win_prob']
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error running comprehensive prediction: {str(e)}")
            return {
                'home_expected_goals': 0.0,
                'away_expected_goals': 0.0,
                'both_teams_to_score_prob': 0.0,
                'predicted_winner': 'unknown',
                'confidence': 0.0,
                'model_predictions': {
                    'simple_model': {'winner': 'unknown', 'confidence': 0.0},
                    'poisson': {'home_goals': 0, 'away_goals': 0},
                    'elo': {'home_win_prob': 0.33, 'draw_prob': 0.33, 'away_win_prob': 0.33}
                }
            }
    
    async def calculate_win_probabilities(self, db: AsyncSession, home_team_id: str, away_team_id: str) -> Dict[str, float]:
        """Calculate win probabilities using ELO-like system"""
        try:
            # Get team stats for current season
            current_season_result = await db.execute(
                select(Season).where(Season.is_active == True)
            )
            current_season = current_season_result.scalar_one_or_none()
            
            if not current_season:
                return {'home_win_prob': 0.33, 'draw_prob': 0.33, 'away_win_prob': 0.33}
            
            # Get team stats
            home_stats_result = await db.execute(
                select(TeamStats).where(
                    TeamStats.team_id == home_team_id,
                    TeamStats.season_id == current_season.id
                )
            )
            home_stats = home_stats_result.scalar_one_or_none()
            
            away_stats_result = await db.execute(
                select(TeamStats).where(
                    TeamStats.team_id == away_team_id,
                    TeamStats.season_id == current_season.id
                )
            )
            away_stats = away_stats_result.scalar_one_or_none()
            
            if not home_stats or not away_stats:
                return {'home_win_prob': 0.33, 'draw_prob': 0.33, 'away_win_prob': 0.33}
            
            # Simple ELO-like calculation based on points and goal difference
            home_rating = (home_stats.points * 2) + home_stats.goal_difference
            away_rating = (away_stats.points * 2) + away_stats.goal_difference
            
            # Home advantage
            home_rating += 3
            
            # Calculate probabilities
            rating_diff = home_rating - away_rating
            
            # Sigmoid-like function for probabilities
            if rating_diff > 10:
                home_prob = 0.65
                away_prob = 0.20
                draw_prob = 0.15
            elif rating_diff > 5:
                home_prob = 0.55
                away_prob = 0.25
                draw_prob = 0.20
            elif rating_diff > -5:
                home_prob = 0.45
                away_prob = 0.30
                draw_prob = 0.25
            elif rating_diff > -10:
                home_prob = 0.30
                away_prob = 0.50
                draw_prob = 0.20
            else:
                home_prob = 0.20
                away_prob = 0.65
                draw_prob = 0.15
            
            return {
                'home_win_prob': round(home_prob, 2),
                'draw_prob': round(draw_prob, 2),
                'away_win_prob': round(away_prob, 2)
            }
            
        except Exception as e:
            logger.error(f"Error calculating win probabilities: {str(e)}")
            return {'home_win_prob': 0.33, 'draw_prob': 0.33, 'away_win_prob': 0.33}
    
    async def get_team_analysis(self, db: AsyncSession, home_team_id: str, away_team_id: str, season_id: str = None) -> Dict[str, Any]:
        """Get comprehensive team analysis similar to PHP version"""
        try:
            # Get team info
            home_team_result = await db.execute(
                select(Team).where(Team.id == home_team_id)
            )
            home_team = home_team_result.scalar_one_or_none()
            
            away_team_result = await db.execute(
                select(Team).where(Team.id == away_team_id)
            )
            away_team = away_team_result.scalar_one_or_none()
            
            if not home_team or not away_team:
                return {}
            
            # Get matches between these teams
            h2h_matches_result = await db.execute(
                select(Match).where(
                    or_(
                        and_(Match.home_team_id == home_team_id, Match.away_team_id == away_team_id),
                        and_(Match.home_team_id == away_team_id, Match.away_team_id == home_team_id)
                    ),
                    Match.status == 'finished',
                    Match.is_deleted == False
                ).order_by(Match.match_date.desc())
            )
            h2h_matches = h2h_matches_result.scalars().all()
            
            # Calculate statistics
            both_teams_scored_pct = await self.calculate_both_teams_scored_percentage(db, h2h_matches)
            average_goals = await self.calculate_average_goals(db, h2h_matches)
            home_form = await self.calculate_form_index(db, home_team_id)
            away_form = await self.calculate_form_index(db, away_team_id)
            h2h_stats = await self.calculate_head_to_head_stats(db, home_team_id, away_team_id)
            
            return {
                'home_team': home_team.name,
                'away_team': away_team.name,
                'matches_count': len(h2h_matches),
                'both_teams_scored_percentage': both_teams_scored_pct,
                'average_goals': average_goals,
                'home_form_index': home_form,
                'away_form_index': away_form,
                'head_to_head_stats': h2h_stats
            }
            
        except Exception as e:
            logger.error(f"Error getting team analysis: {str(e)}")
            return {}

# Global statistics service instance
statistics_service = StatisticsService()
