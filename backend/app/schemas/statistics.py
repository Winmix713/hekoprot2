from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from datetime import datetime
import uuid

class TeamAnalysisResponse(BaseModel):
    home_team: str
    away_team: str
    matches_count: int
    both_teams_scored_percentage: float
    average_goals: Dict[str, float]
    home_form_index: float
    away_form_index: float
    head_to_head_stats: Dict[str, Any]

class PredictionResponse(BaseModel):
    home_expected_goals: float
    away_expected_goals: float
    both_teams_to_score_prob: float
    predicted_winner: str
    confidence: float
    model_predictions: Dict[str, Any]

class TeamStatsResponse(BaseModel):
    team_id: uuid.UUID
    total_matches: int
    wins: int
    draws: int
    losses: int
    goals_for: int
    goals_against: int
    goal_difference: int
    points: int
    win_percentage: float
    home_record: Dict[str, int]
    away_record: Dict[str, int]
    averages: Dict[str, float]
    form_index: float

class LeagueStatsResponse(BaseModel):
    position: int
    team_id: uuid.UUID
    team_name: str
    matches_played: int
    wins: int
    draws: int
    losses: int
    goals_for: int
    goals_against: int
    goal_difference: int
    points: int
    form: str

class MatchStatsResponse(BaseModel):
    total_matches: int
    average_goals_per_match: float
    both_teams_scored_percentage: float
    home_win_percentage: float
    away_win_percentage: float
    draw_percentage: float
    over_2_5_goals_percentage: float
    under_2_5_goals_percentage: float
    clean_sheets_percentage: float
