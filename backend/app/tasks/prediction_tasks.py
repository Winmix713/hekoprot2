from celery import Celery
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import asyncio
import logging
from typing import List
import uuid

from app.database import get_db
from app.models.database import PredictionBatch, Prediction, Match, Model
from app.services.enhanced_ml_service import enhanced_ml_service
from app.services.statistics_service import statistics_service
from app.core.config import settings

logger = logging.getLogger(__name__)

# Create Celery app
celery_app = Celery(
    "football_predictions",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

@celery_app.task(bind=True)
def generate_predictions_task(self, batch_id: str, match_ids: List[str] = None):
    """Generate predictions for matches using enhanced ML model"""
    try:
        # Run async function in sync context
        return asyncio.run(_generate_predictions_async(batch_id, match_ids))
    except Exception as e:
        logger.error(f"Error in generate_predictions_task: {str(e)}")
        self.retry(countdown=60, max_retries=3)

async def _generate_predictions_async(batch_id: str, match_ids: List[str] = None):
    """Async function to generate predictions"""
    async for db in get_db():
        try:
            # Get prediction batch
            batch_result = await db.execute(
                select(PredictionBatch).where(PredictionBatch.id == batch_id)
            )
            batch = batch_result.scalar_one_or_none()
            
            if not batch:
                raise ValueError(f"Prediction batch {batch_id} not found")
            
            # Get model
            model_result = await db.execute(
                select(Model).where(Model.id == batch.model_id)
            )
            model = model_result.scalar_one_or_none()
            
            if not model:
                raise ValueError(f"Model {batch.model_id} not found")
            
            # Get matches to predict
            if match_ids:
                matches_result = await db.execute(
                    select(Match).where(
                        Match.id.in_(match_ids),
                        Match.status.in_(['scheduled', 'live']),
                        Match.is_deleted == False
                    )
                )
            else:
                # Get upcoming matches
                matches_result = await db.execute(
                    select(Match).where(
                        Match.status == 'scheduled',
                        Match.is_deleted == False
                    ).limit(50)  # Limit to prevent overload
                )
            
            matches = matches_result.scalars().all()
            
            if not matches:
                logger.warning("No matches found for prediction")
                return {"status": "completed", "predictions_generated": 0}
            
            predictions_generated = 0
            
            for match in matches:
                try:
                    # Check if prediction already exists for this match and batch
                    existing_result = await db.execute(
                        select(Prediction).where(
                            Prediction.match_id == match.id,
                            Prediction.batch_id == batch_id
                        )
                    )
                    existing = existing_result.scalar_one_or_none()
                    
                    if existing:
                        logger.info(f"Prediction already exists for match {match.id}")
                        continue
                    
                    # Generate prediction using enhanced ML service
                    if model.algorithm in ['RandomForest', 'GradientBoosting', 'LogisticRegression']:
                        prediction_data = await enhanced_ml_service.predict_match_enhanced(
                            db, str(match.id), str(model.id)
                        )
                    else:
                        # Fallback to statistical prediction
                        prediction_data = await statistics_service.run_comprehensive_prediction(
                            db, str(match.home_team_id), str(match.away_team_id)
                        )
                    
                    # Create prediction record
                    prediction = Prediction(
                        match_id=match.id,
                        batch_id=batch_id,
                        predicted_winner=prediction_data['predicted_winner'],
                        home_expected_goals=prediction_data.get('home_expected_goals', 0.0),
                        away_expected_goals=prediction_data.get('away_expected_goals', 0.0),
                        home_win_probability=prediction_data.get('home_win_probability', 0.0),
                        draw_probability=prediction_data.get('draw_probability', 0.0),
                        away_win_probability=prediction_data.get('away_win_probability', 0.0),
                        confidence_score=prediction_data.get('confidence_score', 0.0),
                        features_used=prediction_data.get('features_used', {})
                    )
                    
                    db.add(prediction)
                    predictions_generated += 1
                    
                except Exception as e:
                    logger.error(f"Error generating prediction for match {match.id}: {str(e)}")
                    continue
            
            # Update batch with total predictions
            batch.total_predictions = predictions_generated
            await db.commit()
            
            logger.info(f"Generated {predictions_generated} predictions for batch {batch_id}")
            
            return {
                "status": "completed",
                "predictions_generated": predictions_generated,
                "batch_id": batch_id
            }
            
        except Exception as e:
            logger.error(f"Error in _generate_predictions_async: {str(e)}")
            await db.rollback()
            raise
        finally:
            await db.close()

@celery_app.task(bind=True)
def evaluate_predictions_task(self, prediction_ids: List[str] = None, batch_id: str = None):
    """Evaluate predictions against actual results"""
    try:
        return asyncio.run(_evaluate_predictions_async(prediction_ids, batch_id))
    except Exception as e:
        logger.error(f"Error in evaluate_predictions_task: {str(e)}")
        self.retry(countdown=60, max_retries=3)

async def _evaluate_predictions_async(prediction_ids: List[str] = None, batch_id: str = None):
    """Async function to evaluate predictions"""
    async for db in get_db():
        try:
            # Build query for predictions to evaluate
            query = select(Prediction).join(Match).where(
                Match.status == 'finished',
                Match.winner.isnot(None),
                Prediction.result_status == 'pending'
            )
            
            if prediction_ids:
                query = query.where(Prediction.id.in_(prediction_ids))
            elif batch_id:
                query = query.where(Prediction.batch_id == batch_id)
            
            result = await db.execute(query)
            predictions = result.scalars().all()
            
            if not predictions:
                logger.warning("No predictions found for evaluation")
                return {"status": "completed", "predictions_evaluated": 0}
            
            predictions_evaluated = 0
            correct_predictions = 0
            
            for prediction in predictions:
                try:
                    # Get match result
                    match_result = await db.execute(
                        select(Match).where(Match.id == prediction.match_id)
                    )
                    match = match_result.scalar_one_or_none()
                    
                    if not match or match.status != 'finished' or not match.winner:
                        continue
                    
                    # Evaluate prediction
                    is_correct = prediction.predicted_winner == match.winner
                    prediction.result_status = 'correct' if is_correct else 'wrong'
                    
                    if is_correct:
                        correct_predictions += 1
                    
                    predictions_evaluated += 1
                    
                except Exception as e:
                    logger.error(f"Error evaluating prediction {prediction.id}: {str(e)}")
                    continue
            
            await db.commit()
            
            accuracy = (correct_predictions / predictions_evaluated * 100) if predictions_evaluated > 0 else 0
            
            logger.info(f"Evaluated {predictions_evaluated} predictions. Accuracy: {accuracy:.2f}%")
            
            return {
                "status": "completed",
                "predictions_evaluated": predictions_evaluated,
                "correct_predictions": correct_predictions,
                "accuracy": round(accuracy, 2)
            }
            
        except Exception as e:
            logger.error(f"Error in _evaluate_predictions_async: {str(e)}")
            await db.rollback()
            raise
        finally:
            await db.close()

@celery_app.task
def update_team_stats_task():
    """Update team statistics for all teams"""
    try:
        return asyncio.run(_update_team_stats_async())
    except Exception as e:
        logger.error(f"Error in update_team_stats_task: {str(e)}")
        raise

async def _update_team_stats_async():
    """Async function to update team statistics"""
    async for db in get_db():
        try:
            # This would contain logic to recalculate team statistics
            # based on recent matches and update the TeamStats table
            logger.info("Team stats update completed")
            return {"status": "completed"}
            
        except Exception as e:
            logger.error(f"Error updating team stats: {str(e)}")
            raise
        finally:
            await db.close()

# Periodic tasks
from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    'evaluate-predictions-daily': {
        'task': 'app.tasks.prediction_tasks.evaluate_predictions_task',
        'schedule': crontab(hour=1, minute=0),  # Daily at 1 AM
    },
    'update-team-stats-daily': {
        'task': 'app.tasks.prediction_tasks.update_team_stats_task',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    },
}
