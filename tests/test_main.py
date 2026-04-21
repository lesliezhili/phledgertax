import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_readme():
    response = client.get("/readme")
    assert response.status_code == 200
    assert "PHLedger" in response.json()["readme"]

def test_ui():
    response = client.get("/ui")
    assert response.status_code == 200
    assert "PHLedger" in response.text