from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime
import uuid
import logging

from app.database import get_db
from app.models.database import Prediction, PredictionBatch, Match, Model, Team, User
from app.schemas.predictions import (
    PredictionCreate, PredictionUpdate, Prediction as PredictionSchema,
    PredictionList, PredictionStats, GeneratePredictionsRequest,
    EvaluatePredictionsRequest, PredictionBatchCreate, PredictionBatch as PredictionBatchSchema
)
from app.core.security import get_current_user
from app.services.ml_service import MLService
from app.tasks.prediction_tasks import generate_predictions_task, evaluate_predictions_task

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=PredictionList)
async def get_predictions(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    model_id: Optional[uuid.UUID] = Query(None),
    batch_id: Optional[uuid.UUID] = Query(None),
    match_id: Optional[uuid.UUID] = Query(None),
    confidence_min: Optional[float] = Query(None, ge=0, le=1),
    confidence_max: Optional[float] = Query(None, ge=0, le=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get predictions with filtering and pagination"""
    try:
        # Build query
        query = select(Prediction).options(
            selectinload(Prediction.match).selectinload(Match.home_team),
            selectinload(Prediction.match).selectinload(Match.away_team),
            selectinload(Prediction.batch).selectinload(PredictionBatch.model)
        )
        
        # Apply filters
        if status:
            query = query.where(Prediction.result_status == status)
        
        if model_id:
            query = query.join(PredictionBatch).where(PredictionBatch.model_id == model_id)
        
        if batch_id:
            query = query.where(Prediction.batch_id == batch_id)
        
        if match_id:
            query = query.where(Prediction.match_id == match_id)
        
        if confidence_min is not None:
            query = query.where(Prediction.confidence_score >= confidence_min)
        
        if confidence_max is not None:
            query = query.where(Prediction.confidence_score <= confidence_max)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.order_by(Prediction.created_at.desc())
        query = query.offset((page - 1) * size).limit(size)
        
        # Execute query
        result = await db.execute(query)
        predictions = result.scalars().all()
        
        # Transform predictions to include match info
        prediction_list = []
        for pred in predictions:
            prediction_dict = {
                "id": pred.id,
                "match_id": pred.match_id,
                "batch_id": pred.batch_id,
                "predicted_winner": pred.predicted_winner,
                "home_expected_goals": pred.home_expected_goals,
                "away_expected_goals": pred.away_expected_goals,
                "home_win_probability": pred.home_win_probability,
                "draw_probability": pred.draw_probability,
                "away_win_probability": pred.away_win_probability,
                "confidence_score": pred.confidence_score,
                "result_status": pred.result_status,
                "features_used": pred.features_used,
                "created_at": pred.created_at,
                "match": {
                    "id": pred.match.id,
                    "home_team_name": pred.match.home_team.name,
                    "away_team_name": pred.match.away_team.name,
                    "match_date": pred.match.match_date,
                    "status": pred.match.status,
                    "home_goals": pred.match.home_goals,
                    "away_goals": pred.match.away_goals,
                    "winner": pred.match.winner
                }
            }
            prediction_list.append(prediction_dict)
        
        return PredictionList(
            predictions=prediction_list,
            total=total,
            page=page,
            size=size,
            pages=(total + size - 1) // size
        )
        
    except Exception as e:
        logger.error(f"Get predictions error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve predictions"
        )

@router.get("/{prediction_id}", response_model=PredictionSchema)
async def get_prediction(
    prediction_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get prediction by ID"""
    try:
        result = await db.execute(
            select(Prediction).options(
                selectinload(Prediction.match).selectinload(Match.home_team),
                selectinload(Prediction.match).selectinload(Match.away_team),
                selectinload(Prediction.batch).selectinload(PredictionBatch.model)
            ).where(Prediction.id == prediction_id)
        )
        prediction = result.scalar_one_or_none()
        
        if not prediction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prediction not found"
            )
        
        return prediction
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get prediction error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve prediction"
        )

@router.post("/generate")
async def generate_predictions(
    request: GeneratePredictionsRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate predictions for matches"""
    try:
        # Validate model exists and is active
        model_result = await db.execute(
            select(Model).where(
                Model.id == request.model_id,
                Model.is_active == True,
                Model.is_deleted == False
            )
        )
        model = model_result.scalar_one_or_none()
        
        if not model:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Model not found or not active"
            )
        
        # Create prediction batch
        batch = PredictionBatch(
            model_id=request.model_id,
            description=request.description or f"Predictions generated at {datetime.utcnow()}",
            created_by=current_user.id
        )
        db.add(batch)
        await db.commit()
        await db.refresh(batch)
        
        # Add background task to generate predictions
        background_tasks.add_task(
            generate_predictions_task,
            batch.id,
            request.match_ids
        )
        
        logger.info(f"Prediction generation started for batch: {batch.id}")
        
        return {
            "message": "Prediction generation started",
            "batch_id": batch.id,
            "status": "processing"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generate predictions error: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start prediction generation"
        )

@router.post("/evaluate")
async def evaluate_predictions(
    request: EvaluatePredictionsRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Evaluate predictions against actual results"""
    try:
        # Add background task to evaluate predictions
        background_tasks.add_task(
            evaluate_predictions_task,
            request.prediction_ids,
            request.batch_id
        )
        
        logger.info("Prediction evaluation started")
        
        return {
            "message": "Prediction evaluation started",
            "status": "processing"
        }
        
    except Exception as e:
        logger.error(f"Evaluate predictions error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start prediction evaluation"
        )

@router.get("/stats/overview", response_model=PredictionStats)
async def get_prediction_stats(
    model_id: Optional[uuid.UUID] = Query(None),
    batch_id: Optional[uuid.UUID] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get prediction statistics"""
    try:
        # Build base query
        query = select(Prediction)
        
        if model_id:
            query = query.join(PredictionBatch).where(PredictionBatch.model_id == model_id)
        
        if batch_id:
            query = query.where(Prediction.batch_id == batch_id)
        
        if date_from:
            query = query.where(Prediction.created_at >= date_from)
        
        if date_to:
            query = query.where(Prediction.created_at <= date_to)
        
        # Get all predictions
        result = await db.execute(query)
        predictions = result.scalars().all()
        
        total_predictions = len(predictions)
        correct_predictions = len([p for p in predictions if p.result_status == 'correct'])
        wrong_predictions = len([p for p in predictions if p.result_status == 'wrong'])
        pending_predictions = len([p for p in predictions if p.result_status == 'pending'])
        
        overall_accuracy = (correct_predictions / (correct_predictions + wrong_predictions)) * 100 if (correct_predictions + wrong_predictions) > 0 else 0
        
        # Accuracy by confidence ranges
        confidence_ranges = {
            "0.5-0.6": [p for p in predictions if 0.5 <= p.confidence_score < 0.6],
            "0.6-0.7": [p for p in predictions if 0.6 <= p.confidence_score < 0.7],
            "0.7-0.8": [p for p in predictions if 0.7 <= p.confidence_score < 0.8],
            "0.8-0.9": [p for p in predictions if 0.8 <= p.confidence_score < 0.9],
            "0.9-1.0": [p for p in predictions if 0.9 <= p.confidence_score <= 1.0]
        }
        
        accuracy_by_confidence = {}
        for range_name, range_predictions in confidence_ranges.items():
            if range_predictions:
                correct = len([p for p in range_predictions if p.result_status == 'correct'])
                total = len([p for p in range_predictions if p.result_status in ['correct', 'wrong']])
                accuracy = (correct / total) * 100 if total > 0 else 0
                accuracy_by_confidence[range_name] = {
                    "total": len(range_predictions),
                    "correct": correct,
                    "accuracy": round(accuracy, 1)
                }
        
        # Accuracy by model (if not filtered by specific model)
        accuracy_by_model = {}
        if not model_id:
            # Get predictions with model info
            model_query = select(Prediction).options(
                selectinload(Prediction.batch).selectinload(PredictionBatch.model)
            )
            model_result = await db.execute(model_query)
            model_predictions = model_result.scalars().all()
            
            model_groups = {}
            for pred in model_predictions:
                model_name = f"{pred.batch.model.name} {pred.batch.model.version}"
                if model_name not in model_groups:
                    model_groups[model_name] = []
                model_groups[model_name].append(pred)
            
            for model_name, model_preds in model_groups.items():
                correct = len([p for p in model_preds if p.result_status == 'correct'])
                total = len([p for p in model_preds if p.result_status in ['correct', 'wrong']])
                accuracy = (correct / total) * 100 if total > 0 else 0
                accuracy_by_model[model_name] = {
                    "total": len(model_preds),
                    "correct": correct,
                    "accuracy": round(accuracy, 1)
                }
        
        return PredictionStats(
            total_predictions=total_predictions,
            correct_predictions=correct_predictions,
            wrong_predictions=wrong_predictions,
            pending_predictions=pending_predictions,
            overall_accuracy=round(overall_accuracy, 1),
            accuracy_by_confidence=accuracy_by_confidence,
            accuracy_by_model=accuracy_by_model
        )
        
    except Exception as e:
        logger.error(f"Get prediction stats error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve prediction statistics"
        )

@router.get("/batches/", response_model=List[PredictionBatchSchema])
async def get_prediction_batches(
    model_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get prediction batches"""
    try:
        query = select(PredictionBatch).options(
            selectinload(PredictionBatch.model)
        ).order_by(PredictionBatch.created_at.desc())
        
        if model_id:
            query = query.where(PredictionBatch.model_id == model_id)
        
        result = await db.execute(query)
        batches = result.scalars().all()
        
        return batches
        
    except Exception as e:
        logger.error(f"Get prediction batches error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve prediction batches"
        )
