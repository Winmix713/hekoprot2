from pydantic import BaseModel, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from decimal import Decimal
import uuid

class PredictionBase(BaseModel):
    match_id: uuid.UUID
    predicted_winner: Optional[str] = None
    home_expected_goals: Optional[Decimal] = None
    away_expected_goals: Optional[Decimal] = None
    home_win_probability: Optional[Decimal] = None
    draw_probability: Optional[Decimal] = None
    away_win_probability: Optional[Decimal] = None
    confidence_score: Decimal
    features_used: Optional[Dict[str, Any]] = None

    @validator('predicted_winner')
    def validate_predicted_winner(cls, v):
        if v is not None:
            allowed_winners = ['home', 'away', 'draw']
            if v not in allowed_winners:
                raise ValueError(f'Predicted winner must be one of: {allowed_winners}')
        return v

    @validator('confidence_score')
    def validate_confidence_score(cls, v):
        if not (0 <= v <= 1):
            raise ValueError('Confidence score must be between 0 and 1')
        return v

class PredictionCreate(PredictionBase):
    batch_id: uuid.UUID

class PredictionUpdate(BaseModel):
    predicted_winner: Optional[str] = None
    home_expected_goals: Optional[Decimal] = None
    away_expected_goals: Optional[Decimal] = None
    home_win_probability: Optional[Decimal] = None
    draw_probability: Optional[Decimal] = None
    away_win_probability: Optional[Decimal] = None
    confidence_score: Optional[Decimal] = None
    result_status: Optional[str] = None
    features_used: Optional[Dict[str, Any]] = None

class PredictionBatchBase(BaseModel):
    model_id: uuid.UUID
    description: Optional[str] = None

class PredictionBatchCreate(PredictionBatchBase):
    pass

class PredictionBatch(PredictionBatchBase):
    id: uuid.UUID
    run_date: datetime
    total_predictions: int
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class MatchInfo(BaseModel):
    id: uuid.UUID
    home_team_name: str
    away_team_name: str
    match_date: datetime
    status: str
    home_goals: Optional[int] = None
    away_goals: Optional[int] = None
    winner: Optional[str] = None

class ModelInfo(BaseModel):
    id: uuid.UUID
    name: str
    version: str
    algorithm: str
    accuracy: Optional[Decimal] = None
    
    class Config:
        from_attributes = True

class Prediction(PredictionBase):
    id: uuid.UUID
    batch_id: uuid.UUID
    result_status: str
    created_at: datetime
    match: MatchInfo
    
    class Config:
        from_attributes = True

class PredictionWithModel(Prediction):
    model: ModelInfo

class PredictionList(BaseModel):
    predictions: List[Prediction]
    total: int
    page: int
    size: int
    pages: int

class PredictionStats(BaseModel):
    total_predictions: int
    correct_predictions: int
    wrong_predictions: int
    pending_predictions: int
    overall_accuracy: float
    accuracy_by_confidence: Dict[str, Dict[str, Any]]
    accuracy_by_model: Dict[str, Dict[str, Any]]

class GeneratePredictionsRequest(BaseModel):
    model_id: uuid.UUID
    match_ids: Optional[List[uuid.UUID]] = None
    description: Optional[str] = None

class EvaluatePredictionsRequest(BaseModel):
    prediction_ids: Optional[List[uuid.UUID]] = None
    batch_id: Optional[uuid.UUID] = None
