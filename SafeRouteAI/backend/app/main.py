from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.mongodb import database
from app.routes import safety, images, incidents, geocoding


@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    yield
    await database.close()


app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    lifespan=lifespan,
    description="SafeRoute AI - Intelligent Road Safety Navigation System using Computer Vision, LLM, and Google Maps API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(safety.router, prefix="/api/safety", tags=["Safety"])
app.include_router(images.router, prefix="/api/images", tags=["Images"])
app.include_router(incidents.router, prefix="/api/incidents", tags=["Incidents"])
app.include_router(geocoding.router, prefix="/api/geocoding", tags=["Geocoding"])


@app.get("/")
def root():
    return {
        "message": "SafeRoute AI - Intelligent Road Safety Navigation System",
        "version": settings.api_version,
        "docs": "/docs",
    }


@app.get("/health")
def health():
    from app.services.hazard_detector import hazard_detector
    from app.services.llm_service import llm_service
    return {
        "status": "healthy",
        "model_loaded": hazard_detector.model_available,
        "llm_available": llm_service.available,
    }
