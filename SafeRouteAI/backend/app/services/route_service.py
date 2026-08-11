import httpx
from app.config import settings
from app.models.prediction import RouteInfo, RouteSegment
from app.utils.helpers import decode_polyline, interpolate_points, haversine_distance


class RouteService:
    """Google Maps Directions API integration with route segmentation."""

    DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json"

    async def get_routes(
        self, start_lat: float, start_lon: float, end_lat: float, end_lon: float
    ) -> list[RouteInfo]:
        """Fetch multiple alternative routes from Google Maps Directions API."""
        if not settings.google_maps_api_key:
            return self._mock_routes(start_lat, start_lon, end_lat, end_lon)

        params = {
            "origin": f"{start_lat},{start_lon}",
            "destination": f"{end_lat},{end_lon}",
            "alternatives": "true",
            "mode": "driving",
            "key": settings.google_maps_api_key,
        }

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(self.DIRECTIONS_URL, params=params)
                if resp.status_code != 200:
                    return self._mock_routes(start_lat, start_lon, end_lat, end_lon)
                data = resp.json()
                if data.get("status") != "OK":
                    return self._mock_routes(start_lat, start_lon, end_lat, end_lon)

                routes = []
                for leg in data.get("routes", []):
                    distance_m = 0
                    duration_s = 0
                    polyline = ""

                    for step in leg.get("legs", []):
                        distance_m += step.get("distance", {}).get("value", 0)
                        duration_s += step.get("duration", {}).get("value", 0)

                    polyline = leg.get("overview_polyline", {}).get("points", "")
                    decoded = decode_polyline(polyline) if polyline else []

                    distance_str = self._format_distance(distance_m)
                    duration_str = self._format_duration(duration_s)

                    routes.append(RouteInfo(
                        polyline=polyline,
                        decoded_coords=decoded,
                        distance_m=distance_m,
                        duration_s=duration_s,
                        distance_str=distance_str,
                        duration_str=duration_str,
                    ))

                return routes if routes else self._mock_routes(start_lat, start_lon, end_lat, end_lon)

        except Exception:
            return self._mock_routes(start_lat, start_lon, end_lat, end_lon)

    def segment_route(self, route: RouteInfo, segment_length_m: float = None) -> list[RouteSegment]:
        """Divide a route into segments of approximately segment_length_m."""
        if segment_length_m is None:
            segment_length_m = settings.segment_length_m

        # Use pre-decoded coords if available, otherwise decode polyline
        if route.decoded_coords:
            coords = route.decoded_coords
        elif route.polyline:
            coords = decode_polyline(route.polyline)
        else:
            return []
        if len(coords) < 2:
            return []

        interpolated = interpolate_points(coords, segment_length_m)
        segments = []

        for i in range(len(interpolated) - 1):
            lat1, lon1 = interpolated[i]
            lat2, lon2 = interpolated[i + 1]
            mid_lat = (lat1 + lat2) / 2
            mid_lon = (lon1 + lon2) / 2
            dist = haversine_distance(lat1, lon1, lat2, lon2)

            segments.append(RouteSegment(
                index=i,
                start_lat=lat1,
                start_lon=lon1,
                end_lat=lat2,
                end_lon=lon2,
                midpoint_lat=mid_lat,
                midpoint_lon=mid_lon,
                distance_m=dist,
            ))

        return segments

    def _format_distance(self, meters: float) -> str:
        if meters >= 1000:
            return f"{meters / 1000:.1f} km"
        return f"{int(meters)} m"

    def _format_duration(self, seconds: float) -> str:
        mins = int(seconds / 60)
        if mins >= 60:
            hrs = mins // 60
            mins = mins % 60
            return f"{hrs}h {mins}m"
        return f"{mins} min"

    def _mock_routes(
        self, start_lat: float, start_lon: float, end_lat: float, end_lon: float
    ) -> list[RouteInfo]:
        """Generate mock routes when API key is not available."""
        import random

        routes = []
        offsets = [(0, 0), (0.005, 0.003), (-0.003, 0.005)]

        for idx, (dlat, dlon) in enumerate(offsets):
            mid_lat = (start_lat + end_lat) / 2 + dlat
            mid_lon = (start_lon + end_lon) / 2 + dlon

            coords = [
                (start_lat, start_lon),
                (start_lat + (mid_lat - start_lat) * 0.5, start_lon + (mid_lon - start_lon) * 0.3),
                (mid_lat, mid_lon),
                (mid_lat + (end_lat - mid_lat) * 0.6, mid_lon + (end_lon - mid_lon) * 0.7),
                (end_lat, end_lon),
            ]

            dist = haversine_distance(start_lat, start_lon, end_lat, end_lon) * (1.0 + idx * 0.15)
            duration = dist / 12.0

            routes.append(RouteInfo(
                polyline="",
                decoded_coords=coords,
                distance_m=dist,
                duration_s=duration,
                distance_str=self._format_distance(dist),
                duration_str=self._format_duration(duration),
            ))

        return routes


route_service = RouteService()
