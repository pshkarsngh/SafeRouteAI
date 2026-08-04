from fastapi import APIRouter, Query
from app.models.prediction import IncidentInfo
from app.services.incident_searcher import incident_searcher

router = APIRouter()


@router.get("/search", response_model=list[IncidentInfo])
async def search_incidents(
    lat: float = Query(...),
    lon: float = Query(...),
    place_name: str = Query(default=""),
):
    incidents = await incident_searcher.search((lat, lon), (lat, lon), place_name)
    return incidents


@router.get("/near-route")
async def incidents_near_route(
    start_lat: float = Query(...),
    start_lon: float = Query(...),
    end_lat: float = Query(...),
    end_lon: float = Query(...),
):
    incidents = await incident_searcher.search(
        (start_lat, start_lon), (end_lat, end_lon), ""
    )
    return {"count": len(incidents), "incidents": [i.model_dump() for i in incidents]}
