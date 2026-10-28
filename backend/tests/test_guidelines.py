import pytest
from bson import ObjectId


def test_guidelines_and_facts_comprehensive(client):
    # 1. Setup Admin in Workspace A
    r_admin_a = client.post("/auth/register", json={
        "email": "admin.a@testcorp.com",
        "password": "Password123!",
        "full_name": "Admin Alpha",
        "role": "admin",
        "workspace_name": "Workspace Alpha"
    })
    assert r_admin_a.status_code == 201
    token_a = r_admin_a.json()["access_token"]
    ws_a_id = r_admin_a.json()["workspace_id"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Setup Creator in Workspace A
    r_creator_a = client.post("/auth/register", json={
        "email": "creator.a@testcorp.com",
        "password": "Password123!",
        "full_name": "Creator Alpha",
        "role": "creator",
        "workspace_id": ws_a_id
    })
    assert r_creator_a.status_code == 201
    creator_headers_a = {"Authorization": f"Bearer {r_creator_a.json()['access_token']}"}

    # Setup Admin in Workspace B
    r_admin_b = client.post("/auth/register", json={
        "email": "admin.b@betacorp.com",
        "password": "Password123!",
        "full_name": "Admin Beta",
        "role": "admin",
        "workspace_name": "Workspace Beta"
    })
    assert r_admin_b.status_code == 201
    headers_b = {"Authorization": f"Bearer {r_admin_b.json()['access_token']}"}

    # =========================================================================
    # APPROVED FACTS TESTS
    # =========================================================================

    # 2. Permission check: Creator cannot create approved fact (403)
    r_creator_fact = client.post("/guidelines/facts", json={
        "product_name": "Widget X",
        "attribute": "battery_life",
        "statement": "Up to 10 hours",
        "numerical_value": 10.0
    }, headers=creator_headers_a)
    assert r_creator_fact.status_code == 403

    # 3. Validation check: Blank product_name or statement rejected (400)
    r_blank_fact = client.post("/guidelines/facts", json={
        "product_name": "   ",
        "attribute": "battery_life",
        "statement": "Valid statement"
    }, headers=headers_a)
    assert r_blank_fact.status_code == 400

    # 4. Create fact successfully
    r_fact1 = client.post("/guidelines/facts", json={
        "product_name": "SoundWave Ultra",
        "attribute": "battery_life",
        "statement": "SoundWave Ultra provides up to 30 hours of playback.",
        "numerical_value": 30.0,
        "numerical_unit": "hours",
        "numerical_comparator": "up_to",
        "source_id": "SRC-SW-001"
    }, headers=headers_a)
    assert r_fact1.status_code == 201
    f1_data = r_fact1.json()
    assert f1_data["source_id"] == "SRC-SW-001"
    assert f1_data["version_id"] == "v1.0"
    f1_id = f1_data["fact_id"]

    # 5. Duplicate source_id rejected in same workspace (400)
    r_dup_fact = client.post("/guidelines/facts", json={
        "product_name": "Another Product",
        "attribute": "general",
        "statement": "Duplicate source id",
        "source_id": "SRC-SW-001"
    }, headers=headers_a)
    assert r_dup_fact.status_code == 400

    # 6. Retrieve fact by fact_id and by source_id
    r_get_by_fid = client.get(f"/guidelines/facts/{f1_id}", headers=headers_a)
    assert r_get_by_fid.status_code == 200
    assert r_get_by_fid.json()["statement"] == f1_data["statement"]

    r_get_by_sid = client.get("/guidelines/facts/SRC-SW-001", headers=headers_a)
    assert r_get_by_sid.status_code == 200
    assert r_get_by_sid.json()["fact_id"] == f1_id

    # 7. Update fact: Version bumps to v1.1
    r_update_f1 = client.put(f"/guidelines/facts/{f1_id}", json={
        "statement": "SoundWave Ultra delivers up to 36 hours of enhanced playback.",
        "numerical_value": 36.0
    }, headers=headers_a)
    assert r_update_f1.status_code == 200
    assert r_update_f1.json()["version_id"] == "v1.1"
    assert r_update_f1.json()["numerical_value"] == 36.0

    # Update again: Version bumps to v1.2
    r_update_f1_again = client.put(f"/guidelines/facts/{f1_id}", json={
        "statement": "SoundWave Ultra delivers up to 40 hours of enhanced playback.",
        "numerical_value": 40.0
    }, headers=headers_a)
    assert r_update_f1_again.status_code == 200
    assert r_update_f1_again.json()["version_id"] == "v1.2"

    # 8. Safe regex search with special characters like (, [, *, ?
    r_search_special = client.get("/guidelines/facts?search=(Ultra)*[playback]?", headers=headers_a)
    assert r_search_special.status_code == 200

    # 9. Workspace isolation: Workspace B cannot see Workspace A's fact
    r_isolated_fact = client.get(f"/guidelines/facts/{f1_id}", headers=headers_b)
    assert r_isolated_fact.status_code == 404

    # =========================================================================
    # BRAND GUIDELINE RULES TESTS
    # =========================================================================

    # 10. Creator cannot create guideline rule (403)
    r_creator_rule = client.post("/guidelines", json={
        "category": "prohibited_term",
        "term_or_pattern": "unbeatable",
        "reason": "Unsubstantiated puffery"
    }, headers=creator_headers_a)
    assert r_creator_rule.status_code == 403

    # 11. Blank term rejected (400)
    r_blank_rule = client.post("/guidelines", json={
        "category": "prohibited_term",
        "term_or_pattern": "   ",
        "reason": "Some reason"
    }, headers=headers_a)
    assert r_blank_rule.status_code == 400

    # 12. Create guideline rule successfully
    r_rule1 = client.post("/guidelines", json={
        "category": "prohibited_term",
        "term_or_pattern": "AI miracle",
        "replacement": "advanced automated intelligence",
        "reason": "Miracle claims violate FTC substantiation rules.",
        "severity": "critical",
        "rule_id": "RULE-TEST-001"
    }, headers=headers_a)
    assert r_rule1.status_code == 201
    g1_data = r_rule1.json()
    assert g1_data["rule_id"] == "RULE-TEST-001"
    assert g1_data["version_id"] == "v1.0"
    assert g1_data["is_active"] is True
    g1_id = g1_data["guideline_id"]

    # 13. Duplicate rule_id in same workspace rejected (400)
    r_dup_rule = client.post("/guidelines", json={
        "category": "preferred_term",
        "term_or_pattern": "something else",
        "reason": "another reason",
        "rule_id": "RULE-TEST-001"
    }, headers=headers_a)
    assert r_dup_rule.status_code == 400

    # 14. Get guideline by guideline_id and rule_id
    r_get_by_gid = client.get(f"/guidelines/{g1_id}", headers=headers_a)
    assert r_get_by_gid.status_code == 200
    assert r_get_by_gid.json()["term_or_pattern"] == "AI miracle"

    r_get_by_rid = client.get("/guidelines/RULE-TEST-001", headers=headers_a)
    assert r_get_by_rid.status_code == 200
    assert r_get_by_rid.json()["guideline_id"] == g1_id

    # 15. Update guideline: Version bumps from v1.0 to v1.1
    r_update_g1 = client.put(f"/guidelines/{g1_id}", json={
        "reason": "Miracle or magical claims violate FTC compliance standards strictly.",
        "severity": "critical"
    }, headers=headers_a)
    assert r_update_g1.status_code == 200
    assert r_update_g1.json()["version_id"] == "v1.1"

    # 16. Toggle guideline rule active status
    r_toggle = client.patch(f"/guidelines/{g1_id}/toggle", headers=headers_a)
    assert r_toggle.status_code == 200
    assert r_toggle.json()["is_active"] is False

    # Check that list reflects is_active filter
    r_list_active = client.get("/guidelines?is_active=true", headers=headers_a)
    assert r_list_active.status_code == 200
    active_ids = [r["guideline_id"] for r in r_list_active.json()]
    assert g1_id not in active_ids

    # Toggle back to active
    r_toggle2 = client.patch(f"/guidelines/{g1_id}/toggle", headers=headers_a)
    assert r_toggle2.status_code == 200
    assert r_toggle2.json()["is_active"] is True

    # 17. Stats endpoint
    r_stats = client.get("/guidelines/stats", headers=headers_a)
    assert r_stats.status_code == 200
    stats = r_stats.json()
    assert stats["total_guidelines"] >= 1
    assert stats["active_guidelines"] >= 1
    assert stats["total_facts"] >= 1

    # 18. Bulk create facts
    r_bulk_facts = client.post("/guidelines/facts/bulk", json={
        "facts": [
            {
                "product_name": "SoundWave Mini",
                "attribute": "weight",
                "statement": "Weighs only 150 grams",
                "numerical_value": 150.0,
                "numerical_unit": "g"
            },
            {
                "product_name": "SoundWave Pro",
                "attribute": "water_resistance",
                "statement": "Rated IPX7 waterproof",
                "numerical_value": 7.0,
                "numerical_unit": "ipx"
            }
        ]
    }, headers=headers_a)
    assert r_bulk_facts.status_code == 201
    assert len(r_bulk_facts.json()) == 2

    # 19. Bulk create guidelines
    r_bulk_rules = client.post("/guidelines/bulk", json={
        "guidelines": [
            {
                "category": "preferred_term",
                "term_or_pattern": "noise blocker",
                "replacement": "Active Noise Cancellation",
                "reason": "Standard product naming convention"
            },
            {
                "category": "tone_principle",
                "term_or_pattern": "cheap",
                "replacement": "accessible",
                "reason": "Brand tone principle: maintain premium perception"
            }
        ]
    }, headers=headers_a)
    assert r_bulk_rules.status_code == 201
    assert len(r_bulk_rules.json()) == 2

    # 20. Delete guideline and delete fact
    r_del_rule = client.delete(f"/guidelines/{g1_id}", headers=headers_a)
    assert r_del_rule.status_code == 200
    assert r_del_rule.json()["guideline_id"] == g1_id

    # Verify deleted
    r_verify_del = client.get(f"/guidelines/{g1_id}", headers=headers_a)
    assert r_verify_del.status_code == 404

    r_del_fact = client.delete(f"/guidelines/facts/{f1_id}", headers=headers_a)
    assert r_del_fact.status_code == 200
    assert r_del_fact.json()["fact_id"] == f1_id

    # Verify deleted
    r_verify_del_f = client.get(f"/guidelines/facts/{f1_id}", headers=headers_a)
    assert r_verify_del_f.status_code == 404
