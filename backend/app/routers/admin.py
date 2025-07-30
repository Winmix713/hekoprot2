from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import logging
import json

from app.database import get_db
from app.models.database import Log, User, Match, Prediction, Model
from app.core.security import get_current_user
from app.schemas.admin import LogEntry, SystemConfig, ExportRequest

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/logs")
async def get_logs(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    action_type: Optional[str] = Query(None),
    user_id: Optional[uuid.UUID] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get system logs with filtering and pagination"""
    try:
        # Build query
        query = select(Log).options(
            selectinload(Log.user)
        )
        
        # Apply filters
        if action_type:
            query = query.where(Log.action_type == action_type)
        
        if user_id:
            query = query.where(Log.user_id == user_id)
        
        if date_from:
            query = query.where(Log.timestamp >= date_from)
        
        if date_to:
            query = query.where(Log.timestamp <= date_to)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.order_by(Log.timestamp.desc())
        query = query.offset((page - 1) * size).limit(size)
        
        # Execute query
        result = await db.execute(query)
        logs = result.scalars().all()
        
        # Transform to response format
        log_entries = []
        for log in logs:
            log_entries.append({
                "id": str(log.id),
                "action_type": log.action_type,
                "user_email": log.user.email if log.user else None,
                "resource_type": log.resource_type,
                "resource_id": str(log.resource_id) if log.resource_id else None,
                "metadata": log.metadata,
                "ip_address": str(log.ip_address) if log.ip_address else None,
                "user_agent": log.user_agent,
                "timestamp": log.timestamp.isoformat()
            })
        
        return {
            "logs": log_entries,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }
        
    except Exception as e:
        logger.error(f"Get logs error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve logs"
        )

@router.get("/system-info")
async def get_system_info(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get system information and health status"""
    try:
        # Database statistics
        db_stats = {}
        
        # Count records in main tables
        tables = [
            ("users", User),
            ("matches", Match),
            ("predictions", Prediction),
            ("models", Model)
        ]
        
        for table_name, model_class in tables:
            count_result = await db.execute(select(func.count()).select_from(model_class))
            db_stats[table_name] = count_result.scalar()
        
        # Database size (PostgreSQL specific)
        try:
            size_result = await db.execute(
                text("SELECT pg_size_pretty(pg_database_size(current_database()))")
            )
            db_size = size_result.scalar()
        except Exception:
            db_size = "Unknown"
        
        # Recent activity
        recent_activity = {}
        
        # Recent matches
        recent_matches_result = await db.execute(
            select(func.count()).select_from(Match).where(
                Match.created_at >= datetime.utcnow() - timedelta(days=7)
            )
        )
        recent_activity["matches_last_7_days"] = recent_matches_result.scalar()
        
        # Recent predictions
        recent_predictions_result = await db.execute(
            select(func.count()).select_from(Prediction).where(
                Prediction.created_at >= datetime.utcnow() - timedelta(days=7)
            )
        )
        recent_activity["predictions_last_7_days"] = recent_predictions_result.scalar()
        
        # System health indicators
        health_status = {
            "database": "healthy",
            "api": "healthy",
            "models": "healthy"
        }
        
        # Check for any failed model trainings in last 24 hours
        failed_trainings_result = await db.execute(
            select(func.count()).select_from(TrainingLog).where(
                TrainingLog.status == 'failed',
                TrainingLog.started_at >= datetime.utcnow() - timedelta(days=1)
            )
        )
        failed_trainings = failed_trainings_result.scalar()
        
        if failed_trainings > 0:
            health_status["models"] = "warning"
        
        return {
            "system_info": {
                "version": "1.0.0",
                "environment": "production",  # This should come from config
                "uptime": "Unknown",  # Could be calculated from app start time
                "current_time": datetime.utcnow().isoformat()
            },
            "database_stats": {
                **db_stats,
                "database_size": db_size
            },
            "recent_activity": recent_activity,
            "health_status": health_status
        }
        
    except Exception as e:
        logger.error(f"Get system info error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve system information"
        )

@router.post("/export/data")
async def export_data(
    request: ExportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export system data"""
    try:
        export_data = {}
        
        if "matches" in request.data_types:
            matches_result = await db.execute(
                select(Match).options(
                    selectinload(Match.home_team),
                    selectinload(Match.away_team),
                    selectinload(Match.season)
                ).where(Match.is_deleted == False)
            )
            matches = matches_result.scalars().all()
            
            export_data["matches"] = [
                {
                    "id": str(match.id),
                    "home_team": match.home_team.name,
                    "away_team": match.away_team.name,
                    "season": match.season.name,
                    "match_date": match.match_date.isoformat(),
                    "home_goals": match.home_goals,
                    "away_goals": match.away_goals,
                    "status": match.status,
                    "winner": match.winner,
                    "attendance": match.attendance,
                    "referee": match.referee
                } for match in matches
            ]
        
        if "predictions" in request.data_types:
            predictions_result = await db.execute(
                select(Prediction).options(
                    selectinload(Prediction.match).selectinload(Match.home_team),
                    selectinload(Prediction.match).selectinload(Match.away_team),
                    selectinload(Prediction.batch).selectinload(PredictionBatch.model)
                )
            )
            predictions = predictions_result.scalars().all()
            
            export_data["predictions"] = [
                {
                    "id": str(pred.id),
                    "match_home_team": pred.match.home_team.name,
                    "match_away_team": pred.match.away_team.name,
                    "match_date": pred.match.match_date.isoformat(),
                    "predicted_winner": pred.predicted_winner,
                    "home_expected_goals": float(pred.home_expected_goals) if pred.home_expected_goals else None,
                    "away_expected_goals": float(pred.away_expected_goals) if pred.away_expected_goals else None,
                    "confidence_score": float(pred.confidence_score),
                    "result_status": pred.result_status,
                    "model_name": f"{pred.batch.model.name} {pred.batch.model.version}",
                    "created_at": pred.created_at.isoformat()
                } for pred in predictions
            ]
        
        if "models" in request.data_types:
            models_result = await db.execute(
                select(Model).where(Model.is_deleted == False)
            )
            models = models_result.scalars().all()
            
            export_data["models"] = [
                {
                    "id": str(model.id),
                    "name": model.name,
                    "version": model.version,
                    "algorithm": model.algorithm,
                    "parameters": model.parameters,
                    "features": model.features,
                    "accuracy": float(model.accuracy) if model.accuracy else None,
                    "precision_score": float(model.precision_score) if model.precision_score else None,
                    "recall_score": float(model.recall_score) if model.recall_score else None,
                    "f1_score": float(model.f1_score) if model.f1_score else None,
                    "is_active": model.is_active,
                    "trained_at": model.trained_at.isoformat() if model.trained_at else None,
                    "created_at": model.created_at.isoformat()
                } for model in models
            ]
        
        # Log the export action
        log_entry = Log(
            action_type="data_export",
            user_id=current_user.id,
            metadata={
                "data_types": request.data_types,
                "format": request.format,
                "record_counts": {key: len(value) for key, value in export_data.items()}
            }
        )
        db.add(log_entry)
        await db.commit()
        
        logger.info(f"Data export completed by user {current_user.email}")
        
        return {
            "message": "Data export completed successfully",
            "export_data": export_data,
            "format": request.format,
            "exported_at": datetime.utcnow().isoformat(),
            "record_counts": {key: len(value) for key, value in export_data.items()}
        }
        
    except Exception as e:
        logger.error(f"Export data error: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export data"
        )

@router.post("/config/update")
async def update_config(
    config: SystemConfig,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update system configuration"""
    try:
        # Log the configuration change
        log_entry = Log(
            action_type="config_update",
            user_id=current_user.id,
            metadata={
                "config_changes": config.dict(),
                "updated_by": current_user.email
            }
        )
        db.add(log_entry)
        await db.commit()
        
        logger.info(f"System configuration updated by user {current_user.email}")
        
        return {
            "message": "Configuration updated successfully",
            "updated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Update config error: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update configuration"
        )

@router.delete("/cleanup/old-data")
async def cleanup_old_data(
    days_old: int = Query(90, ge=30),
    dry_run: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clean up old data (logs, old predictions, etc.)"""
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        cleanup_stats = {}
        
        # Count old logs
        old_logs_count = await db.execute(
            select(func.count()).select_from(Log).where(Log.timestamp < cutoff_date)
        )
        cleanup_stats["old_logs"] = old_logs_count.scalar()
        
        # Count old predictions (only pending ones older than cutoff)
        old_predictions_count = await db.execute(
            select(func.count()).select_from(Prediction).where(
                Prediction.created_at < cutoff_date,
                Prediction.result_status == 'pending'
            )
        )
        cleanup_stats["old_pending_predictions"] = old_predictions_count.scalar()
        
        if not dry_run:
            # Actually delete old data
            await db.execute(
                text("DELETE FROM logs WHERE timestamp < :cutoff_date"),
                {"cutoff_date": cutoff_date}
            )
            
            await db.execute(
                text("DELETE FROM predictions WHERE created_at < :cutoff_date AND result_status = 'pending'"),
                {"cutoff_date": cutoff_date}
            )
            
            await db.commit()
            
            # Log the cleanup action
            log_entry = Log(
                action_type="data_cleanup",
                user_id=current_user.id,
                metadata={
                    "cutoff_date": cutoff_date.isoformat(),
                    "records_deleted": cleanup_stats
                }
            )
            db.add(log_entry)
            await db.commit()
            
            logger.info(f"Data cleanup completed by user {current_user.email}")
        
        return {
            "message": "Data cleanup completed" if not dry_run else "Data cleanup preview (dry run)",
            "dry_run": dry_run,
            "cutoff_date": cutoff_date.isoformat(),
            "cleanup_stats": cleanup_stats
        }
        
    except Exception as e:
        logger.error(f"Cleanup old data error: {str(e)}")
        if not dry_run:
            await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cleanup old data"
        )
