from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, DECIMAL, ForeignKey, JSON, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="admin")
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    created_models = relationship("Model", back_populates="creator")
    prediction_batches = relationship("PredictionBatch", back_populates="creator")
    logs = relationship("Log", back_populates="user")

class Season(Base):
    __tablename__ = "seasons"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    is_active = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # Relationships
    matches = relationship("Match", back_populates="season")
    team_stats = relationship("TeamStats", back_populates="season")

class Team(Base):
    __tablename__ = "teams"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    short_code = Column(String, unique=True, nullable=False)
    founded = Column(Integer)
    logo_url = Column(String)
    home_stadium = Column(String)
    manager = Column(String)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    home_matches = relationship("Match", foreign_keys="Match.home_team_id", back_populates="home_team")
    away_matches = relationship("Match", foreign_keys="Match.away_team_id", back_populates="away_team")
    team_stats = relationship("TeamStats", back_populates="team")

class Match(Base):
    __tablename__ = "matches"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    home_team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=False)
    away_team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=False)
    season_id = Column(UUID(as_uuid=True), ForeignKey("seasons.id"), nullable=False)
    match_date = Column(TIMESTAMP(timezone=True), nullable=False)
    home_goals = Column(Integer)
    away_goals = Column(Integer)
    status = Column(String, default="scheduled")
    winner = Column(String)
    attendance = Column(Integer)
    referee = Column(String)
    weather_conditions = Column(JSONB)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    home_team = relationship("Team", foreign_keys=[home_team_id], back_populates="home_matches")
    away_team = relationship("Team", foreign_keys=[away_team_id], back_populates="away_matches")
    season = relationship("Season", back_populates="matches")
    predictions = relationship("Prediction", back_populates="match")

class Model(Base):
    __tablename__ = "models"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    version = Column(String, nullable=False)
    algorithm = Column(String, nullable=False)
    parameters = Column(JSONB, default={})
    features = Column(JSONB, default=[])
    trained_at = Column(TIMESTAMP(timezone=True))
    accuracy = Column(DECIMAL(5, 2))
    precision_score = Column(DECIMAL(5, 2))
    recall_score = Column(DECIMAL(5, 2))
    f1_score = Column(DECIMAL(5, 2))
    is_active = Column(Boolean, default=False)
    model_file_path = Column(String)
    notes = Column(Text)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    is_deleted = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="created_models")
    prediction_batches = relationship("PredictionBatch", back_populates="model")
    training_logs = relationship("TrainingLog", back_populates="model")

class PredictionBatch(Base):
    __tablename__ = "prediction_batches"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_id = Column(UUID(as_uuid=True), ForeignKey("models.id"), nullable=False)
    run_date = Column(TIMESTAMP(timezone=True), server_default=func.now())
    description = Column(Text)
    total_predictions = Column(Integer, default=0)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # Relationships
    model = relationship("Model", back_populates="prediction_batches")
    creator = relationship("User", back_populates="prediction_batches")
    predictions = relationship("Prediction", back_populates="batch")

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id = Column(UUID(as_uuid=True), ForeignKey("matches.id"), nullable=False)
    batch_id = Column(UUID(as_uuid=True), ForeignKey("prediction_batches.id"), nullable=False)
    predicted_winner = Column(String)
    home_expected_goals = Column(DECIMAL(4, 2))
    away_expected_goals = Column(DECIMAL(4, 2))
    home_win_probability = Column(DECIMAL(4, 3))
    draw_probability = Column(DECIMAL(4, 3))
    away_win_probability = Column(DECIMAL(4, 3))
    confidence_score = Column(DECIMAL(4, 3), nullable=False)
    result_status = Column(String, default="pending")
    features_used = Column(JSONB, default={})
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # Relationships
    match = relationship("Match", back_populates="predictions")
    batch = relationship("PredictionBatch", back_populates="predictions")

class TrainingLog(Base):
    __tablename__ = "training_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_id = Column(UUID(as_uuid=True), ForeignKey("models.id"), nullable=False)
    started_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    completed_at = Column(TIMESTAMP(timezone=True))
    status = Column(String, default="running")
    accuracy_achieved = Column(DECIMAL(5, 2))
    training_samples = Column(Integer)
    validation_samples = Column(Integer)
    duration = Column(String)
    error_message = Column(Text)
    training_config = Column(JSONB, default={})
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # Relationships
    model = relationship("Model", back_populates="training_logs")

class TeamStats(Base):
    __tablename__ = "team_stats"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=False)
    season_id = Column(UUID(as_uuid=True), ForeignKey("seasons.id"), nullable=False)
    matches_played = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    goals_for = Column(Integer, default=0)
    goals_against = Column(Integer, default=0)
    goal_difference = Column(Integer, default=0)
    points = Column(Integer, default=0)
    home_wins = Column(Integer, default=0)
    home_draws = Column(Integer, default=0)
    home_losses = Column(Integer, default=0)
    away_wins = Column(Integer, default=0)
    away_draws = Column(Integer, default=0)
    away_losses = Column(Integer, default=0)
    form_last_5 = Column(String)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    team = relationship("Team", back_populates="team_stats")
    season = relationship("Season", back_populates="team_stats")

class Log(Base):
    __tablename__ = "logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    action_type = Column(String, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    resource_type = Column(String)
    resource_id = Column(UUID(as_uuid=True))
    metadata = Column(JSONB, default={})
    ip_address = Column(INET)
    user_agent = Column(Text)
    timestamp = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="logs")
