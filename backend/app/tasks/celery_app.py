from celery import Celery
from app.core.config import settings

# Create Celery app
celery_app = Celery(
    "football_prediction",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.prediction_tasks",
        "app.tasks.model_tasks",
        "app.tasks.maintenance_tasks"
    ]
)

# Configure Celery
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

# Periodic tasks
celery_app.conf.beat_schedule = {
    "evaluate-predictions": {
        "task": "app.tasks.prediction_tasks.evaluate_finished_matches",
        "schedule": 60.0 * 60,  # Every hour
    },
    "cleanup-old-data": {
        "task": "app.tasks.maintenance_tasks.cleanup_old_data",
        "schedule": 60.0 * 60 * 24,  # Daily
    },
    "retrain-models": {
        "task": "app.tasks.model_tasks.scheduled_model_retrain",
        "schedule": 60.0 * 60 * 24 * 7,  # Weekly
    },
}
