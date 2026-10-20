"""recorder stub (M11): heartbeat to Redis + /healthz for k8s probes.

Replaced by the real service in M8.2 (recorder).
"""

import json
import logging
import os
import signal
import socket
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import redis

SERVICE = os.getenv("SERVICE_NAME", "recorder")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
STREAM = os.getenv("HEALTH_STREAM", "events.health")
INTERVAL = float(os.getenv("HEARTBEAT_SECONDS", "5"))

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(name)s %(message)s"
)
log = logging.getLogger(SERVICE)
_stop = threading.Event()
_last_ok = 0.0


def extra_info() -> dict:
    """Service-specific fields added to every heartbeat."""
    return {}


class Health(BaseHTTPRequestHandler):
    def do_GET(self):
        healthy = self.path == "/healthz" and time.time() - _last_ok < INTERVAL * 3
        body = json.dumps({"service": SERVICE, "healthy": healthy}).encode()
        self.send_response(200 if healthy else 503)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):  # keep probe noise out of the logs
        pass


def main() -> None:
    global _last_ok
    signal.signal(signal.SIGTERM, lambda *_: _stop.set())
    signal.signal(signal.SIGINT, lambda *_: _stop.set())
    server = ThreadingHTTPServer(("0.0.0.0", 8080), Health)
    threading.Thread(target=server.serve_forever, daemon=True).start()

    client = redis.from_url(REDIS_URL, decode_responses=True)
    info = {k: str(v) for k, v in extra_info().items()}
    log.info("starting %s %s", SERVICE, info)
    while not _stop.is_set():
        try:
            client.xadd(
                STREAM,
                {
                    "service": SERVICE,
                    "status": "ok",
                    "host": socket.gethostname(),
                    "mode": os.getenv("TRADING_MODE", ""),
                    "schema_version": "0",
                    **info,
                },
                maxlen=1000,
                approximate=True,
            )
            _last_ok = time.time()
        except redis.RedisError as exc:
            log.warning("heartbeat failed: %s", exc)
        _stop.wait(INTERVAL)
    server.shutdown()
    log.info("stopped")


if __name__ == "__main__":
    main()
