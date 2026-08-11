from fastapi import APIRouter, Query, UploadFile, File
from app.services.image_fetcher import image_fetcher
from app.services.hazard_detector import hazard_detector
from app.models.prediction import HazardDetection
import numpy as np
from PIL import Image
import io

router = APIRouter()


@router.get("/fetch")
async def fetch_images(
    lat: float = Query(...),
    lon: float = Query(...),
    zoom: int = Query(default=15),
):
    path = await image_fetcher.save_map_image(lat, lon)
    return {"location": f"{lat},{lon}", "zoom": zoom, "image_path": path, "source": "google_maps"}


@router.get("/osm-tile")
async def osm_tile(
    lat: float = Query(...),
    lon: float = Query(...),
    zoom: int = Query(default=15),
):
    data = await image_fetcher.fetch_osm_tile(lat, lon, zoom)
    if data:
        return {"status": "ok", "size_bytes": len(data), "source": "openstreetmap"}
    return {"status": "error", "message": "Tile not found"}


@router.post("/detect")
async def detect_hazards(
    file: UploadFile = File(...),
):
    """Upload a road image and run hazard detection."""
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    image_array = np.array(image)

    detections = hazard_detector.detect_from_array(image_array)

    return {
        "filename": file.filename,
        "detections": [d.model_dump() for d in detections],
        "count": len(detections),
        "model_loaded": hazard_detector.model_available,
    }


@router.get("/dataset/{road_id}")
async def get_road_image(road_id: str):
    return {"road_id": road_id, "has_hazards": False}
