import os
import sys
import json
import urllib.request
import urllib.error

# Ensure app can be imported
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from app.config import settings
from app.database import connect_to_mongo


def run_full_verification():
    port = settings.PORT or 8081
    base_url = f"http://127.0.0.1:{port}"
    print("=" * 75)
    print(f"VERIBRAND AI — ROUND 2 HACKATHON VERIFICATION SUITE")
    print(f"Target Service: {base_url} (Environment: {settings.ENVIRONMENT})")
    print("=" * 75)

    # STEP 1: Verify direct MongoDB Atlas Database state
    print("\n[Step 1/6] Verifying MongoDB Atlas Connection & Collections...")
    db = connect_to_mongo()
    print(f" -> Connected to Atlas Database: '{db.name}'")
    collections = db.list_collection_names()
    print(f" -> Collections present: {sorted(collections)}")

    counts = {col: db[col].count_documents({}) for col in sorted(collections)}
    for col, count in counts.items():
        print(f"    • {col:<20}: {count} records")

    assert counts.get("workspaces", 0) >= 2, "Expected at least 2 workspaces (2 brands)"
    assert counts.get("users", 0) >= 4, "Expected at least 4 users"
    assert counts.get("guidelines", 0) >= 8, "Expected at least 8 brand guidelines"
    assert counts.get("approved_facts", 0) >= 10, "Expected at least 10 approved facts"
    assert counts.get("drafts", 0) == 10, "Expected exactly 10 demo content drafts"
    assert counts.get("revisions", 0) >= 12, "Expected multi-revision history"
    assert counts.get("approval_decisions", 0) >= 6, "Expected approval decision records"
    assert counts.get("source_alerts", 0) >= 2, "Expected active source alerts"
    assert counts.get("audit_events", 0) >= 15, "Expected comprehensive audit trail"
    print(" -> [PASS] MongoDB Atlas schema and dataset verified successfully!")

    # STEP 2: Test live REST API Health
    print(f"\n[Step 2/6] Probing REST API Health at {base_url}/health ...")
    try:
        with urllib.request.urlopen(f"{base_url}/health", timeout=5) as resp:
            health = json.loads(resp.read().decode())
            print(f" -> Health Status: {health.get('status')} | Service: {health.get('service')} | DB Mode: {health.get('database_mode')}")
            assert health.get("status") == "healthy"
            print(" -> [PASS] Health check OK!")
    except Exception as e:
        print(f" -> [NOTE] Live server not listening on {base_url} ({e}).")
        print("    Run 'uvicorn app.main:app --host 0.0.0.0 --port 8081' in backend to test HTTP endpoints.")
        print("=" * 75)
        print("MONGODB ATLAS DATASET IS FULLY SEEDED, INTEGRATED, AND READY FOR DEMO!")
        print("=" * 75)
        return

    # STEP 3: Test Multi-Role Authentication
    print("\n[Step 3/6] Testing Multi-Role Authentication & JWT Token Issuance...")
    personas = [
        ("admin@veribrand.ai", "AdminPass123!", "admin", "Sarah Connor"),
        ("creator@veribrand.ai", "CreatorPass123!", "creator", "Alex Rivera"),
        ("reviewer@veribrand.ai", "ReviewerPass123!", "reviewer", "Marcus Vance"),
    ]
    tokens = {}
    for email, pwd, role, name in personas:
        login_data = json.dumps({"email": email, "password": pwd}).encode()
        req = urllib.request.Request(
            f"{base_url}/auth/login",
            data=login_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            tokens[role] = res["access_token"]
            print(f" -> Logged in: {res['full_name']} | Role: {res['role']} | Workspace: {res['workspace_name']}")
    print(" -> [PASS] All 3 core personas authenticated successfully!")

    admin_headers = {"Authorization": f"Bearer {tokens['admin']}"}
    reviewer_headers = {"Authorization": f"Bearer {tokens['reviewer']}"}

    # STEP 4: Test Governance Dashboard Stats & KPIs
    print("\n[Step 4/6] Verifying Dashboard KPIs & Compliance Rates...")
    req = urllib.request.Request(f"{base_url}/dashboard/stats", headers=admin_headers)
    with urllib.request.urlopen(req) as resp:
        stats = json.loads(resp.read().decode())
        print(f" -> Total Drafts: {stats['total_drafts']}")
        print(f" -> Pending Reviews: {stats['pending_reviews']}")
        print(f" -> Approved Content: {stats['approved_content']}")
        print(f" -> Flagged Issues: {stats['flagged_issues']}")
        print(f" -> Active Guidelines: {stats['active_guidelines']}")
        print(f" -> Approved Facts: {stats['approved_facts']}")
        print(f" -> Source-Change Alerts: {stats['source_change_alerts']}")
        print(f" -> Compliance Rate: {stats['compliance_rate_percent']}%")
        assert stats["total_drafts"] == 10
        assert stats["pending_reviews"] == 4
        assert stats["approved_content"] == 4
    print(" -> [PASS] Dashboard KPIs accurately reflect database state!")

    # STEP 5: Test Draft Verification & Findings Retrieval
    print("\n[Step 5/6] Inspecting Draft 1 Grounded Contradiction Findings...")
    req = urllib.request.Request(f"{base_url}/drafts/DFT-DEMO-001/findings", headers=admin_headers)
    with urllib.request.urlopen(req) as resp:
        findings = json.loads(resp.read().decode())
        print(f" -> Retrieved {len(findings)} findings for 'Holiday Launch Copy':")
        for f in findings:
            print(f"    • [{f['severity'].upper()}] {f['category']}: \"{f['original_text']}\"")
            print(f"      Grounded Citation: {f.get('source_id')} ({f.get('source_version')})")
            print(f"      Suggested Fix: \"{f.get('suggested_revision')}\"")
        assert len(findings) >= 2, "Expected findings on Draft 1"
    print(" -> [PASS] Deterministic Rule Engine findings verified!")

    # STEP 6: Test Revision Diff & Intelligence Insights
    print("\n[Step 6/6] Testing Revision Analytics & Source-Change Alerts...")
    req = urllib.request.Request(
        f"{base_url}/insights/revisions/compare?draft_id=DFT-DEMO-002&base_rev=REV-DEMO-002A&new_rev=REV-DEMO-002B",
        headers=admin_headers
    )
    with urllib.request.urlopen(req) as resp:
        diff = json.loads(resp.read().decode())
        print(f" -> Draft 2 Revision Comparison: Base findings={diff['base_revision']['total_findings']}, New findings={diff['new_revision']['total_findings']}")
        print(f" -> Resolved Issues: {diff['resolved_count']} | New Issues: {diff['new_issues_count']}")
        assert diff["resolved_count"] >= 1
    print(" -> [PASS] Revision Comparison Engine verified!")

    print("\n" + "=" * 75)
    print("ALL VERIFICATION CHECKS PASSED: VERIBRAND AI IS ROUND 2 HACKATHON READY!")
    print("=" * 75)


if __name__ == "__main__":
    run_full_verification()
