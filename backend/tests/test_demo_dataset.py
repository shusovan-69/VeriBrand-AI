import pytest
from seed_data import seed_database


@pytest.fixture(autouse=True)
def setup_demo_data(mock_db):
    # Ensure mock_db has the full demo dataset for this test module
    seed_database(target_db=mock_db)


def test_demo_dataset_integrity(mock_db):
    # 1. Verify workspace isolation & organization data
    ws1 = mock_db.workspaces.find_one({"workspace_id": "WS-DEMO-001"})
    assert ws1 is not None
    assert ws1["brand_name"] == "Apex Sound"
    assert ws1["organization_name"] == "Apex Global Technologies"

    # 2. Verify all 4 users exist and roles are properly assigned
    users = list(mock_db.users.find({"workspace_id": "WS-DEMO-001"}))
    assert len(users) == 4
    roles = {u["role"] for u in users}
    assert roles == {"admin", "creator", "reviewer"}

    # 3. Verify guidelines and approved facts counts
    guidelines_count = mock_db.guidelines.count_documents({"workspace_id": "WS-DEMO-001"})
    facts_count = mock_db.approved_facts.count_documents({"workspace_id": "WS-DEMO-001"})
    assert guidelines_count >= 8
    assert facts_count >= 10

    # 4. Verify exactly 10 demo drafts exist with correct status distribution
    drafts = list(mock_db.drafts.find({"workspace_id": "WS-DEMO-001"}))
    assert len(drafts) == 10
    statuses = {d["status"] for d in drafts}
    assert "approved" in statuses
    assert "under_review" in statuses
    assert "changes_requested" in statuses
    assert "submitted" in statuses


def test_authentication_and_quick_personas(client):
    personas = [
        ("admin@veribrand.ai", "AdminPass123!", "admin"),
        ("creator@veribrand.ai", "CreatorPass123!", "creator"),
        ("elena.creator@veribrand.ai", "CreatorPass123!", "creator"),
        ("reviewer@veribrand.ai", "ReviewerPass123!", "reviewer"),
    ]

    for email, password, expected_role in personas:
        resp = client.post("/auth/login", json={"email": email, "password": password})
        assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
        data = resp.json()
        assert "access_token" in data
        assert data["role"] == expected_role
        assert data["workspace_id"] == "WS-DEMO-001"


def test_dashboard_kpis_and_compliance(client):
    # Login as admin
    login_res = client.post("/auth/login", json={"email": "admin@veribrand.ai", "password": "AdminPass123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch dashboard stats
    stats_res = client.get("/dashboard/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_drafts"] == 10
    assert stats["pending_reviews"] == 4  # 3 under_review + 1 submitted
    assert stats["approved_content"] == 4
    assert stats["source_change_alerts"] >= 2
    assert stats["compliance_rate_percent"] == 40.0  # 4 approved out of 10 = 40.0%


def test_revision_diff_and_insights(client):
    login_res = client.post("/auth/login", json={"email": "admin@veribrand.ai", "password": "AdminPass123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Compare revisions for Draft 2 (REV-DEMO-002A -> REV-DEMO-002B)
    diff_res = client.get(
        "/insights/revisions/compare",
        params={
            "draft_id": "DFT-DEMO-002",
            "base_rev": "REV-DEMO-002A",
            "new_rev": "REV-DEMO-002B"
        },
        headers=headers
    )
    assert diff_res.status_code == 200
    diff = diff_res.json()
    assert diff["base_revision"]["total_findings"] >= 1
    assert diff["new_revision"]["total_findings"] == 0
    assert diff["resolved_count"] >= 1
    assert len(diff["text_diff"]) > 0


def test_separation_of_concerns_creator_cannot_self_approve(client):
    # Login as Creator
    login_res = client.post("/auth/login", json={"email": "creator@veribrand.ai", "password": "CreatorPass123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to approve their own draft (Draft 1)
    res = client.post(
        "/reviews/DFT-DEMO-001/decision",
        json={"decision": "approved", "comment": "I approve my own work"},
        headers=headers
    )
    # Role check should forbid creator from calling review decision endpoint
    assert res.status_code in [403, 401]
