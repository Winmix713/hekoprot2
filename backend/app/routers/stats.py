from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, text
from sqlalchemy.orm import selectinload
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import uuid
import logging

from app.database import get_db
from app.models.database import Match, Prediction, Model, Team, TeamStats, PredictionBatch
from app.core.security import get_current_user
from app.models.database import User

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/overview")
async def get_overview_stats(
    season_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard overview statistics"""
    try:
        stats = {}
        
        # Match statistics
        match_query = select(Match).where(Match.is_deleted == False)
        if season_id:
            match_query = match_query.where(Match.season_id == season_id)
        
        match_result = await db.execute(match_query)
        matches = match_result.scalars().all()
        
        stats["matches"] = {
            "total": len(matches),
            "finished": len([m for m in matches if m.status == 'finished']),
            "upcoming": len([m for m in matches if m.status == 'scheduled']),
            "live": len([m for m in matches if m.status == 'live'])
        }
        
        # Prediction statistics
        pred_result = await db.execute(select(Prediction))
        predictions = pred_result.scalars().all()
        
        finished_predictions = [p for p in predictions if p.result_status in ['correct', 'wrong']]
        correct_predictions = [p for p in predictions if p.result_status == 'correct']
        
        stats["predictions"] = {
            "total": len(predictions),
            "correct": len(correct_predictions),
            "wrong": len([p for p in predictions if p.result_status == 'wrong']),
            "pending": len([p for p in predictions if p.result_status == 'pending']),
            "accuracy": (len(correct_predictions) / len(finished_predictions)) * 100 if finished_predictions else 0
        }
        
        # Model statistics
        model_result = await db.execute(
            select(Model).where(Model.is_deleted == False)
        )
        models = model_result.scalars().all()
        
        active_models = [m for m in models if m.is_active]
        trained_models = [m for m in models if m.accuracy is not None]
        
        stats["models"] = {
            "total": len(models),
            "active": len(active_models),
            "average_accuracy": sum(float(m.accuracy) for m in trained_models) / len(trained_models) if trained_models else 0,
            "best_accuracy": max(float(m.accuracy) for m in trained_models) if trained_models else 0
        }
        
        # Recent activity
        recent_matches = sorted(
            [m for m in matches if m.match_date >= datetime.utcnow() - timedelta(days=7)],
            key=lambda x: x.match_date,
            reverse=True
        )[:5]
        
        recent_predictions = sorted(
            predictions,
            key=lambda x: x.created_at,
            reverse=True
        )[:5]
        
        stats["recent_activity"] = {
            "matches": [
                {
                    "id": str(m.id),
                    "home_team": m.home_team.name if hasattr(m, 'home_team') else "Unknown",
                    "away_team": m.away_team.name if hasattr(m, 'away_team') else "Unknown",
                    "date": m.match_date.isoformat(),
                    "status": m.status
                } for m in recent_matches
            ],
            "predictions": [
                {
                    "id": str(p.id),
                    "confidence": float(p.confidence_score),
                    "status": p.result_status,
                    "created_at": p.created_at.isoformat()
                } for p in recent_predictions
            ]
        }
        
        return stats
        
    except Exception as e:
        logger.error(f"Get overview stats error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve overview statistics"
        )

@router.get("/team_stats")
async def get_team_stats(
    season_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get team performance statistics"""
    try:
        # Build query
        query = select(TeamStats).options(
            selectinload(TeamStats.team),
            selectinload(TeamStats.season)
        )
        
        if season_id:
            query = query.where(TeamStats.season_id == season_id)
        
        result = await db.execute(query.order_by(TeamStats.points.desc()))
        team_stats = result.scalars().all()
        
        # Transform to response format
        stats_list = []
        for stat in team_stats:
            stats_list.append({
                "team_id": str(stat.team_id),
                "team_name": stat.team.name,
                "team_short_code": stat.team.short_code,
                "season_name": stat.season.name,
                "matches_played": stat.matches_played,
                "wins": stat.wins,
                "draws": stat.draws,
                "losses": stat.losses,
                "goals_for": stat.goals_for,
                "goals_against": stat.goals_against,
                "goal_difference": stat.goal_difference,
                "points": stat.points,
                "home_record": {
                    "wins": stat.home_wins,
                    "draws": stat.home_draws,
                    "losses": stat.home_losses
                },
                "away_record": {
                    "wins": stat.away_wins,
                    "draws": stat.away_draws,
                    "losses": stat.away_losses
                },
                "form_last_5": stat.form_last_5,
                "win_percentage": (stat.wins / stat.matches_played) * 100 if stat.matches_played > 0 else 0,
                "goals_per_match": stat.goals_for / stat.matches_played if stat.matches_played > 0 else 0,
                "updated_at": stat.updated_at.isoformat()
            })
        
        return {
            "team_stats": stats_list,
            "total_teams": len(stats_list)
        }
        
    except Exception as e:
        logger.error(f"Get team stats error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve team statistics"
        )

@router.get("/model_stats")
async def get_model_stats(
    model_id: Optional[uuid.UUID] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get model performance statistics"""
    try:
        # Build prediction query
        pred_query = select(Prediction).options(
            selectinload(Prediction.batch).selectinload(PredictionBatch.model)
        )
        
        if model_id:
            pred_query = pred_query.join(PredictionBatch).where(PredictionBatch.model_id == model_id)
        
        if date_from:
            pred_query = pred_query.where(Prediction.created_at >= date_from)
        
        if date_to:
            pred_query = pred_query.where(Prediction.created_at <= date_to)
        
        pred_result = await db.execute(pred_query)
        predictions = pred_result.scalars().all()
        
        # Group by model
        model_stats = {}
        for pred in predictions:
            model_name = f"{pred.batch.model.name} {pred.batch.model.version}"
            
            if model_name not in model_stats:
                model_stats[model_name] = {
                    "model_id": str(pred.batch.model.id),
                    "name": pred.batch.model.name,
                    "version": pred.batch.model.version,
                    "algorithm": pred.batch.model.algorithm,
                    "is_active": pred.batch.model.is_active,
                    "total_predictions": 0,
                    "correct_predictions": 0,
                    "wrong_predictions": 0,
                    "pending_predictions": 0,
                    "accuracy": 0,
                    "confidence_ranges": {
                        "0.5-0.6": {"total": 0, "correct": 0},
                        "0.6-0.7": {"total": 0, "correct": 0},
                        "0.7-0.8": {"total": 0, "correct": 0},
                        "0.8-0.9": {"total": 0, "correct": 0},
                        "0.9-1.0": {"total": 0, "correct": 0}
                    },
                    "average_confidence": 0,
                    "predictions_by_day": {}
                }
            
            stats = model_stats[model_name]
            stats["total_predictions"] += 1
            
            if pred.result_status == 'correct':
                stats["correct_predictions"] += 1
            elif pred.result_status == 'wrong':
                stats["wrong_predictions"] += 1
            else:
                stats["pending_predictions"] += 1
            
            # Confidence range analysis
            confidence = float(pred.confidence_score)
            if 0.5 <= confidence < 0.6:
                range_key = "0.5-0.6"
            elif 0.6 <= confidence < 0.7:
                range_key = "0.6-0.7"
            elif 0.7 <= confidence < 0.8:
                range_key = "0.7-0.8"
            elif 0.8 <= confidence < 0.9:
                range_key = "0.8-0.9"
            else:
                range_key = "0.9-1.0"
            
            stats["confidence_ranges"][range_key]["total"] += 1
            if pred.result_status == 'correct':
                stats["confidence_ranges"][range_key]["correct"] += 1
            
            # Daily predictions
            day_key = pred.created_at.date().isoformat()
            if day_key not in stats["predictions_by_day"]:
                stats["predictions_by_day"][day_key] = {"total": 0, "correct": 0}
            
            stats["predictions_by_day"][day_key]["total"] += 1
            if pred.result_status == 'correct':
                stats["predictions_by_day"][day_key]["correct"] += 1
        
        # Calculate final statistics
        for model_name, stats in model_stats.items():
            finished = stats["correct_predictions"] + stats["wrong_predictions"]
            stats["accuracy"] = (stats["correct_predictions"] / finished) * 100 if finished > 0 else 0
            
            # Calculate confidence range accuracies
            for range_key, range_stats in stats["confidence_ranges"].items():
                if range_stats["total"] > 0:
                    range_stats["accuracy"] = (range_stats["correct"] / range_stats["total"]) * 100
                else:
                    range_stats["accuracy"] = 0
            
            # Calculate daily accuracies
            for day_key, day_stats in stats["predictions_by_day"].items():
                if day_stats["total"] > 0:
                    day_stats["accuracy"] = (day_stats["correct"] / day_stats["total"]) * 100
                else:
                    day_stats["accuracy"] = 0
        
        return {
            "model_statistics": list(model_stats.values()),
            "total_models": len(model_stats)
        }
        
    except Exception as e:
        logger.error(f"Get model stats error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve model statistics"
        )

@router.get("/performance_trends")
async def get_performance_trends(
    days: int = Query(30, ge=1, le=365),
    model_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get performance trends over time"""
    try:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Build query
        query = select(Prediction).options(
            selectinload(Prediction.batch).selectinload(PredictionBatch.model)
        ).where(
            Prediction.created_at >= start_date,
            Prediction.created_at <= end_date
        )
        
        if model_id:
            query = query.join(PredictionBatch).where(PredictionBatch.model_id == model_id)
        
        result = await db.execute(query)
        predictions = result.scalars().all()
        
        # Group by date
        daily_stats = {}
        for pred in predictions:
            date_key = pred.created_at.date().isoformat()
            
            if date_key not in daily_stats:
                daily_stats[date_key] = {
                    "date": date_key,
                    "total_predictions": 0,
                    "correct_predictions": 0,
                    "wrong_predictions": 0,
                    "pending_predictions": 0,
                    "accuracy": 0,
                    "average_confidence": 0,
                    "confidence_sum": 0
                }
            
            stats = daily_stats[date_key]
            stats["total_predictions"] += 1
            stats["confidence_sum"] += float(pred.confidence_score)
            
            if pred.result_status == 'correct':
                stats["correct_predictions"] += 1
            elif pred.result_status == 'wrong':
                stats["wrong_predictions"] += 1
            else:
                stats["pending_predictions"] += 1
        
        # Calculate final statistics
        for date_key, stats in daily_stats.items():
            finished = stats["correct_predictions"] + stats["wrong_predictions"]
            stats["accuracy"] = (stats["correct_predictions"] / finished) * 100 if finished > 0 else 0
            stats["average_confidence"] = stats["confidence_sum"] / stats["total_predictions"]
            del stats["confidence_sum"]  # Remove helper field
        
        # Sort by date
        trends = sorted(daily_stats.values(), key=lambda x: x["date"])
        
        return {
            "trends": trends,
            "period": {
                "start_date": start_date.date().isoformat(),
                "end_date": end_date.date().isoformat(),
                "days": days
            }
        }
        
    except Exception as e:
        logger.error(f"Get performance trends error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve performance trends"
        )
