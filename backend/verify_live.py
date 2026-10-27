import urllib.request
import json

def test_live_server():
    print("Connecting to live backend at http://127.0.0.1:8000 ...")

    # 1. Health
    with urllib.request.urlopen('http://127.0.0.1:8000/health') as resp:
        health = json.loads(resp.read().decode())
        print(f"[OK] Health: {health}")

    # 2. Login as Sarah Connor (Admin)
    login_data = json.dumps({'email': 'admin@veribrand.ai', 'password': 'AdminPass123!'}).encode()
    req = urllib.request.Request('http://127.0.0.1:8000/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        auth_res = json.loads(resp.read().decode())
        token = auth_res['access_token']
        print(f"[OK] Authenticated: {auth_res['full_name']} (Role: {auth_res['role']})")

    # 3. Dashboard stats
    headers = {'Authorization': f'Bearer {token}'}
    req = urllib.request.Request('http://127.0.0.1:8000/dashboard/stats', headers=headers)
    with urllib.request.urlopen(req) as resp:
        stats = json.loads(resp.read().decode())
        print(f"[OK] Live Stats: Drafts={stats['total_drafts']}, Pending={stats['pending_reviews']}, Approved={stats['approved_content']}, Flagged={stats['flagged_issues']}")

    # 4. Section 7 Master Demo Draft Findings
    req = urllib.request.Request('http://127.0.0.1:8000/drafts/DFT-DEMO-001/findings', headers=headers)
    with urllib.request.urlopen(req) as resp:
        findings = json.loads(resp.read().decode())
        print(f"\n[OK] Section 7 Draft Findings ({len(findings)} issues detected):")
        for f in findings:
            print(f"   * [{f['severity'].upper()}] {f['category']}: \"{f['original_text']}\"")
            print(f"     Status: {f.get('evidence_status')} | Grounded Citation: {f.get('source_id')} ({f.get('source_version')})")
            print(f"     Explanation: {f['explanation']}")
            print(f"     Suggested Revision: \"{f.get('suggested_revision')}\"")

    # 5. Check Approved Draft (DFT-DEMO-002)
    req = urllib.request.Request('http://127.0.0.1:8000/drafts/DFT-DEMO-002', headers=headers)
    with urllib.request.urlopen(req) as resp:
        draft2 = json.loads(resp.read().decode())
        print(f"\n[OK] Draft 2 Status: '{draft2['status']}' | Ready to Publish: {draft2['ready_to_publish']}")

if __name__ == '__main__':
    test_live_server()
