import sys
import os

# Add parent directory to sys.path so app can be imported
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from datetime import datetime, timezone
import uuid
from app.database import get_db, connect_to_mongo
from app.services.auth_service import hash_password
from app.services.rule_engine import DeterministicRuleEngine


def seed_database():
    db = get_db()
    print("Seeding VeriBrand AI database...")

    # 1. Clear existing demo data
    demo_ws_id = "WS-DEMO-001"
    db.workspaces.delete_many({"workspace_id": demo_ws_id})
    db.users.delete_many({"workspace_id": demo_ws_id})
    db.guidelines.delete_many({"workspace_id": demo_ws_id})
    db.approved_facts.delete_many({"workspace_id": demo_ws_id})
    db.drafts.delete_many({"workspace_id": demo_ws_id})
    db.revisions.delete_many({"workspace_id": demo_ws_id})
    db.findings.delete_many({"workspace_id": demo_ws_id})
    db.approval_decisions.delete_many({"workspace_id": demo_ws_id})
    db.audit_events.delete_many({"workspace_id": demo_ws_id})
    db.source_alerts.delete_many({"workspace_id": demo_ws_id})

    now = datetime.now(timezone.utc)

    # 2. Workspace
    db.workspaces.insert_one({
        "workspace_id": demo_ws_id,
        "name": "Acme Brand Governance Workspace",
        "brand_name": "Acme Audio & Tech",
        "created_at": now
    })

    # 3. Users with three distinct roles
    users = [
        {
            "user_id": "USR-ADMIN-01",
            "email": "admin@veribrand.ai",
            "full_name": "Sarah Connor (Brand Administrator)",
            "hashed_password": hash_password("AdminPass123!"),
            "role": "admin",
            "workspace_id": demo_ws_id,
            "is_active": True,
            "created_at": now
        },
        {
            "user_id": "USR-CREATOR-01",
            "email": "creator@veribrand.ai",
            "full_name": "Alex Rivera (Content Creator)",
            "hashed_password": hash_password("CreatorPass123!"),
            "role": "creator",
            "workspace_id": demo_ws_id,
            "is_active": True,
            "created_at": now
        },
        {
            "user_id": "USR-REVIEWER-01",
            "email": "reviewer@veribrand.ai",
            "full_name": "Marcus Vance (Compliance Reviewer)",
            "hashed_password": hash_password("ReviewerPass123!"),
            "role": "reviewer",
            "workspace_id": demo_ws_id,
            "is_active": True,
            "created_at": now
        }
    ]
    db.users.insert_many(users)
    print(f"Created {len(users)} demo users (admin, creator, reviewer).")

    # 4. Brand Guidelines (Rules)
    guidelines = [
        {
            "guideline_id": "GL-001",
            "rule_id": "RULE-TERM-001",
            "workspace_id": demo_ws_id,
            "category": "prohibited_term",
            "term_or_pattern": "AI proof",
            "replacement": "evidence-first brand governance",
            "reason": "Claims of AI infallibility violate truth in advertising and create regulatory exposure.",
            "severity": "high",
            "version_id": "v1.0",
            "is_active": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "guideline_id": "GL-002",
            "rule_id": "RULE-TERM-002",
            "workspace_id": demo_ws_id,
            "category": "prohibited_term",
            "term_or_pattern": "revolutionary miracle",
            "replacement": "state-of-the-art innovation",
            "reason": "Exaggerated puffery degrades brand authority and violates FTC substantiation policies.",
            "severity": "high",
            "version_id": "v1.0",
            "is_active": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "guideline_id": "GL-003",
            "rule_id": "RULE-TERM-003",
            "workspace_id": demo_ws_id,
            "category": "prohibited_term",
            "term_or_pattern": "100% foolproof",
            "replacement": "rigorous systematic verification",
            "reason": "Absolute infallibility guarantees violate FTC guidelines.",
            "severity": "critical",
            "version_id": "v1.0",
            "is_active": True,
            "created_at": now,
            "updated_at": now
        },
        {
            "guideline_id": "GL-004",
            "rule_id": "RULE-PREF-001",
            "workspace_id": demo_ws_id,
            "category": "preferred_term",
            "term_or_pattern": "noise blocking",
            "replacement": "Active Noise Cancellation (ANC)",
            "reason": "Ensure uniform product terminology aligned with trademark specifications.",
            "severity": "medium",
            "version_id": "v1.0",
            "is_active": True,
            "created_at": now,
            "updated_at": now
        }
    ]
    db.guidelines.insert_many(guidelines)
    print(f"Created {len(guidelines)} brand guideline rules.")

    # 5. Approved Product Facts (Including Section 7 required specification!)
    approved_facts = [
        {
            "fact_id": "FACT-001",
            "source_id": "SRC-FACT-001",
            "workspace_id": demo_ws_id,
            "product_name": "Example Wireless Headphones",
            "attribute": "battery_life",
            "statement": "Battery life: up to 12 hours under standard testing conditions.",
            "numerical_value": 12.0,
            "numerical_unit": "hours",
            "numerical_comparator": "up_to",
            "version_id": "v1.0",
            "effective_date": "2026-01-01",
            "created_at": now,
            "updated_at": now
        },
        {
            "fact_id": "FACT-002",
            "source_id": "SRC-FACT-002",
            "workspace_id": demo_ws_id,
            "product_name": "Example Wireless Headphones",
            "attribute": "water_resistance",
            "statement": "Water resistance rating: IPX4 splash resistant. Not submersible.",
            "numerical_value": 4.0,
            "numerical_unit": "ipx",
            "numerical_comparator": "exact",
            "version_id": "v1.0",
            "effective_date": "2026-01-01",
            "created_at": now,
            "updated_at": now
        },
        {
            "fact_id": "FACT-003",
            "source_id": "SRC-FACT-003",
            "workspace_id": demo_ws_id,
            "product_name": "Example Wireless Headphones",
            "attribute": "warranty",
            "statement": "Limited manufacturer warranty: 1 year standard hardware coverage.",
            "numerical_value": 1.0,
            "numerical_unit": "years",
            "numerical_comparator": "exact",
            "version_id": "v1.0",
            "effective_date": "2026-01-01",
            "created_at": now,
            "updated_at": now
        }
    ]
    db.approved_facts.insert_many(approved_facts)
    print(f"Created {len(approved_facts)} approved facts (including Section 7 Headphones specification).")

    # 6. Draft 1: The Master Section 7 Demonstration Draft
    draft1_id = "DFT-DEMO-001"
    rev1_id = "REV-DEMO-001"
    draft1_text = "Our headphones deliver guaranteed 24-hour battery life."

    db.revisions.insert_one({
        "revision_id": rev1_id,
        "draft_id": draft1_id,
        "workspace_id": demo_ws_id,
        "revision_number": 1,
        "creator_id": "USR-CREATOR-01",
        "content_text": draft1_text,
        "content_hash": "hash_draft1",
        "submission_type": "text",
        "created_at": now
    })

    db.drafts.insert_one({
        "draft_id": draft1_id,
        "workspace_id": demo_ws_id,
        "creator_id": "USR-CREATOR-01",
        "creator_name": "Alex Rivera",
        "title": "Holiday Launch Copy — Headphones Battery Promo",
        "target_product": "Example Wireless Headphones",
        "target_audience": "Tech Consumers",
        "current_revision_id": rev1_id,
        "status": "under_review",
        "ready_to_publish": False,
        "created_at": now,
        "updated_at": now
    })

    # Run verification engine for Draft 1 to persist genuine findings
    findings1 = DeterministicRuleEngine.run_checks(
        draft_text=draft1_text,
        guidelines=guidelines,
        approved_facts=approved_facts,
        draft_id=draft1_id,
        revision_id=rev1_id,
        workspace_id=demo_ws_id
    )
    if findings1:
        db.findings.insert_many(findings1)
    print(f"Draft 1 created and verified. Generated {len(findings1)} findings (Factual Contradiction & Unsupported Guarantee).")

    # 7. Draft 2: Revision and Approved workflow demonstration
    draft2_id = "DFT-DEMO-002"
    rev2_1_id = "REV-DEMO-002A"
    rev2_2_id = "REV-DEMO-002B"
    draft2_text_v1 = "Our headphones have noise blocking and 24-hour playtime."
    draft2_text_v2 = "Our Example Wireless Headphones feature Active Noise Cancellation (ANC) with up to 12 hours of battery life."

    db.revisions.insert_many([
        {
            "revision_id": rev2_1_id,
            "draft_id": draft2_id,
            "workspace_id": demo_ws_id,
            "revision_number": 1,
            "creator_id": "USR-CREATOR-01",
            "content_text": draft2_text_v1,
            "content_hash": "hash_rev2_1",
            "submission_type": "text",
            "created_at": now
        },
        {
            "revision_id": rev2_2_id,
            "draft_id": draft2_id,
            "workspace_id": demo_ws_id,
            "revision_number": 2,
            "creator_id": "USR-CREATOR-01",
            "content_text": draft2_text_v2,
            "content_hash": "hash_rev2_2",
            "submission_type": "text",
            "created_at": now
        }
    ])

    db.drafts.insert_one({
        "draft_id": draft2_id,
        "workspace_id": demo_ws_id,
        "creator_id": "USR-CREATOR-01",
        "creator_name": "Alex Rivera",
        "title": "Spring Campaign Social Ad",
        "target_product": "Example Wireless Headphones",
        "target_audience": "Music Enthusiasts",
        "current_revision_id": rev2_2_id,
        "status": "approved",
        "ready_to_publish": True,
        "created_at": now,
        "updated_at": now
    })

    # Approval decision for Draft 2 Revision 2
    db.approval_decisions.insert_one({
        "decision_id": "DEC-DEMO-001",
        "draft_id": draft2_id,
        "revision_id": rev2_2_id,
        "workspace_id": demo_ws_id,
        "reviewer_id": "USR-REVIEWER-01",
        "reviewer_name": "Marcus Vance",
        "decision": "approved",
        "comment": "Revision #2 successfully resolved the battery duration conflict and adopted preferred ANC terminology. Approved for publishing.",
        "override_reason": None,
        "source_snapshot": [
            {"source_id": "SRC-FACT-001", "version_id": "v1.0", "type": "fact"},
            {"source_id": "RULE-PREF-001", "version_id": "v1.0", "type": "rule"}
        ],
        "created_at": now
    })
    print("Draft 2 created with 2 revisions and approved decision record.")

    # 8. Draft 3: Insufficient evidence demonstration
    draft3_id = "DFT-DEMO-003"
    rev3_id = "REV-DEMO-003"
    draft3_text = "Ranked world's best audio device with guaranteed underwater depth of 100 meters."

    db.revisions.insert_one({
        "revision_id": rev3_id,
        "draft_id": draft3_id,
        "workspace_id": demo_ws_id,
        "revision_number": 1,
        "creator_id": "USR-CREATOR-01",
        "content_text": draft3_text,
        "content_hash": "hash_draft3",
        "submission_type": "text",
        "created_at": now
    })

    db.drafts.insert_one({
        "draft_id": draft3_id,
        "workspace_id": demo_ws_id,
        "creator_id": "USR-CREATOR-01",
        "creator_name": "Alex Rivera",
        "title": "Aggressive Competitive Billboard",
        "target_product": "Example Wireless Headphones",
        "target_audience": "Outdoor Athletes",
        "current_revision_id": rev3_id,
        "status": "under_review",
        "ready_to_publish": False,
        "created_at": now,
        "updated_at": now
    })

    findings3 = DeterministicRuleEngine.run_checks(
        draft_text=draft3_text,
        guidelines=guidelines,
        approved_facts=approved_facts,
        draft_id=draft3_id,
        revision_id=rev3_id,
        workspace_id=demo_ws_id
    )
    if findings3:
        db.findings.insert_many(findings3)
    print(f"Draft 3 created with {len(findings3)} findings demonstrating insufficient evidence and unbacked guarantees.")

    # 9. Initial Audit Log Events
    events = [
        {
            "event_id": "EVT-INIT-001",
            "workspace_id": demo_ws_id,
            "actor_id": "USR-ADMIN-01",
            "actor_name": "Sarah Connor",
            "action": "workspace_configured",
            "target_type": "workspace",
            "target_id": demo_ws_id,
            "details": "Initialized brand governance rules and approved product specifications for Example Wireless Headphones.",
            "created_at": now
        },
        {
            "event_id": "EVT-INIT-002",
            "workspace_id": demo_ws_id,
            "actor_id": "USR-CREATOR-01",
            "actor_name": "Alex Rivera",
            "action": "draft_submitted",
            "target_type": "draft",
            "target_id": draft1_id,
            "details": "Submitted promotional draft 'Holiday Launch Copy'.",
            "created_at": now
        },
        {
            "event_id": "EVT-INIT-003",
            "workspace_id": demo_ws_id,
            "actor_id": "USR-REVIEWER-01",
            "actor_name": "Marcus Vance",
            "action": "draft_approved",
            "target_type": "draft",
            "target_id": draft2_id,
            "details": "Approved Revision #2 of 'Spring Campaign Social Ad' for publication.",
            "created_at": now
        }
    ]
    db.audit_events.insert_many(events)
    print(f"Recorded {len(events)} initial audit events.")
    print("Database seeding completed successfully!")


if __name__ == "__main__":
    seed_database()
