import pytest


def test_register_and_login(client):
    # 1. Register Admin
    reg_payload = {
        "email": "testadmin@acme.com",
        "password": "Password123!",
        "full_name": "Test Administrator",
        "role": "admin",
        "workspace_name": "Acme Test Org"
    }
    r = client.post("/auth/register", json=reg_payload)
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert data["role"] == "admin"
    assert data["workspace_name"] == "Acme Test Org"

    # 2. Register Duplicate Email Fails
    r_dup = client.post("/auth/register", json=reg_payload)
    assert r_dup.status_code == 400

    # 3. Login
    login_payload = {
        "email": "testadmin@acme.com",
        "password": "Password123!"
    }
    r_login = client.post("/auth/login", json=login_payload)
    assert r_login.status_code == 200
    login_data = r_login.json()
    token = login_data["access_token"]

    # 4. Access /auth/me
    headers = {"Authorization": f"Bearer {token}"}
    r_me = client.get("/auth/me", headers=headers)
    assert r_me.status_code == 200
    me_data = r_me.json()
    assert me_data["email"] == "testadmin@acme.com"
    assert me_data["role"] == "admin"
