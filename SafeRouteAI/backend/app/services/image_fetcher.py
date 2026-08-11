import httpx
from pathlib import Path
from app.config import settings, IMAGES_DIR


class ImageFetcher:
    async def fetch_static_map(
        self, lat: float, lon: float, zoom: int = 15, size: str = "600x400"
    ) -> bytes | None:
        if not settings.google_maps_api_key:
            return None

        url = (
            f"{settings.google_maps_base_url}/staticmap"
            f"?center={lat},{lon}&zoom={zoom}&size={size}"
            f"&key={settings.google_maps_api_key}"
        )
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                return resp.content
        return None

    async def save_map_image(self, lat: float, lon: float, name: str = "map") -> str | None:
        data = await self.fetch_static_map(lat, lon)
        if not data:
            return None
        path = IMAGES_DIR / f"{name}_{lat}_{lon}.png"
        path.write_bytes(data)
        return str(path)

    async def fetch_osm_tile(self, lat: float, lon: float, zoom: int = 15) -> bytes | None:
        import math
        lat_rad = math.radians(lat)
        n = 2.0 ** zoom
        x = int((lon + 180.0) / 360.0 * n)
        y = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
        url = f"https://tile.openstreetmap.org/{zoom}/{x}/{y}.png"
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                return resp.content
        return None

    async def fetch_traffic_camera(self, region: str) -> list[str]:
        return []


image_fetcher = ImageFetcher()
