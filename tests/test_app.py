import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]

def test_signup_and_remove_participant():
    # Use a unique email to avoid conflicts
    activity = "Chess Club"
    email = "pytestuser@mergington.edu"
    # Remove if already present
    client.delete(f"/activities/{activity}/participant/{email}")
    # Signup
    resp_signup = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp_signup.status_code == 200
    assert f"Signed up {email}" in resp_signup.json()["message"]
    # Try duplicate signup
    resp_dup = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp_dup.status_code == 400
    # Remove participant
    resp_remove = client.delete(f"/activities/{activity}/participant/{email}")
    assert resp_remove.status_code == 200
    assert f"Removed {email}" in resp_remove.json()["message"]
    # Remove again should 404
    resp_remove2 = client.delete(f"/activities/{activity}/participant/{email}")
    assert resp_remove2.status_code == 404

def test_signup_invalid_activity():
    resp = client.post("/activities/Nonexistent/signup?email=foo@bar.com")
    assert resp.status_code == 404

def test_remove_invalid_participant():
    resp = client.delete("/activities/Chess Club/participant/notfound@mergington.edu")
    assert resp.status_code == 404
