import httpx
from fastapi import APIRouter, Query
from app.config import settings

router = APIRouter()


@router.get("/geocode")
async def geocode(q: str = Query(..., description="Place name or address")):
    """Geocode a place name to lat/lon using Google Maps Geocoding API."""
    if not settings.google_maps_api_key:
        return _mock_geocode(q)

    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {"address": q, "key": settings.google_maps_api_key}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            if resp.status_code != 200:
                return _mock_geocode(q)
            data = resp.json()
            if data.get("status") != "OK" or not data.get("results"):
                return _mock_geocode(q)

            result = data["results"][0]
            loc = result["geometry"]["location"]
            return {
                "lat": loc["lat"],
                "lng": loc["lng"],
                "formatted_address": result.get("formatted_address", q),
                "status": "ok",
            }
    except Exception:
        return _mock_geocode(q)


@router.get("/reverse-geocode")
async def reverse_geocode(lat: float = Query(...), lng: float = Query(...)):
    """Reverse geocode coordinates to a place name."""
    if not settings.google_maps_api_key:
        return {"name": f"{lat:.4f}, {lng:.4f}", "status": "mock"}

    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {"latlng": f"{lat},{lng}", "key": settings.google_maps_api_key}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            if resp.status_code != 200:
                return {"name": f"{lat:.4f}, {lng:.4f}", "status": "error"}
            data = resp.json()
            if data.get("status") != "OK" or not data.get("results"):
                return {"name": f"{lat:.4f}, {lng:.4f}", "status": "not_found"}

            return {
                "name": data["results"][0].get("formatted_address", f"{lat}, {lng}"),
                "status": "ok",
            }
    except Exception:
        return {"name": f"{lat:.4f}, {lng:.4f}", "status": "error"}


def _mock_geocode(query: str):
    """Mock geocoding for common Indian cities when no API key."""
    mock_db = {
        "bangalore": {"lat": 12.9716, "lng": 77.5946},
        "bengaluru": {"lat": 12.9716, "lng": 77.5946},
        "mumbai": {"lat": 19.076, "lng": 72.8777},
        "delhi": {"lat": 28.6139, "lng": 77.209},
        "chennai": {"lat": 13.0827, "lng": 80.2707},
        "kolkata": {"lat": 22.5726, "lng": 88.3639},
        "hyderabad": {"lat": 17.385, "lng": 78.4867},
        "pune": {"lat": 18.5204, "lng": 73.8567},
        "jaipur": {"lat": 26.9124, "lng": 75.7873},
        "mg road": {"lat": 12.9758, "lng": 77.6065},
        "whitefield": {"lat": 12.9698, "lng": 77.75},
        "koramangala": {"lat": 12.9352, "lng": 77.6245},
        "indiranagar": {"lat": 12.9784, "lng": 77.6408},
        "hsr layout": {"lat": 12.9116, "lng": 77.6389},
        "silk board": {"lat": 12.917, "lng": 77.6229},
        "electronic city": {"lat": 12.8456, "lng": 77.6602},
    }

    q_lower = query.lower().strip()

    for key, coords in mock_db.items():
        if key in q_lower:
            return {
                "lat": coords["lat"],
                "lng": coords["lng"],
                "formatted_address": query,
                "status": "mock",
            }

    # Default: Bangalore center with small random offset
    import random
    return {
        "lat": 12.9716 + random.uniform(-0.02, 0.02),
        "lng": 77.5946 + random.uniform(-0.02, 0.02),
        "formatted_address": query,
        "status": "mock",
    }
