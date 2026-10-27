import pytest


def test_end_to_end_workflow(client):
    # 1. Register Admin
    r_admin = client.post("/auth/register", json={
        "email": "sarah.admin@acme.com",
        "password": "AdminPassword123!",
        "full_name": "Sarah Admin",
        "role": "admin",
        "workspace_name": "Acme Workflow Corp"
    })
    assert r_admin.status_code == 201
    admin_data = r_admin.json()
    admin_token = admin_data["access_token"]
    ws_id = admin_data["workspace_id"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Register Creator in same workspace
    r_creator = client.post("/auth/register", json={
        "email": "alex.creator@acme.com",
        "password": "CreatorPassword123!",
        "full_name": "Alex Creator",
        "role": "creator",
        "workspace_id": ws_id
    })
    assert r_creator.status_code == 201
    creator_token = r_creator.json()["access_token"]
    creator_headers = {"Authorization": f"Bearer {creator_token}"}

    # 3. Register Reviewer in same workspace
    r_reviewer = client.post("/auth/register", json={
        "email": "marcus.reviewer@acme.com",
        "password": "ReviewerPassword123!",
        "full_name": "Marcus Reviewer",
        "role": "reviewer",
        "workspace_id": ws_id
    })
    assert r_reviewer.status_code == 201
    reviewer_token = r_reviewer.json()["access_token"]
    reviewer_headers = {"Authorization": f"Bearer {reviewer_token}"}

    # 4. Admin creates approved fact: Battery life up to 12 hours
    r_fact = client.post("/guidelines/facts", json={
        "product_name": "Example Wireless Headphones",
        "attribute": "battery_life",
        "statement": "Battery life: up to 12 hours under standard testing conditions.",
        "numerical_value": 12.0,
        "numerical_unit": "hours",
        "numerical_comparator": "up_to",
        "source_id": "SRC-FACT-001"
    }, headers=admin_headers)
    assert r_fact.status_code == 201
    assert r_fact.json()["source_id"] == "SRC-FACT-001"

    # 5. Creator submits draft with 24-hour contradiction
    r_draft = client.post("/drafts", json={
        "title": "Headphones Battery Ad",
        "target_product": "Example Wireless Headphones",
        "content_text": "Our headphones deliver guaranteed 24-hour battery life."
    }, headers=creator_headers)
    assert r_draft.status_code == 201
    draft_data = r_draft.json()
    draft_id = draft_data["draft_id"]
    assert draft_data["status"] == "submitted"

    # 6. Run verification
    r_verify = client.post(f"/drafts/{draft_id}/review", headers=creator_headers)
    assert r_verify.status_code == 200
    v_data = r_verify.json()
    assert v_data["total_findings"] >= 2
    assert v_data["findings_by_severity"]["critical"] >= 1
    # Check that finding cites SRC-FACT-001
    fact_findings = [f for f in v_data["findings"] if f["source_id"] == "SRC-FACT-001"]
    assert len(fact_findings) == 1
    assert fact_findings[0]["evidence_status"] == "contradicted"

    # 7. Creator attempts to self-approve draft -> BLOCKED!
    r_self_approve = client.post(f"/reviews/{draft_id}/decision", json={
        "decision": "approved",
        "comment": "I approve my own work"
    }, headers=creator_headers)
    assert r_self_approve.status_code == 403
    detail_msg = r_self_approve.json()["detail"].lower()
    assert "forbidden" in detail_msg or "strictly prohibited" in detail_msg

    # 8. Reviewer attempts to approve with unresolved critical findings WITHOUT override reason -> BLOCKED!
    r_unresolved_approve = client.post(f"/reviews/{draft_id}/decision", json={
        "decision": "approved",
        "comment": "Attempting approval without justification"
    }, headers=reviewer_headers)
    assert r_unresolved_approve.status_code == 400
    assert "override_reason" in r_unresolved_approve.json()["detail"].lower()

    # 9. Reviewer requests changes instead
    r_req_changes = client.post(f"/reviews/{draft_id}/decision", json={
        "decision": "changes_requested",
        "comment": "Please reduce battery life claim to 12 hours and remove 'guaranteed'."
    }, headers=reviewer_headers)
    assert r_req_changes.status_code == 200
    assert r_req_changes.json()["decision"] == "changes_requested"

    # Verify draft status is now changes_requested
    r_check = client.get(f"/drafts/{draft_id}", headers=creator_headers)
    assert r_check.json()["status"] == "changes_requested"
    assert r_check.json()["ready_to_publish"] is False

    # 10. Creator submits Revision 2 with compliant text
    r_rev2 = client.post(f"/drafts/{draft_id}/revisions", json={
        "content_text": "Our Example Wireless Headphones deliver up to 12 hours of rich battery life."
    }, headers=creator_headers)
    assert r_rev2.status_code == 201
    assert r_rev2.json()["revision_number"] == 2

    # 11. Run verification on Revision 2
    r_verify2 = client.post(f"/drafts/{draft_id}/review", headers=reviewer_headers)
    assert r_verify2.status_code == 200
    v2_data = r_verify2.json()
    assert v2_data["findings_by_severity"]["critical"] == 0

    # 12. Reviewer approves Revision 2
    r_approve = client.post(f"/reviews/{draft_id}/decision", json={
        "decision": "approved",
        "comment": "Revision 2 matches all approved specifications. Ready for release."
    }, headers=reviewer_headers)
    assert r_approve.status_code == 200
    assert r_approve.json()["decision"] == "approved"

    # 13. Verify Draft is marked Ready to Publish!
    r_final = client.get(f"/drafts/{draft_id}", headers=creator_headers)
    assert r_final.json()["status"] == "approved"
    assert r_final.json()["ready_to_publish"] is True

    # 14. Workspace Isolation Test: User from another workspace cannot access this draft
    r_other_user = client.post("/auth/register", json={
        "email": "intruder@otherorg.com",
        "password": "OtherPassword123!",
        "full_name": "Intruder User",
        "role": "admin",
        "workspace_name": "Other Org"
    })
    other_headers = {"Authorization": f"Bearer {r_other_user.json()['access_token']}"}
    r_isolated = client.get(f"/drafts/{draft_id}", headers=other_headers)
    assert r_isolated.status_code == 404
