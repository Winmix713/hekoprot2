from pydantic import BaseModel, validator
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

class MatchBase(BaseModel):
    home_team_id: uuid.UUID
    away_team_id: uuid.UUID
    season_id: uuid.UUID
    match_date: datetime
    home_goals: Optional[int] = None
    away_goals: Optional[int] = None
    status: str = "scheduled"
    winner: Optional[str] = None
    attendance: Optional[int] = None
    referee: Optional[str] = None
    weather_conditions: Optional[Dict[str, Any]] = None

    @validator('status')
    def validate_status(cls, v):
        allowed_statuses = ['scheduled', 'live', 'finished', 'postponed', 'cancelled']
        if v not in allowed_statuses:
            raise ValueError(f'Status must be one of: {allowed_statuses}')
        return v

    @validator('winner')
    def validate_winner(cls, v):
        if v is not None:
            allowed_winners = ['home', 'away', 'draw']
            if v not in allowed_winners:
                raise ValueError(f'Winner must be one of: {allowed_winners}')
        return v

    @validator('home_team_id', 'away_team_id')
    def validate_different_teams(cls, v, values):
        if 'home_team_id' in values and v == values['home_team_id']:
            raise ValueError('Home and away teams must be different')
        return v

class MatchCreate(MatchBase):
    pass

class MatchUpdate(BaseModel):
    home_team_id: Optional[uuid.UUID] = None
    away_team_id: Optional[uuid.UUID] = None
    season_id: Optional[uuid.UUID] = None
    match_date: Optional[datetime] = None
    home_goals: Optional[int] = None
    away_goals: Optional[int] = None
    status: Optional[str] = None
    winner: Optional[str] = None
    attendance: Optional[int] = None
    referee: Optional[str] = None
    weather_conditions: Optional[Dict[str, Any]] = None

class TeamInfo(BaseModel):
    id: uuid.UUID
    name: str
    short_code: str
    logo_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class SeasonInfo(BaseModel):
    id: uuid.UUID
    name: str
    is_active: bool
    
    class Config:
        from_attributes = True

class Match(MatchBase):
    id: uuid.UUID
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    home_team: TeamInfo
    away_team: TeamInfo
    season: SeasonInfo
    
    class Config:
        from_attributes = True

class MatchList(BaseModel):
    matches: list[Match]
    total: int
    page: int
    size: int
    pages: int

class MatchStats(BaseModel):
    total_matches: int
    finished_matches: int
    upcoming_matches: int
    live_matches: int
    average_goals_per_match: float
    home_win_percentage: float
    away_win_percentage: float
    draw_percentage: float
