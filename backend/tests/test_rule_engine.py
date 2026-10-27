import pytest
from app.services.rule_engine import DeterministicRuleEngine


def test_section_7_master_demonstration():
    """
    SECTION 7 SPECIFICATION TEST:
    Product: Example Wireless Headphones
    Approved fact: 'Battery life: up to 12 hours.' (SRC-FACT-001)
    Submitted draft: 'Our headphones deliver guaranteed 24-hour battery life.'

    Expected:
    Finding 1: Factual contradiction (claims 24 hours vs approved specification up to 12 hours)
    Finding 2: Potential unsupported guarantee ('guaranteed' requires supporting evidence)
    Suggested revision: Contains up to 12 hours
    """
    approved_facts = [
        {
            "fact_id": "FACT-001",
            "source_id": "SRC-FACT-001",
            "workspace_id": "WS-TEST",
            "product_name": "Example Wireless Headphones",
            "attribute": "battery_life",
            "statement": "Battery life: up to 12 hours under standard testing conditions.",
            "numerical_value": 12.0,
            "numerical_unit": "hours",
            "numerical_comparator": "up_to",
            "version_id": "v1.0"
        }
    ]

    guidelines = [
        {
            "guideline_id": "GL-001",
            "rule_id": "RULE-TERM-001",
            "workspace_id": "WS-TEST",
            "category": "prohibited_term",
            "term_or_pattern": "AI proof",
            "replacement": "evidence-first brand governance",
            "reason": "Exaggerated infallibility claim",
            "severity": "high",
            "version_id": "v1.0",
            "is_active": True
        }
    ]

    submitted_draft = "Our headphones deliver guaranteed 24-hour battery life."

    findings = DeterministicRuleEngine.run_checks(
        draft_text=submitted_draft,
        guidelines=guidelines,
        approved_facts=approved_facts,
        draft_id="DFT-001",
        revision_id="REV-001",
        workspace_id="WS-TEST"
    )

    assert len(findings) == 2, f"Expected 2 findings, got {len(findings)}"

    # Check Finding 1: Contradiction
    contradiction_findings = [f for f in findings if f["category"] == "contradiction"]
    assert len(contradiction_findings) == 1
    c_find = contradiction_findings[0]
    assert c_find["severity"] == "critical"
    assert c_find["evidence_status"] == "contradicted"
    assert c_find["source_id"] == "SRC-FACT-001"
    assert "24" in c_find["original_text"] or "24-hour" in c_find["original_text"]
    assert "12" in c_find["explanation"]
    assert "up to 12 hours" in c_find["suggested_revision"].lower()

    # Check Finding 2: Unsupported Guarantee
    guarantee_findings = [f for f in findings if f["category"] == "unsupported_claim"]
    assert len(guarantee_findings) == 1
    g_find = guarantee_findings[0]
    assert g_find["original_text"].lower() == "guaranteed"
    assert g_find["evidence_status"] == "insufficient_evidence"
    assert "guaranteed" in g_find["explanation"].lower()


def test_compliant_draft():
    approved_facts = [
        {
            "fact_id": "FACT-001",
            "source_id": "SRC-FACT-001",
            "workspace_id": "WS-TEST",
            "product_name": "Example Wireless Headphones",
            "attribute": "battery_life",
            "statement": "Battery life: up to 12 hours.",
            "numerical_value": 12.0,
            "numerical_unit": "hours",
            "numerical_comparator": "up_to",
            "version_id": "v1.0"
        }
    ]
    guidelines = []
    compliant_draft = "Our wireless headphones offer up to 10 hours of rich audio playtime."
    findings = DeterministicRuleEngine.run_checks(
        draft_text=compliant_draft,
        guidelines=guidelines,
        approved_facts=approved_facts,
        draft_id="DFT-002",
        revision_id="REV-001",
        workspace_id="WS-TEST"
    )
    # 10 <= 12 hours is compliant
    contradictions = [f for f in findings if f["category"] == "contradiction"]
    assert len(contradictions) == 0


def test_prohibited_terms_and_replacement():
    guidelines = [
        {
            "guideline_id": "GL-001",
            "rule_id": "RULE-TERM-001",
            "workspace_id": "WS-TEST",
            "category": "prohibited_term",
            "term_or_pattern": "revolutionary miracle",
            "replacement": "state-of-the-art innovation",
            "reason": "Exaggerated puffery degrades brand authority.",
            "severity": "high",
            "version_id": "v1.0",
            "is_active": True
        }
    ]
    draft = "Discover our revolutionary miracle in consumer audio."
    findings = DeterministicRuleEngine.run_checks(
        draft_text=draft,
        guidelines=guidelines,
        approved_facts=[],
        draft_id="DFT-003",
        revision_id="REV-001",
        workspace_id="WS-TEST"
    )
    assert len(findings) == 1
    assert findings[0]["category"] == "guideline_violation"
    assert findings[0]["suggested_revision"] == "state-of-the-art innovation"
    assert findings[0]["source_id"] == "RULE-TERM-001"
