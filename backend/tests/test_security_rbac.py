import pytest
from pydantic import ValidationError
from app.config import Settings
from app.services.auth_service import create_access_token


def test_production_jwt_secret_validation():
    """
    Ensure the backend strictly blocks startup in production if an insecure
    or development placeholder JWT secret is used.
    """
    # Insecure dev placeholder in production must fail validation
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            ENVIRONMENT="production",
            JWT_SECRET="dev_insecure_jwt_secret_for_local_development_only",
            _env_file=None
        )
    assert "CRITICAL PRODUCTION SECURITY ERROR" in str(exc_info.value)

    # Short secret (< 32 chars) in production must fail validation
    with pytest.raises(ValidationError) as exc_info:
        Settings(
            ENVIRONMENT="production",
            JWT_SECRET="short_secret_123",
            _env_file=None
        )
    assert "CRITICAL PRODUCTION SECURITY ERROR" in str(exc_info.value)

    # Strong 64-char production secret must succeed
    strong_secret = "a" * 32 + "b" * 32
    prod_settings = Settings(
        ENVIRONMENT="production",
        JWT_SECRET=strong_secret,
        _env_file=None
    )
    assert prod_settings.JWT_SECRET == strong_secret

    # Development environment allows dev placeholder
    dev_settings = Settings(
        ENVIRONMENT="development",
        JWT_SECRET="dev_insecure_jwt_secret_for_local_development_only",
        _env_file=None
    )
    assert dev_settings.ENVIRONMENT == "development"


def test_rbac_creator_cannot_access_admin_guideline_routes(client, mock_db):
    """
    Verify that a user with 'creator' role is strictly blocked (HTTP 403) by the
    FastAPI backend from performing administrative operations (creating/modifying guidelines).
    """
    # Create creator user in mock DB
    creator_token = create_access_token({
        "sub": "USR-CREATOR-TEST",
        "email": "creator.rbac@test.com",
        "role": "creator",
        "workspace_id": "WS-TEST-001"
    })
    mock_db.users.update_one(
        {"user_id": "USR-CREATOR-TEST"},
        {"$set": {
            "user_id": "USR-CREATOR-TEST",
            "email": "creator.rbac@test.com",
            "role": "creator",
            "workspace_id": "WS-TEST-001",
            "is_active": True
        }},
        upsert=True
    )
    mock_db.workspaces.update_one(
        {"workspace_id": "WS-TEST-001"},
        {"$set": {"workspace_id": "WS-TEST-001", "name": "RBAC Test Workspace"}},
        upsert=True
    )

    headers = {"Authorization": f"Bearer {creator_token}"}

    # Attempt 1: Creator tries to create a brand guideline -> Must return 403 Forbidden
    resp = client.post(
        "/guidelines",
        json={
            "rule_id": "RULE-TEST-001",
            "category": "prohibited_term",
            "title": "Hacked Rule",
            "rule_text": "Prohibited term hack",
            "prohibited_term": "badword",
            "severity": "critical"
        },
        headers=headers
    )
    assert resp.status_code == 403, f"Expected 403 Forbidden, got {resp.status_code}: {resp.text}"
    assert "Forbidden" in resp.json()["detail"]

    # Attempt 2: Creator tries to create an approved product fact -> Must return 403 Forbidden
    resp2 = client.post(
        "/guidelines/facts",
        json={
            "source_id": "SRC-TEST-001",
            "product_name": "Test Product",
            "claim_topic": "battery",
            "approved_specification": "24 hours",
            "numerical_limit": 24.0,
            "unit": "hours",
            "comparator": "up_to"
        },
        headers=headers
    )
    assert resp2.status_code == 403, f"Expected 403 Forbidden, got {resp2.status_code}: {resp2.text}"
    assert "Forbidden" in resp2.json()["detail"]


def test_rbac_creator_cannot_approve_drafts(client, mock_db):
    """
    Verify that a creator cannot submit approval decisions on drafts.
    """
    creator_token = create_access_token({
        "sub": "USR-CREATOR-TEST",
        "email": "creator.rbac@test.com",
        "role": "creator",
        "workspace_id": "WS-TEST-001"
    })
    headers = {"Authorization": f"Bearer {creator_token}"}

    resp = client.post(
        "/reviews/DFT-TEST-01/decision",
        json={"decision": "approved", "comment": "Self approving"},
        headers=headers
    )
    assert resp.status_code == 403
    assert "Forbidden" in resp.json()["detail"]


def test_rbac_self_approval_blocked_for_admin_creator(client, mock_db):
    """
    Verify separation of duties: Even an administrator cannot approve a draft
    that they personally created.
    """
    admin_id = "USR-ADMIN-SELF-APPROVE"
    admin_token = create_access_token({
        "sub": admin_id,
        "email": "admin.self@test.com",
        "role": "admin",
        "workspace_id": "WS-TEST-001"
    })
    mock_db.users.update_one(
        {"user_id": admin_id},
        {"$set": {
            "user_id": admin_id,
            "email": "admin.self@test.com",
            "role": "admin",
            "workspace_id": "WS-TEST-001",
            "is_active": True
        }},
        upsert=True
    )
    # Draft created by this admin
    mock_db.drafts.update_one(
        {"draft_id": "DFT-SELF-01"},
        {"$set": {
            "draft_id": "DFT-SELF-01",
            "workspace_id": "WS-TEST-001",
            "creator_id": admin_id,
            "creator_name": "Admin Creator",
            "title": "Self draft",
            "current_revision_id": "REV-01",
            "status": "under_review"
        }},
        upsert=True
    )

    headers = {"Authorization": f"Bearer {admin_token}"}

    resp = client.post(
        "/reviews/DFT-SELF-01/decision",
        json={"decision": "approved", "comment": "Trying to self-approve"},
        headers=headers
    )
    assert resp.status_code == 403
    assert "Separation of concerns violation" in resp.json()["detail"]
