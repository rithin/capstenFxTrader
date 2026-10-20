"""API gateway stub: health, readiness and service status from heartbeats. Real endpoints in M7."""

import time

import psycopg
import redis.asyncio as redis
from fastapi import FastAPI, Response

from app.settings import settings

app = FastAPI(
    title="Capsten API", version="0.1.0", openapi_url="/api/v1/openapi.json", docs_url="/api/v1/docs"
)
_redis = redis.from_url(settings.redis_url, decode_responses=True)


@app.get("/api/v1/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok", "service": "api", "environment": settings.environment}


@app.get("/api/v1/health/ready", tags=["health"])
async def ready(response: Response) -> dict:
    checks = {}
    try:
        checks["redis"] = bool(await _redis.ping())
    except Exception:
        checks["redis"] = False
    try:
        dsn = settings.database_url.replace("postgresql+psycopg", "postgresql")
        async with await psycopg.AsyncConnection.connect(dsn, connect_timeout=3) as conn:
            await conn.execute("SELECT 1")
        checks["postgres"] = True
    except Exception:
        checks["postgres"] = False
    if not all(checks.values()):
        response.status_code = 503
    return {"ready": all(checks.values()), "checks": checks}


@app.get("/api/v1/status", tags=["health"])
async def status() -> dict:
    """Latest heartbeat per service from the health stream."""
    entries = await _redis.xrevrange(settings.health_stream, count=200)
    now_ms = int(time.time() * 1000)
    services: dict[str, dict] = {}
    for entry_id, fields in entries:
        name = fields.get("service", "unknown")
        if name in services:
            continue
        age_s = (now_ms - int(entry_id.split("-")[0])) / 1000
        services[name] = {**fields, "age_seconds": round(age_s, 1), "alive": age_s < 30}
    return {"services": dict(sorted(services.items()))}
