import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection, is_mock_db
from app.routers import auth, guidelines, drafts, verification, approvals, dashboard, files, insights

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("veribrand.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing VeriBrand AI backend platform...")
    db = connect_to_mongo()
    # Auto-seed demo personas and Section 7 specification if empty
    try:
        if db.users.count_documents({}) == 0:
            logger.info("Database has no users. Seeding initial demonstration data...")
            from seed_data import seed_database
            seed_database()
    except Exception as e:
        logger.warning(f"Note on auto-seed: {e}")
    yield
    logger.info("Shutting down VeriBrand AI platform...")
    close_mongo_connection()


app = FastAPI(
    title="VeriBrand AI — Evidence-First Brand Governance Platform",
    description="Pre-publication marketing content verification engine powered by versioned approved sources and human reviewer accountability.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health & Diagnostic Endpoints
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "VeriBrand AI API",
        "version": "1.0.0",
        "database_mode": "in-memory-resilient" if is_mock_db() else "mongodb-connected",
        "ai_enabled": bool(settings.LLM_API_KEY)
    }


@app.get("/", tags=["System"])
def root():
    return {
        "platform": "VeriBrand AI",
        "purpose": "Evidence-First Brand Governance Platform",
        "edition": "Enterprise Edition",
        "version": "2.4.0",
        "docs_url": "/docs"
    }


# Include Modular Routers
app.include_router(auth.router)
app.include_router(guidelines.router)
app.include_router(drafts.router)
app.include_router(verification.router)
app.include_router(approvals.router)
app.include_router(dashboard.router)
app.include_router(files.router)
app.include_router(insights.router)
