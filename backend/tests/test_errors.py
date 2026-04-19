"""Unit tests for backend/common/errors.py

Verifies that the unhandled exception handler:
  - Returns a correlation_id in the response body
  - Does NOT expose the raw exception string to clients
  - Returns HTTP 500
"""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from common.errors import register_exception_handlers


@pytest.fixture
def client():
    """Create a test FastAPI app with a route that raises an unhandled exception."""
    app = FastAPI()
    register_exception_handlers(app)

    @app.get("/explode")
    def explode():
        raise RuntimeError("SUPER_SECRET_INTERNAL_ERROR_MESSAGE")

    return TestClient(app, raise_server_exceptions=False)


class TestUnhandledExceptionHandler:
    def test_returns_500(self, client):
        response = client.get("/explode")
        assert response.status_code == 500

    def test_returns_correlation_id(self, client):
        response = client.get("/explode")
        body = response.json()
        assert "error" in body
        assert "correlation_id" in body["error"]
        assert len(body["error"]["correlation_id"]) == 36  # UUID format

    def test_does_not_expose_raw_exception(self, client):
        response = client.get("/explode")
        body = response.json()
        # The raw exception message must never appear in any response field
        response_text = response.text
        assert "SUPER_SECRET_INTERNAL_ERROR_MESSAGE" not in response_text

    def test_returns_generic_message(self, client):
        response = client.get("/explode")
        body = response.json()
        assert body["error"]["code"] == "internal_server_error"
        assert "unexpected error" in body["error"]["message"].lower()

    def test_correlation_ids_are_unique(self, client):
        """Each request should get its own unique correlation_id."""
        r1 = client.get("/explode")
        r2 = client.get("/explode")
        id1 = r1.json()["error"]["correlation_id"]
        id2 = r2.json()["error"]["correlation_id"]
        assert id1 != id2
