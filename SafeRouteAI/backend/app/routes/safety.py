from fastapi import APIRouter, HTTPException
from app.models.prediction import (
    SafetyRequest, FullSafetyResponse, HazardInfo, RouteAlternative, RouteInfo,
)
from app.services.route_service import route_service
from app.services.hazard_detector import hazard_detector
from app.services.safety_scorer import safety_scorer
from app.services.llm_service import llm_service
from app.services.incident_searcher import incident_searcher
from app.database.mongodb import database

router = APIRouter()


@router.post("/check-route", response_model=FullSafetyResponse)
async def check_route(req: SafetyRequest):
    """
    Full SafeRoute AI pipeline:
    1. Get multiple routes from Google Maps
    2. Segment each route
    3. Run hazard detection on each segment
    4. Compute safety scores
    5. Rank routes
    6. Generate LLM explanation
    """

    # Step 1: Parse user preferences via LLM
    parsed_prefs = await llm_service.parse_preferences(req.preferences)
    alpha = parsed_prefs.get("alpha", req.alpha)
    avoid_classes = parsed_prefs.get("avoidClasses", [])

    # Step 2: Get routes from Google Maps Directions API
    routes = await route_service.get_routes(
        req.start_lat, req.start_lon, req.end_lat, req.end_lon
    )

    if not routes:
        raise HTTPException(status_code=404, detail="No routes found between the given locations.")

    # Step 3-4: For each route, segment and detect hazards
    routes_data = []
    all_hazards = []

    for idx, route in enumerate(routes):
        segments = route_service.segment_route(route)

        for seg in segments:
            # In production, fetch image from Google Static Maps or camera
            # For now, use mock detection per segment
            detections = hazard_detector._mock_detect()

            # Assign midpoint coordinates to detections
            for det in detections:
                det.segment_index = seg.index
                det.latitude = seg.midpoint_lat
                det.longitude = seg.midpoint_lon

                # Classify crack severity
                if det.class_name == "crack":
                    det.severity = hazard_detector.classify_crack_severity(det)

            seg.hazards = detections

        routes_data.append({
            "route_index": idx,
            "segments": segments,
            "distance_m": route.distance_m,
            "duration_s": route.duration_s,
            "distance_str": route.distance_str,
            "duration_str": route.duration_str,
            "polyline": route.polyline,
        })

    # Step 5: Rank routes using safety scorer (paper eqs 3-6)
    alternatives = safety_scorer.rank_routes(routes_data, alpha=alpha, avoid_classes=avoid_classes)

    if not alternatives:
        raise HTTPException(status_code=500, detail="Failed to compute route rankings.")

    best = alternatives[0]
    best_route_data = routes_data[best.route_index]

    # Step 6: Collect all hazards from best route for response
    best_hazards = []
    for seg in best_route_data["segments"]:
        for det in seg.hazards:
            best_hazards.append(HazardInfo(
                type=det.class_name.capitalize(),
                severity=det.severity,
                location=(det.latitude, det.longitude),
                description=f"{det.class_name.capitalize()} detected (confidence: {det.confidence:.0%})",
                confidence=det.confidence,
            ))

    # Step 7: Fetch incidents
    incidents = await incident_searcher.search(
        (req.start_lat, req.start_lon), (req.end_lat, req.end_lon), req.start_name
    )

    # Step 8: LLM explanation
    selected_info = {
        "safety_score": best.safety_score,
        "duration": best.duration,
        "distance": best.distance,
        "hazard_count": best.hazards,
    }
    other_info = [
        {
            "index": a.route_index,
            "safety_score": a.safety_score,
            "duration": a.duration,
            "hazard_count": a.hazards,
        }
        for a in alternatives[1:]
    ]

    llm_explanation = await llm_service.explain_route(
        selected_info, other_info, req.preferences, best.hazard_summary
    )

    # Step 9: Build route info
    route_info = RouteInfo(
        polyline=best.polyline,
        distance_m=best.distance_m,
        duration_s=best.duration_s,
        distance_str=best.distance,
        duration_str=best.duration,
    )

    # Step 10: Save query to database
    await database.save_query({
        "start": {"lat": req.start_lat, "lon": req.start_lon, "name": req.start_name},
        "end": {"lat": req.end_lat, "lon": req.end_lon, "name": req.end_name},
        "preferences": req.preferences,
        "parsed_preferences": parsed_prefs,
        "score": best.safety_score,
        "rank_score": best.rank_score,
        "selected_route": best.route_index,
    })

    return FullSafetyResponse(
        safety_score=best.safety_score,
        recommended_path=[],
        hazards=best_hazards,
        incidents=incidents,
        explanation=llm_explanation if llm_service.available else llm_service._mock_explain(
            selected_info, other_info, req.preferences, best.hazard_summary
        ),
        llm_response=llm_explanation,
        route_info=route_info,
        alternatives=alternatives,
        selected_route_index=best.route_index,
        user_preferences_parsed=parsed_prefs,
    )


@router.get("/route/{route_id}")
async def get_route_details(route_id: str):
    return {"route_id": route_id, "status": "pending"}
