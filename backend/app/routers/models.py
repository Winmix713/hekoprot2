from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime
import uuid
import logging
import os

from app.database import get_db
from app.models.database import Model, TrainingLog, User
from app.schemas.models import (
    ModelCreate, ModelUpdate, Model as ModelSchema, ModelList,
    TrainingLogCreate, TrainingLog as TrainingLogSchema,
    ModelStats, TrainModelRequest
)
from app.core.security import get_current_user
from app.services.ml_service import MLService
from app.tasks.model_tasks import train_model_task
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=ModelList)
async def get_models(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    is_active: Optional[bool] = Query(None),
    algorithm: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get models with filtering and pagination"""
    try:
        # Build query
        query = select(Model).where(Model.is_deleted == False)
        
        # Apply filters
        if is_active is not None:
            query = query.where(Model.is_active == is_active)
        
        if algorithm:
            query = query.where(Model.algorithm == algorithm)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.order_by(Model.created_at.desc())
        query = query.offset((page - 1) * size).limit(size)
        
        # Execute query
        result = await db.execute(query)
        models = result.scalars().all()
        
        return ModelList(
            models=models,
            total=total,
            page=page,
            size=size,
            pages=(total + size - 1) // size
        )
        
    except Exception as e:
        logger.error(f"Get models error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve models"
        )

@router.get("/current", response_model=ModelSchema)
async def get_current_model(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get currently active model"""
    try:
        result = await db.execute(
            select(Model).where(
                Model.is_active == True,
                Model.is_deleted == False
            ).order_by(Model.trained_at.desc())
        )
        model = result.scalar_one_or_none()
        
        if not model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active model found"
            )
        
        return model
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get current model error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve current model"
        )

@router.get("/{model_id}", response_model=ModelSchema)
async def get_model(
    model_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get model by ID"""
    try:
        result = await db.execute(
            select(Model).where(
                Model.id == model_id,
                Model.is_deleted == False
            )
        )
        model = result.scalar_one_or_none()
        
        if not model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Model not found"
            )
        
        return model
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get model error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve model"
        )

@router.post("/", response_model=ModelSchema)
async def create_model(
    model_data: ModelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new model"""
    try:
        # Check if model with same name and version exists
        existing_result = await db.execute(
            select(Model).where(
                Model.name == model_data.name,
                Model.version == model_data.version,
                Model.is_deleted == False
            )
        )
        existing_model = existing_result.scalar_one_or_none()
        
        if existing_model:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Model with this name and version already exists"
            )
        
        # Create model
        model = Model(
            **model_data.dict(),
            created_by=current_user.id
        )
        db.add(model)
        await db.commit()
        await db.refresh(model)
        
        logger.info(f"Model created: {model.id}")
        return model
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create model error: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create model"
        )

@router.post("/train")
async def train_model(
    request: TrainModelRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start model training"""
    try:
        # Validate model exists
        model_result = await db.execute(
            select(Model).where(
                Model.id == request.model_id,
                Model.is_deleted == False
            )
        )
        model = model_result.scalar_one_or_none()
        
        if not model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Model not found"
            )
        
        # Create training log
        training_log = TrainingLog(
            model_id=request.model_id,
            training_config=request.training_config or {}
        )
        db.add(training_log)
        await db.commit()
        await db.refresh(training_log)
        
        # Add background task to train model
        background_tasks.add_task(
            train_model_task,
            training_log.id,
            request.training_data_config
        )
        
        logger.info(f"Model training started: {model.id}")
        
        return {
            "message": "Model training started",
            "training_log_id": training_log.id,
            "status": "running"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Train model error: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start model training"
        )

@router.put("/{model_id}", response_model=ModelSchema)
async def update_model(
    model_id: uuid.UUID,
    model_data: ModelUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update model"""
    try:
        # Get existing model
        result = await db.execute(
            select(Model).where(
                Model.id == model_id,
                Model.is_deleted == False
            )
        )
        model = result.scalar_one_or_none()
        
        if not model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Model not found"
            )
        
        # If setting as active, deactivate other models
        if model_data.is_active:
            await db.execute(
                select(Model).where(Model.is_active == True).update({"is_active": False})
            )
        
        # Update fields
        update_data = model_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(model, field, value)
        
        await db.commit()
        await db.refresh(model)
        
        logger.info(f"Model updated: {model.id}")
        return model
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update model error: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update model"
        )

@router.delete("/{model_id}")
async def delete_model(
    model_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete model (soft delete)"""
    try:
        result = await db.execute(
            select(Model).where(
                Model.id == model_id,
                Model.is_deleted == False
            )
        )
        model = result.scalar_one_or_none()
        
        if not model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Model not found"
            )
        
        model.is_deleted = True
        model.is_active = False
        await db.commit()
        
        logger.info(f"Model deleted: {model.id}")
        return {"message": "Model deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete model error: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete model"
        )

@router.get("/{model_id}/training-history", response_model=List[TrainingLogSchema])
async def get_model_training_history(
    model_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get model training history"""
    try:
        result = await db.execute(
            select(TrainingLog).where(
                TrainingLog.model_id == model_id
            ).order_by(TrainingLog.started_at.desc())
        )
        training_logs = result.scalars().all()
        
        return training_logs
        
    except Exception as e:
        logger.error(f"Get training history error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve training history"
        )

@router.get("/stats/overview", response_model=ModelStats)
async def get_model_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get model statistics"""
    try:
        # Get all models
        models_result = await db.execute(
            select(Model).where(Model.is_deleted == False)
        )
        models = models_result.scalars().all()
        
        total_models = len(models)
        active_models = len([m for m in models if m.is_active])
        
        # Get training logs
        logs_result = await db.execute(
            select(TrainingLog).order_by(TrainingLog.started_at.desc())
        )
        training_logs = logs_result.scalars().all()
        
        recent_trainings = len([log for log in training_logs if log.started_at >= datetime.utcnow().replace(day=1)])
        successful_trainings = len([log for log in training_logs if log.status == 'completed'])
        failed_trainings = len([log for log in training_logs if log.status == 'failed'])
        
        # Calculate average accuracy
        trained_models = [m for m in models if m.accuracy is not None]
        average_accuracy = sum(m.accuracy for m in trained_models) / len(trained_models) if trained_models else 0
        
        # Best performing model
        best_model = max(trained_models, key=lambda m: m.accuracy) if trained_models else None
        
        return ModelStats(
            total_models=total_models,
            active_models=active_models,
            recent_trainings=recent_trainings,
            successful_trainings=successful_trainings,
            failed_trainings=failed_trainings,
            average_accuracy=round(float(average_accuracy), 2),
            best_model_name=f"{best_model.name} {best_model.version}" if best_model else None,
            best_model_accuracy=float(best_model.accuracy) if best_model else None
        )
        
    except Exception as e:
        logger.error(f"Get model stats error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve model statistics"
        )
