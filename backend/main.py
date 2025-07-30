from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import logging
import time
from contextlib import asynccontextmanager

from app.core.config import settings
from app.database import engine, Base
from app.routers import auth, matches, predictions, models, stats, admin, statistics
from app.core.logging_config import setup_logging

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Football Prediction API...")
    
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    logger.info("Database tables created/verified")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Football Prediction API...")

# Create FastAPI app
app = FastAPI(
    title="Football Prediction API",
    description="Advanced football prediction system with ML capabilities and comprehensive statistics",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Custom middleware for request logging and timing
@app.middleware("http")
async def log_requests(request, call_next):
    start_time = time.time()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url}")
    
    response = await call_next(request)
    
    # Log response time
    process_time = time.time() - start_time
    logger.info(f"Response: {response.status_code} - {process_time:.3f}s")
    
    return response

# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": "Resource not found", "detail": str(exc)}
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": "An unexpected error occurred"}
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "2.0.0",
        "features": [
            "Enhanced ML predictions",
            "PHP-style statistical analysis",
            "Head-to-head analytics",
            "Form index calculations",
            "Expected goals modeling",
            "Both teams to score predictions",
            "ELO-style win probabilities"
        ]
    }

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(matches.router, prefix="/matches", tags=["Matches"])
app.include_router(predictions.router, prefix="/predictions", tags=["Predictions"])
app.include_router(models.router, prefix="/models", tags=["Models"])
app.include_router(stats.router, prefix="/stats", tags=["Statistics"])
app.include_router(statistics.router, prefix="/statistics", tags=["Advanced Statistics"])
app.include_router(admin.router, prefix="/admin", tags=["Administration"])

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Football Prediction API v2.0",
        "description": "Advanced football prediction system with enhanced ML and PHP-style statistics",
        "documentation": "/docs",
        "health": "/health",
        "features": {
            "authentication": "JWT-based authentication",
            "predictions": "ML-powered match predictions",
            "statistics": "Comprehensive team and match analytics",
            "php_integration": "Migrated PHP statistical calculations",
            "real_time": "Live match tracking and evaluation"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
