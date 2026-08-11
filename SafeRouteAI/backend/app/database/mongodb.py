from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings
from datetime import datetime
from typing import Any


class Database:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None

    async def connect(self) -> None:
        try:
            self.client = AsyncIOMotorClient(settings.mongo_uri)
            self.db = self.client[settings.mongo_db_name]
            await self._ensure_indexes()
        except Exception:
            self.client = None
            self.db = None

    async def close(self) -> None:
        if self.client:
            self.client.close()

    def get_db(self) -> AsyncIOMotorDatabase:
        if self.db is None:
            raise RuntimeError("Database not initialized. Call connect() first.")
        return self.db

    async def _ensure_indexes(self) -> None:
        db = self.get_db()
        await db.incidents.create_index("route_id")
        await db.incidents.create_index("fetched_at")
        await db.queries.create_index("created_at")

    async def cache_incidents(self, route_id: str, incidents: list[dict]) -> None:
        db = self.get_db()
        await db.incidents.update_one(
            {"route_id": route_id},
            {"$set": {"incidents": incidents, "fetched_at": datetime.now()}},
            upsert=True,
        )

    async def get_cached_incidents(self, route_id: str) -> list[dict] | None:
        db = self.get_db()
        doc = await db.incidents.find_one({"route_id": route_id})
        if not doc:
            return None
        age = (datetime.now() - doc["fetched_at"]).total_seconds() / 3600
        if age > settings.incident_cache_ttl_hours:
            return None
        return doc.get("incidents")

    async def save_query(self, data: dict[str, Any]) -> None:
        db = self.get_db()
        data["created_at"] = datetime.now()
        await db.queries.insert_one(data)


database = Database()
