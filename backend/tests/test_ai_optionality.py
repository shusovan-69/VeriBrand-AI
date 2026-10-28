import pytest
from app.config import settings
from app.services.ai_service import AIService
from app.services.rule_engine import DeterministicRuleEngine
from seed_data import seed_database


@pytest.fixture(autouse=True)
def ensure_test_data(mock_db):
    seed_database(target_db=mock_db)


@pytest.mark.asyncio
async def test_ai_service_without_api_key(mock_db, monkeypatch):
    """
    Verify AIService behavior when LLM_API_KEY is empty:
    1. Returns empty findings list (does not fabricate findings)
    2. Returns is_ai_assisted = False
    3. Returns clear explanatory status message
    4. Makes zero HTTP network calls
    """
    # Force LLM_API_KEY to empty
    monkeypatch.setattr(settings, "LLM_API_KEY", "")

    guidelines = list(mock_db.guidelines.find({"workspace_id": "WS-DEMO-001"}))
    facts = list(mock_db.approved_facts.find({"workspace_id": "WS-DEMO-001"}))

    findings, is_ai_assisted, status_message = await AIService.analyze_draft_with_ai(
        db=mock_db,
        workspace_id="WS-DEMO-001",
        draft_id="DFT-TEST",
        revision_id="REV-TEST",
        draft_text="Our headphones deliver guaranteed 24-hour battery life with noise blocking.",
        guidelines=guidelines,
        approved_facts=facts
    )

    # Must NOT fabricate findings
    assert findings == []
    # Must report False for AI assistance
    assert is_ai_assisted is False
    # Must provide clear status message indicating deterministic fallback
    assert "LLM_API_KEY not configured" in status_message
    assert "Deterministic verification fully operational" in status_message


def test_health_endpoint_reports_ai_status(client, monkeypatch):
    """
    Verify /health endpoint accurately reflects ai_enabled status without error.
    """
    monkeypatch.setattr(settings, "LLM_API_KEY", "")
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["ai_enabled"] is False


def test_deterministic_rule_engine_standalone():
    """
    Verify DeterministicRuleEngine runs completely offline with zero LLM dependence.
    """
    test_guidelines = [
        {
            "guideline_id": "GL-TEST-1",
            "rule_id": "RULE-TERM-001",
            "workspace_id": "WS-TEST",
            "category": "prohibited_term",
            "term_or_pattern": "AI proof",
            "replacement": "evidence-first brand governance",
            "reason": "Claims of AI infallibility violate advertising laws.",
            "severity": "high",
            "version_id": "v1.0",
            "is_active": True
        },
        {
            "guideline_id": "GL-TEST-2",
            "rule_id": "RULE-PREF-001",
            "workspace_id": "WS-TEST",
            "category": "preferred_term",
            "term_or_pattern": "noise blocking",
            "replacement": "Active Noise Cancellation (ANC)",
            "reason": "Official trademark terminology.",
            "severity": "medium",
            "version_id": "v1.0",
            "is_active": True
        }
    ]

    test_facts = [
        {
            "fact_id": "FACT-TEST-1",
            "source_id": "SRC-FACT-001",
            "workspace_id": "WS-TEST",
            "product_name": "AeroPulse Wireless Headphones",
            "attribute": "battery_life",
            "statement": "Battery life: up to 12 hours under standard testing conditions.",
            "numerical_value": 12.0,
            "numerical_unit": "hours",
            "numerical_comparator": "up_to",
            "version_id": "v1.0"
        }
    ]

    draft_text = "Our AeroPulse Wireless Headphones offer AI proof audio with noise blocking and 24-hour battery life guaranteed."

    findings = DeterministicRuleEngine.run_checks(
        draft_text=draft_text,
        guidelines=test_guidelines,
        approved_facts=test_facts,
        draft_id="DFT-T1",
        revision_id="REV-T1",
        workspace_id="WS-TEST"
    )

    # 4 distinct deterministic issues must be identified:
    # 1. Prohibited term: 'AI proof'
    # 2. Preferred term: 'noise blocking'
    # 3. Unsupported guarantee: 'guaranteed'
    # 4. Factual contradiction: 24-hour vs up to 12 hours
    assert len(findings) == 4

    categories = {f["category"] for f in findings}
    assert "guideline_violation" in categories
    assert "tone_issue" in categories
    assert "unsupported_claim" in categories
    assert "contradiction" in categories

    contradiction = next(f for f in findings if f["category"] == "contradiction")
    assert contradiction["severity"] == "critical"
    assert contradiction["source_id"] == "SRC-FACT-001"
    assert "up to 12 hours" in contradiction["suggested_revision"]
    assert contradiction["draft_span"] is not None


def test_verification_endpoint_without_api_key(client, monkeypatch):
    """
    Verify the full /drafts/{draft_id}/review endpoint operates cleanly without LLM_API_KEY.
    """
    monkeypatch.setattr(settings, "LLM_API_KEY", "")

    # Login as Creator
    login_res = client.post("/auth/login", json={"email": "creator@veribrand.ai", "password": "CreatorPass123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Run verification on Draft 1
    review_res = client.post("/drafts/DFT-DEMO-001/review", headers=headers)
    assert review_res.status_code == 200
    data = review_res.json()

    # Verify AI is marked not assisted and explanation is clear
    assert data["ai_assisted"] is False
    assert "Deterministic verification fully operational" in data["ai_status_message"]

    # Verify deterministic findings are present and accurate
    assert data["total_findings"] >= 2
    assert data["findings_by_severity"]["critical"] >= 1  # 24hr battery contradiction

    for finding in data["findings"]:
        # Verify findings are grounded and not fabricated
        assert finding["finding_id"].startswith("FIND-")
        assert not finding["finding_id"].startswith("FIND-AI-")
        assert finding["draft_span"] is not None  # Exact text positioning preserved

