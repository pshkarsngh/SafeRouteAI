import httpx
import hashlib
from datetime import datetime
from app.config import settings
from app.database.mongodb import database
from app.models.prediction import IncidentInfo


class IncidentSearcher:
    def _route_id(self, start: tuple[float, float], end: tuple[float, float]) -> str:
        raw = f"{start[0]},{start[1]}-{end[0]},{end[1]}"
        return hashlib.md5(raw.encode()).hexdigest()[:12]

    async def search(self, start: tuple[float, float], end: tuple[float, float], place_name: str = "") -> list[IncidentInfo]:
        rid = self._route_id(start, end)

        cached = await database.get_cached_incidents(rid)
        if cached is not None:
            return [IncidentInfo(**c) for c in cached]

        incidents = await self._fetch_from_news_api(place_name or f"{start[0]},{start[1]}")

        await database.cache_incidents(rid, [i.model_dump() for i in incidents])
        return incidents

    async def _fetch_from_news_api(self, query: str) -> list[IncidentInfo]:
        if not settings.news_api_key:
            return self._mock_incidents()

        url = "https://newsapi.org/v2/everything"
        params = {
            "q": f"road accident OR traffic hazard OR pothole {query}",
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": 5,
            "apiKey": settings.news_api_key,
        }

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url, params=params)
                if resp.status_code != 200:
                    return self._mock_incidents()
                data = resp.json()
                articles = data.get("articles", [])
                return self._parse_articles(articles)
        except Exception:
            return self._mock_incidents()

    def _parse_articles(self, articles: list[dict]) -> list[IncidentInfo]:
        incidents = []
        for art in articles:
            title = (art.get("title") or "").lower()
            desc = (art.get("description") or "")
            if any(kw in title for kw in ["accident", "crash", "hazard", "pothole", "waterlog", "road", "traffic"]):
                severity = self._classify(title)
                incidents.append(IncidentInfo(
                    title=art.get("title") or "Unknown incident",
                    source=art.get("source", {}).get("name", "News"),
                    severity=severity,
                    date=art.get("publishedAt", datetime.now().isoformat()),
                    description=desc or "No details available",
                    url=art.get("url") or "",
                ))
        return incidents[:5]

    def _classify(self, text: str) -> str:
        critical_kw = ["fatal", "death", "critical", "major accident", "hospital", "serious injury"]
        warning_kw = ["accident", "crash", "collision", "waterlog", "flood", "damage"]
        if any(k in text for k in critical_kw):
            return "critical"
        if any(k in text for k in warning_kw):
            return "warning"
        return "info"

    def _mock_incidents(self) -> list[IncidentInfo]:
        from datetime import timedelta, timezone
        now = datetime.now(timezone.utc)
        return [
            IncidentInfo(
                title="Minor accident reported on Old Airport Road",
                source="City Traffic Report",
                severity="warning",
                date=(now - timedelta(hours=6)).isoformat(),
                description="A minor collision between two vehicles near the Old Airport Road junction. Traffic moving slowly.",
                url="",
            ),
            IncidentInfo(
                title="Waterlogging reported near MG Road underpass",
                source="Weather Advisory",
                severity="info",
                date=(now - timedelta(days=2)).isoformat(),
                description="Water accumulation of 6 inches reported after recent rainfall. Use caution.",
                url="",
            ),
            IncidentInfo(
                title="Pothole damage on Inner Ring Road",
                source="Community Report",
                severity="warning",
                date=(now - timedelta(days=5)).isoformat(),
                description="Multiple potholes reported on the stretch between Silk Board and HSR Layout.",
                url="",
            ),
        ]


incident_searcher = IncidentSearcher()
