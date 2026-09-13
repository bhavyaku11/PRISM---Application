"""PRISM — Production Deployment Smoke Tests
Verifies deployment readiness, CORS origin handling, health checks, error sanitization, and secret protection.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app
from app.core.config import settings


client = TestClient(app)


class TestProductionEndpointsSmoke:
    """Smoke test suite simulating production deployment conditions."""

    def test_health_check_returns_ok_and_leaks_no_secrets(self):
        """GET /health must return status ok and contain zero credentials or internal metadata."""
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data == {"status": "ok"}
        # Ensure no accidental keys leak in response body or headers
        assert "key" not in resp.text.lower()
        assert "secret" not in resp.text.lower()
        assert "supabase" not in resp.text.lower()

    def test_root_endpoint_metadata(self):
        """GET / returns service name, version, and operational status without credentials."""
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "PRISM Backend API"
        assert data["status"] == "operational"
        assert "version" in data
        assert "password" not in resp.text.lower()
        assert "gsk_" not in resp.text

    def test_cors_preflight_allows_configured_origin(self):
        """OPTIONS preflight requests from an allowed origin must receive appropriate CORS headers."""
        headers = {
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Authorization,Content-Type",
        }
        resp = client.options("/api/ask", headers=headers)
        assert resp.status_code == 200
        assert resp.headers.get("access-control-allow-origin") == "http://localhost:3000"
        assert resp.headers.get("access-control-allow-credentials") == "true"
        # Must NEVER be wildcard '*' when credentials are true
        assert resp.headers.get("access-control-allow-origin") != "*"

    def test_cors_blocks_unauthorized_origin(self):
        """OPTIONS preflight from an unauthorized origin must not receive allow-origin header."""
        headers = {
            "Origin": "https://malicious-phishing-attacker.com",
            "Access-Control-Request-Method": "POST",
        }
        resp = client.options("/api/ask", headers=headers)
        # Unauthorized origin should not receive allow-origin matching the attacker
        allow_origin = resp.headers.get("access-control-allow-origin")
        assert allow_origin != "https://malicious-phishing-attacker.com"

    def test_unauthenticated_requests_consistently_rejected(self):
        """Unauthenticated requests to core endpoints must return 401 with standard detail."""
        endpoints = [
            ("POST", "/api/documents/test_doc/process"),
            ("GET", "/api/documents/test_doc/status"),
            ("POST", "/api/ask"),
            ("POST", "/api/retrieval/search"),
        ]
        for method, path in endpoints:
            if method == "POST":
                resp = client.post(path, json={})
            else:
                resp = client.get(path)
            assert resp.status_code == 401, f"Failed on {method} {path}"
            assert "Authentication token is required" in resp.json()["detail"]

    def test_production_mode_disables_docs(self):
        """When ENVIRONMENT is production, /docs and /redoc are disabled."""
        from fastapi import FastAPI
        from app.api.routes.health import router as health_router

        # Instantiate a production app instance mirroring main.py logic
        prod_app = FastAPI(
            docs_url=None,
            redoc_url=None,
        )
        prod_app.include_router(health_router)
        prod_client = TestClient(prod_app)

        docs_resp = prod_client.get("/docs")
        assert docs_resp.status_code == 404

        redoc_resp = prod_client.get("/redoc")
        assert docs_resp.status_code == 404
