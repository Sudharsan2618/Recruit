"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.v1.router import router as v1_router
from app.db.mongodb import connect_mongodb, close_mongodb, ensure_indexes


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown lifecycle."""
    print(f"[START] {settings.APP_NAME} API starting...")
    print(f"[DOCS]  http://localhost:8000/docs")

    # MongoDB connect + indexes
    await connect_mongodb()
    await ensure_indexes()

    yield

    # Shutdown
    await close_mongodb()
    print(f"[STOP]  {settings.APP_NAME} API shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    description="LMS + Recruitment Platform API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(v1_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME}

