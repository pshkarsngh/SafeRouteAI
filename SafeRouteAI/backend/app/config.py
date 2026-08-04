from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db_name: str = "saferouteai"
    google_maps_api_key: str = ""
    openai_api_key: str = ""
    gemini_api_key: str = ""
    news_api_key: str = ""
    api_title: str = "SafeRouteAI"
    api_version: str = "2.0.0"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    incident_cache_ttl_hours: int = 6
    max_alternatives: int = 3

    # Safety scoring params (from paper)
    safety_lambda: float = 0.15
    segment_length_m: float = 300.0
    confidence_threshold: float = 0.4

    # LLM params
    llm_temperature: float = 0.3
    llm_model_openai: str = "gpt-4o-mini"
    llm_model_gemini: str = "gemini-2.0-flash"


settings = Settings()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / ".." / "data"
IMAGES_DIR = DATA_DIR / "images"
MODEL_DIR = DATA_DIR / "models"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# Paper Table II: severity weights per hazard class
# wm in {1, 2, 3} and gamma_c per class
HAZARD_CLASSES = {
    "pothole": {"id": 0, "gamma": 3.0, "severity_weight": 3},
    "crack": {"id": 1, "gamma": 2.0, "severity_weight": 2},
    "damaged": {"id": 2, "gamma": 2.5, "severity_weight": 2},
    "waterlogged": {"id": 3, "gamma": 3.0, "severity_weight": 3},
    "uneven": {"id": 4, "gamma": 1.5, "severity_weight": 2},
}

# Class weights for display
SAFETY_WEIGHTS = {
    "critical": 25,
    "warning": 12,
    "info": 5,
}

RECENCY_FACTORS = {
    1: 1.0,
    7: 0.7,
    30: 0.4,
}
