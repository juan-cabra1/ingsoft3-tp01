"""Unit tests for the /health payload (utils/health.py)."""
from utils.health import build_health_payload


class TestBuildHealthPayload:
    def test_base_conectada_es_healthy(self):
        payload = build_health_payload(db_ok=True, uptime_seconds=10, commit="abc123", version="2.1.0")
        assert payload["status"] == "healthy"
        assert payload["database"] == "connected"

    def test_base_caida_es_degraded(self):
        payload = build_health_payload(db_ok=False, uptime_seconds=10, commit="abc123", version="2.1.0")
        assert payload["status"] == "degraded"
        assert payload["database"] == "unreachable"

    def test_informa_el_commit_que_corre(self):
        payload = build_health_payload(db_ok=True, uptime_seconds=0, commit="a1b2c3d4", version="2.1.0")
        assert payload["commit"] == "a1b2c3d4"

    def test_sin_commit_informa_unknown(self):
        payload = build_health_payload(db_ok=True, uptime_seconds=0, commit="", version="2.1.0")
        assert payload["commit"] == "unknown"

    def test_conserva_version_y_uptime(self):
        payload = build_health_payload(db_ok=True, uptime_seconds=42, commit="x", version="2.1.0")
        assert payload["version"] == "2.1.0"
        assert payload["uptime_seconds"] == 42
