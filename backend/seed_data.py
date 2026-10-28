import sys
import os
from datetime import datetime, timezone, timedelta
import uuid

# Add current and parent directory to sys.path so app can be imported
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import get_db, connect_to_mongo
from app.services.auth_service import hash_password
from app.services.rule_engine import DeterministicRuleEngine


def seed_database(target_db=None):
    """
    Enterprise-Grade Synthetic Demonstration Data Seeder for VeriBrand AI.
    Prepares a complete Round 2 Hackathon demonstration dataset:
    - 1 Organization (Apex Global Technologies)
    - 2 Brands / Workspaces (Apex Sound, Apex Mobility)
    - 4 Users (1 Admin, 2 Creators, 1 Compliance Reviewer)
    - 8 Brand Guidelines (prohibited terms, prohibited claims, preferred terms)
    - 10 Approved Product Specifications (audio & wearable hardware specs)
    - 10 Sample Content Drafts with realistic lifecycle states:
        * 4 Approved (Ready to Publish)
        * 3 Under Review (Pending Reviewer)
        * 2 Changes Requested
        * 1 Newly Submitted
    - Multi-revision history demonstrating side-by-side diffing and issue resolution
    - Reviewer decisions with source citation snapshots
    - Active source-change re-review alerts
    - Comprehensive immutable audit trail (15+ events)
    """
    db = target_db if target_db is not None else get_db()
    print("=" * 70)
    print("Initializing VeriBrand AI MongoDB Atlas Demo Dataset...")
    print("=" * 70)

    demo_ws_id = "WS-DEMO-001"
    secondary_ws_id = "WS-DEMO-002"
    all_ws_ids = [demo_ws_id, secondary_ws_id]

    # 1. Clear existing demo data cleanly
    print("[1/8] Clearing existing demo workspace records...")
    for ws_id in all_ws_ids:
        db.workspaces.delete_many({"workspace_id": ws_id})
        db.users.delete_many({"workspace_id": ws_id})
        db.guidelines.delete_many({"workspace_id": ws_id})
        db.approved_facts.delete_many({"workspace_id": ws_id})
        db.drafts.delete_many({"workspace_id": ws_id})
        db.revisions.delete_many({"workspace_id": ws_id})
        db.findings.delete_many({"workspace_id": ws_id})
        db.approval_decisions.delete_many({"workspace_id": ws_id})
        db.audit_events.delete_many({"workspace_id": ws_id})
        db.source_alerts.delete_many({"workspace_id": ws_id})

    now = datetime.now(timezone.utc)
    t_minus_48h = now - timedelta(hours=48)
    t_minus_24h = now - timedelta(hours=24)
    t_minus_12h = now - timedelta(hours=12)
    t_minus_2h = now - timedelta(hours=2)

    # 2. Demo Organization & Workspaces (2 Brands under 1 Organization)
    print("[2/8] Creating Organization & Brand Workspaces...")
    org_id = "ORG-APEX-GLOBAL"
    org_name = "Apex Global Technologies"

    workspaces = [
        {
            "workspace_id": demo_ws_id,
            "name": "Apex Sound — Brand Governance Workspace",
            "brand_name": "Apex Sound",
            "brand_id": "BRD-APEX-01",
            "organization_id": org_id,
            "organization_name": org_name,
            "description": "Primary brand governance workspace for acoustics, wireless audio, and home studio hardware.",
            "created_at": t_minus_48h
        },
        {
            "workspace_id": secondary_ws_id,
            "name": "Apex Mobility — Smart Wearables Workspace",
            "brand_name": "Apex Mobility",
            "brand_id": "BRD-APEX-02",
            "organization_id": org_id,
            "organization_name": org_name,
            "description": "Wearable computing, smartwatches, and biometric fitness tracker governance.",
            "created_at": t_minus_48h
        }
    ]
    db.workspaces.insert_many(workspaces)
    print(f" -> Created {len(workspaces)} workspaces under organization '{org_name}'.")

    # 3. Users (1 Admin, 2 Creators, 1 Reviewer)
    print("[3/8] Seeding authenticated personas with distinct role permissions...")
    users = [
        {
            "user_id": "USR-ADMIN-01",
            "email": "admin@veribrand.ai",
            "full_name": "Sarah Connor",
            "hashed_password": hash_password("AdminPass123!"),
            "role": "admin",
            "workspace_id": demo_ws_id,
            "organization_id": org_id,
            "is_active": True,
            "created_at": t_minus_48h
        },
        {
            "user_id": "USR-CREATOR-01",
            "email": "creator@veribrand.ai",
            "full_name": "Alex Rivera",
            "hashed_password": hash_password("CreatorPass123!"),
            "role": "creator",
            "workspace_id": demo_ws_id,
            "organization_id": org_id,
            "is_active": True,
            "created_at": t_minus_48h
        },
        {
            "user_id": "USR-CREATOR-02",
            "email": "elena.creator@veribrand.ai",
            "full_name": "Elena Chen",
            "hashed_password": hash_password("CreatorPass123!"),
            "role": "creator",
            "workspace_id": demo_ws_id,
            "organization_id": org_id,
            "is_active": True,
            "created_at": t_minus_48h
        },
        {
            "user_id": "USR-REVIEWER-01",
            "email": "reviewer@veribrand.ai",
            "full_name": "Marcus Vance",
            "hashed_password": hash_password("ReviewerPass123!"),
            "role": "reviewer",
            "workspace_id": demo_ws_id,
            "organization_id": org_id,
            "is_active": True,
            "created_at": t_minus_48h
        }
    ]
    db.users.insert_many(users)
    print(f" -> Created {len(users)} users (1 Admin, 2 Creators, 1 Reviewer).")

    # 4. Brand Guidelines (8 Rules spanning prohibited terms, claims, preferred terminology)
    print("[4/8] Seeding brand guidelines and governance rules...")
    guidelines = [
        {
            "guideline_id": "GL-001",
            "rule_id": "RULE-TERM-001",
            "workspace_id": demo_ws_id,
            "category": "prohibited_term",
            "term_or_pattern": "AI proof",
            "replacement": "evidence-first brand governance",
            "reason": "Claims of AI infallibility violate truth-in-advertising regulations and create legal exposure.",
            "severity": "high",
            "version_id": "v1.0",
            "is_active": True,
            "created_at": t_minus_48h,
            "updated_at": t_minus_48h
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
            "created_at": t_minus_48h,
            "updated_at": t_minus_48h
        },
        {
            "guideline_id": "GL-003",
            "rule_id": "RULE-TERM-003",
            "workspace_id": demo_ws_id,
            "category": "prohibited_claim",
            "term_or_pattern": "100% foolproof",
            "replacement": "rigorous systematic verification",
            "reason": "Absolute infallibility guarantees violate regulatory consumer protection standards.",
            "severity": "critical",
            "version_id": "v1.0",
            "is_active": True,
            "created_at": t_minus_48h,
            "updated_at": t_minus_48h
        },
        {
            "guideline_id": "GL-004",
            "rule_id": "RULE-PREF-001",
            "workspace_id": demo_ws_id,
            "category": "preferred_term",
            "term_or_pattern": "noise blocking",
            "replacement": "Active Noise Cancellation (ANC)",
            "reason": "Ensure uniform product terminology aligned with registered trademark specifications.",
            "severity": "medium",
            "version_id": "v1.0",
            "is_active": True,
            "created_at": t_minus_48h,
            "updated_at": t_minus_48h
        },
        {
            "guideline_id": "GL-005",
            "rule_id": "RULE-PREF-002",
            "workspace_id": demo_ws_id,
            "category": "preferred_term",
            "term_or_pattern": "waterproof",
            "replacement": "IPX7 water-resistant",
            "reason": "Consumer electronics must be accurately described as water-resistant per IEC standard 60529, never waterproof.",
            "severity": "high",
            "version_id": "v1.0",
            "is_active": True,
            "created_at": t_minus_48h,
            "updated_at": t_minus_48h
        },
        {
            "guideline_id": "GL-006",
            "rule_id": "RULE-TERM-004",
            "workspace_id": demo_ws_id,
            "category": "prohibited_term",
            "term_or_pattern": "cheapest rate",
            "replacement": "most competitive pricing",
            "reason": "Brand positioning prohibits bargain-bin framing; maintain premium value perception.",
            "severity": "medium",
            "version_id": "v1.0",
            "is_active": True,
            "created_at": t_minus_48h,
            "updated_at": t_minus_48h
        },
        {
            "guideline_id": "GL-007",
            "rule_id": "RULE-CLAIM-001",
            "workspace_id": demo_ws_id,
            "category": "prohibited_claim",
            "term_or_pattern": "cure anxiety",
            "replacement": "support mindfulness and focus",
            "reason": "Medical claims for consumer acoustic or wearable devices violate FDA/FTC health claim guidelines.",
            "severity": "critical",
            "version_id": "v1.0",
            "is_active": True,
            "created_at": t_minus_48h,
            "updated_at": t_minus_48h
        },
        {
            "guideline_id": "GL-008",
            "rule_id": "RULE-PREF-003",
            "workspace_id": demo_ws_id,
            "category": "preferred_term",
            "term_or_pattern": "fast charging",
            "replacement": "RapidCharge 30W Technology",
            "reason": "Use official trademarked charging technology naming for Apex audio and mobility products.",
            "severity": "low",
            "version_id": "v1.0",
            "is_active": True,
            "created_at": t_minus_48h,
            "updated_at": t_minus_48h
        }
    ]
    db.guidelines.insert_many(guidelines)
    print(f" -> Created {len(guidelines)} brand guideline rules.")

    # 5. Approved Product Facts (10 facts across 2 brands)
    print("[5/8] Seeding approved ground-truth product specifications...")
    approved_facts = [
        # Brand A: Apex Sound — AeroPulse Wireless Headphones
        {
            "fact_id": "FACT-001",
            "source_id": "SRC-FACT-001",
            "workspace_id": demo_ws_id,
            "product_name": "AeroPulse Wireless Headphones",
            "attribute": "battery_life",
            "statement": "Battery life: up to 12 hours under standard testing conditions.",
            "numerical_value": 12.0,
            "numerical_unit": "hours",
            "numerical_comparator": "up_to",
            "version_id": "v1.0",
            "effective_date": "2026-01-01",
            "created_at": t_minus_48h,
            "updated_at": t_minus_48h
        },
        {
            "fact_id": "FACT-002",
            "source_id": "SRC-FACT-002",
            "workspace_id": demo_ws_id,
            "product_name": "AeroPulse Wireless Headphones",
            "attribute": "water_resistance",
            "statement": "Water resistance rating: IPX4 splash resistant. Not submersible.",
            "numerical_value": 4.0,
            "numerical_unit": "ipx",
            "numerical_comparator": "exact",
            "version_id": "v1.0",
            "effective_date": "2026-01-01",
            "created_at": t_minus_48h,
            "updated_at": t_minus_48h
        },
        {
            "fact_id": "FACT-003",
            "source_id": "SRC-FACT-003",
            "workspace_id": demo_ws_id,
            "product_name": "AeroPulse Wireless Headphones",
            "attribute": "warranty",
            "statement": "Limited manufacturer warranty: 1 year standard hardware coverage.",
            "numerical_value": 1.0,
            "numerical_unit": "years",
            "numerical_comparator": "exact",
            "version_id": "v1.0",
            "effective_date": "2026-01-01",
            "created_at": t_minus_48h,
            "updated_at": t_minus_48h
        },
        {
            "fact_id": "FACT-004",
            "source_id": "SRC-FACT-004",
            "workspace_id": demo_ws_id,
            "product_name": "AeroPulse Wireless Headphones",
            "attribute": "range",
            "statement": "Wireless operating range: up to 10 meters line-of-sight using Bluetooth 5.3.",
            "numerical_value": 10.0,
            "numerical_unit": "meters",
            "numerical_comparator": "up_to",
            "version_id": "v1.0",
            "effective_date": "2026-01-01",
            "created_at": t_minus_48h,
            "updated_at": t_minus_48h
        },
        {
            "fact_id": "FACT-005",
            "source_id": "SRC-FACT-005",
            "workspace_id": demo_ws_id,
            "product_name": "AeroPulse Wireless Headphones",
            "attribute": "weight",
            "statement": "Device weight: 245 grams lightweight ergonomic chassis.",
            "numerical_value": 245.0,
            "numerical_unit": "grams",
            "numerical_comparator": "exact",
            "version_id": "v1.0",
            "effective_date": "2026-01-01",
            "created_at": t_minus_48h,
            "updated_at": t_minus_48h
        },
        # Brand B: Apex Mobility — PulseBand Pro Smartwatch
        {
            "fact_id": "FACT-006",
            "source_id": "SRC-FACT-006",
            "workspace_id": demo_ws_id,
            "product_name": "PulseBand Pro Smartwatch",
            "attribute": "battery_life",
            "statement": "Battery life: up to 7 days on standard power mode.",
            "numerical_value": 7.0,
            "numerical_unit": "days",
            "numerical_comparator": "up_to",
            "version_id": "v1.0",
            "effective_date": "2026-01-01",
            "created_at": t_minus_48h,
            "updated_at": t_minus_48h
        },
        {
            "fact_id": "FACT-007",
            "source_id": "SRC-FACT-007",
            "workspace_id": demo_ws_id,
            "product_name": "PulseBand Pro Smartwatch",
            "attribute": "water_resistance",
            "statement": "Water resistance rating: 50 meters (5 ATM) ISO 22810:2010 certified.",
            "numerical_value": 50.0,
            "numerical_unit": "meters",
            "numerical_comparator": "exact",
            "version_id": "v1.0",
            "effective_date": "2026-01-01",
            "created_at": t_minus_48h,
            "updated_at": t_minus_48h
        },
        {
            "fact_id": "FACT-008",
            "source_id": "SRC-FACT-008",
            "workspace_id": demo_ws_id,
            "product_name": "PulseBand Pro Smartwatch",
            "attribute": "display",
            "statement": "Display brightness: up to 1000 nits AMOLED outdoor sunlight readable screen.",
            "numerical_value": 1000.0,
            "numerical_unit": "nits",
            "numerical_comparator": "up_to",
            "version_id": "v1.0",
            "effective_date": "2026-01-01",
            "created_at": t_minus_48h,
            "updated_at": t_minus_48h
        },
        {
            "fact_id": "FACT-009",
            "source_id": "SRC-FACT-009",
            "workspace_id": demo_ws_id,
            "product_name": "PulseBand Pro Smartwatch",
            "attribute": "warranty",
            "statement": "Limited manufacturer warranty: 2 years worldwide hardware coverage.",
            "numerical_value": 2.0,
            "numerical_unit": "years",
            "numerical_comparator": "exact",
            "version_id": "v1.0",
            "effective_date": "2026-01-01",
            "created_at": t_minus_48h,
            "updated_at": t_minus_48h
        },
        {
            "fact_id": "FACT-010",
            "source_id": "SRC-FACT-010",
            "workspace_id": demo_ws_id,
            "product_name": "PulseBand Pro Smartwatch",
            "attribute": "charging_time",
            "statement": "Full recharge time: 45 minutes using RapidCharge magnetic dock.",
            "numerical_value": 45.0,
            "numerical_unit": "minutes",
            "numerical_comparator": "exact",
            "version_id": "v1.0",
            "effective_date": "2026-01-01",
            "created_at": t_minus_48h,
            "updated_at": t_minus_48h
        }
    ]
    db.approved_facts.insert_many(approved_facts)
    print(f" -> Created {len(approved_facts)} approved facts across 2 product lines.")

    # 6. Sample Content Drafts & Revisions (10 Drafts)
    print("[6/8] Seeding 10 content drafts with revisions, findings, and decisions...")

    drafts_data = [
        # Draft 1: Under Review with factual contradiction + guarantee
        {
            "draft_id": "DFT-DEMO-001",
            "title": "Holiday Launch Copy — Headphones Battery Promo",
            "product": "AeroPulse Wireless Headphones",
            "audience": "Tech Consumers",
            "creator_id": "USR-CREATOR-01",
            "creator_name": "Alex Rivera",
            "status": "under_review",
            "ready_to_publish": False,
            "created_at": t_minus_24h,
            "updated_at": t_minus_12h,
            "revisions": [
                {
                    "rev_id": "REV-DEMO-001",
                    "rev_num": 1,
                    "text": "Our headphones deliver guaranteed 24-hour battery life with noise blocking technology.",
                    "created_at": t_minus_24h
                }
            ]
        },
        # Draft 2: Multi-revision workflow leading to approval
        {
            "draft_id": "DFT-DEMO-002",
            "title": "Spring Campaign Social Ad",
            "product": "AeroPulse Wireless Headphones",
            "audience": "Music Enthusiasts",
            "creator_id": "USR-CREATOR-01",
            "creator_name": "Alex Rivera",
            "status": "approved",
            "ready_to_publish": True,
            "created_at": t_minus_24h,
            "updated_at": t_minus_2h,
            "revisions": [
                {
                    "rev_id": "REV-DEMO-002A",
                    "rev_num": 1,
                    "text": "Our headphones have noise blocking and 24-hour playtime.",
                    "created_at": t_minus_24h
                },
                {
                    "rev_id": "REV-DEMO-002B",
                    "rev_num": 2,
                    "text": "Our AeroPulse Wireless Headphones feature Active Noise Cancellation (ANC) with up to 12 hours of battery life.",
                    "created_at": t_minus_2h
                }
            ],
            "decision": {
                "decision_id": "DEC-DEMO-001",
                "revision_id": "REV-DEMO-002B",
                "decision": "approved",
                "comment": "Revision #2 successfully resolved the battery duration conflict and adopted preferred ANC terminology. Approved for publishing.",
                "override_reason": None,
                "sources": [
                    {"source_id": "SRC-FACT-001", "version_id": "v1.0", "type": "fact"},
                    {"source_id": "RULE-PREF-001", "version_id": "v1.0", "type": "rule"}
                ],
                "created_at": t_minus_2h
            }
        },
        # Draft 3: Changes Requested due to water depth contradiction & superlatives
        {
            "draft_id": "DFT-DEMO-003",
            "title": "Extreme Outdoor Billboard",
            "product": "AeroPulse Wireless Headphones",
            "audience": "Outdoor Athletes",
            "creator_id": "USR-CREATOR-02",
            "creator_name": "Elena Chen",
            "status": "changes_requested",
            "ready_to_publish": False,
            "created_at": t_minus_12h,
            "updated_at": t_minus_2h,
            "revisions": [
                {
                    "rev_id": "REV-DEMO-003",
                    "rev_num": 1,
                    "text": "Ranked world's best audio device with guaranteed underwater depth of 100 meters.",
                    "created_at": t_minus_12h
                }
            ],
            "decision": {
                "decision_id": "DEC-DEMO-002",
                "revision_id": "REV-DEMO-003",
                "decision": "changes_requested",
                "comment": "Under no circumstances can we claim 100m water submersion or world's best without third-party laboratory backing. IPX4 is splash resistant only.",
                "override_reason": None,
                "sources": [
                    {"source_id": "SRC-FACT-002", "version_id": "v1.0", "type": "fact"}
                ],
                "created_at": t_minus_2h
            }
        },
        # Draft 4: PulseBand Pro Launch under review
        {
            "draft_id": "DFT-DEMO-004",
            "title": "PulseBand Pro Fitness Launch Announcement",
            "product": "PulseBand Pro Smartwatch",
            "audience": "Fitness & Lifestyle",
            "creator_id": "USR-CREATOR-02",
            "creator_name": "Elena Chen",
            "status": "under_review",
            "ready_to_publish": False,
            "created_at": t_minus_12h,
            "updated_at": t_minus_2h,
            "revisions": [
                {
                    "rev_id": "REV-DEMO-004",
                    "rev_num": 1,
                    "text": "The new PulseBand Pro Smartwatch features waterproof casing and 14 days of battery life with fast charging.",
                    "created_at": t_minus_12h
                }
            ]
        },
        # Draft 5: Executive Newsletter — 100% Clean Approved Draft
        {
            "draft_id": "DFT-DEMO-005",
            "title": "Executive Product Update Newsletter",
            "product": "AeroPulse Wireless Headphones",
            "audience": "Corporate Partners",
            "creator_id": "USR-CREATOR-01",
            "creator_name": "Alex Rivera",
            "status": "approved",
            "ready_to_publish": True,
            "created_at": t_minus_24h,
            "updated_at": t_minus_12h,
            "revisions": [
                {
                    "rev_id": "REV-DEMO-005",
                    "rev_num": 1,
                    "text": "We are pleased to highlight the AeroPulse Wireless Headphones, offering Active Noise Cancellation (ANC) alongside up to 12 hours of battery life and a 1 year standard hardware warranty.",
                    "created_at": t_minus_24h
                }
            ],
            "decision": {
                "decision_id": "DEC-DEMO-003",
                "revision_id": "REV-DEMO-005",
                "decision": "approved",
                "comment": "Completely grounded copy adhering to all brand facts and registered trademark terminology.",
                "override_reason": None,
                "sources": [
                    {"source_id": "SRC-FACT-001", "version_id": "v1.0", "type": "fact"},
                    {"source_id": "SRC-FACT-003", "version_id": "v1.0", "type": "fact"}
                ],
                "created_at": t_minus_12h
            }
        },
        # Draft 6: Flash Sale Copy with prohibited terms (Submitted)
        {
            "draft_id": "DFT-DEMO-006",
            "title": "Black Friday Flash Sale Copy",
            "product": "AeroPulse Wireless Headphones",
            "audience": "Discount Shoppers",
            "creator_id": "USR-CREATOR-01",
            "creator_name": "Alex Rivera",
            "status": "submitted",
            "ready_to_publish": False,
            "created_at": t_minus_2h,
            "updated_at": t_minus_2h,
            "revisions": [
                {
                    "rev_id": "REV-DEMO-006",
                    "rev_num": 1,
                    "text": "Grab our revolutionary miracle headphones at the cheapest rate! Experience 100% foolproof sound with guaranteed 20-hour battery life.",
                    "created_at": t_minus_2h
                }
            ]
        },
        # Draft 7: Tech Influencer Brief (Changes requested with medical claim)
        {
            "draft_id": "DFT-DEMO-007",
            "title": "Tech Influencer Collaboration Brief",
            "product": "PulseBand Pro Smartwatch",
            "audience": "Wellness Influencers",
            "creator_id": "USR-CREATOR-02",
            "creator_name": "Elena Chen",
            "status": "changes_requested",
            "ready_to_publish": False,
            "created_at": t_minus_12h,
            "updated_at": t_minus_2h,
            "revisions": [
                {
                    "rev_id": "REV-DEMO-007",
                    "rev_num": 1,
                    "text": "Tell your audience that PulseBand Pro Smartwatch will cure anxiety and deliver an unbeatable workout experience with waterproof durability.",
                    "created_at": t_minus_12h
                }
            ],
            "decision": {
                "decision_id": "DEC-DEMO-004",
                "revision_id": "REV-DEMO-007",
                "decision": "changes_requested",
                "comment": "Medical claims like 'cure anxiety' violate FDA regulations and brand policy. Replace 'waterproof' with certified 50m water resistance rating.",
                "override_reason": None,
                "sources": [
                    {"source_id": "RULE-CLAIM-001", "version_id": "v1.0", "type": "rule"}
                ],
                "created_at": t_minus_2h
            }
        },
        # Draft 8: Global Website Overview (Multi-revision Approved)
        {
            "draft_id": "DFT-DEMO-008",
            "title": "Global Website Product Overview",
            "product": "PulseBand Pro Smartwatch",
            "audience": "Global Tech Buyers",
            "creator_id": "USR-CREATOR-02",
            "creator_name": "Elena Chen",
            "status": "approved",
            "ready_to_publish": True,
            "created_at": t_minus_24h,
            "updated_at": t_minus_2h,
            "revisions": [
                {
                    "rev_id": "REV-DEMO-008A",
                    "rev_num": 1,
                    "text": "The PulseBand Pro has 100% foolproof tracking with 15 days of battery life.",
                    "created_at": t_minus_24h
                },
                {
                    "rev_id": "REV-DEMO-008B",
                    "rev_num": 2,
                    "text": "The PulseBand Pro offers precision tracking with up to 7 days of battery life and RapidCharge 30W Technology.",
                    "created_at": t_minus_2h
                }
            ],
            "decision": {
                "decision_id": "DEC-DEMO-005",
                "revision_id": "REV-DEMO-008B",
                "decision": "approved",
                "comment": "Revision 2 successfully corrected battery duration to 7 days and removed absolute tracking claims.",
                "override_reason": None,
                "sources": [
                    {"source_id": "SRC-FACT-006", "version_id": "v1.0", "type": "fact"}
                ],
                "created_at": t_minus_2h
            }
        },
        # Draft 9: Podcast Sponsorship Script (Under review)
        {
            "draft_id": "DFT-DEMO-009",
            "title": "Podcast Sponsorship Script",
            "product": "AeroPulse Wireless Headphones",
            "audience": "Podcast Listeners",
            "creator_id": "USR-CREATOR-01",
            "creator_name": "Alex Rivera",
            "status": "under_review",
            "ready_to_publish": False,
            "created_at": t_minus_12h,
            "updated_at": t_minus_2h,
            "revisions": [
                {
                    "rev_id": "REV-DEMO-009",
                    "rev_num": 1,
                    "text": "Apex brings you AI proof audio governance. The AeroPulse headphones feature lightweight noise blocking technology and a 1 year hardware warranty.",
                    "created_at": t_minus_12h
                }
            ]
        },
        # Draft 10: Retail Packaging Back-Panel Specs (Approved Clean Draft)
        {
            "draft_id": "DFT-DEMO-010",
            "title": "Retail Packaging Back-Panel Specs",
            "product": "AeroPulse Wireless Headphones",
            "audience": "In-Store Retail Customers",
            "creator_id": "USR-CREATOR-01",
            "creator_name": "Alex Rivera",
            "status": "approved",
            "ready_to_publish": True,
            "created_at": t_minus_24h,
            "updated_at": t_minus_12h,
            "revisions": [
                {
                    "rev_id": "REV-DEMO-010",
                    "rev_num": 1,
                    "text": "Package includes AeroPulse Wireless Headphones with wireless range up to 10 meters, IPX4 splash resistance, and up to 12 hours of battery life.",
                    "created_at": t_minus_24h
                }
            ],
            "decision": {
                "decision_id": "DEC-DEMO-006",
                "revision_id": "REV-DEMO-010",
                "decision": "approved",
                "comment": "Fully compliant packaging copy aligned with engineering specification sheets.",
                "override_reason": None,
                "sources": [
                    {"source_id": "SRC-FACT-001", "version_id": "v1.0", "type": "fact"},
                    {"source_id": "SRC-FACT-002", "version_id": "v1.0", "type": "fact"},
                    {"source_id": "SRC-FACT-004", "version_id": "v1.0", "type": "fact"}
                ],
                "created_at": t_minus_12h
            }
        }
    ]

    total_findings_count = 0
    total_revisions_count = 0

    for d in drafts_data:
        # Insert revisions
        rev_docs = []
        for r in d["revisions"]:
            rev_doc = {
                "revision_id": r["rev_id"],
                "draft_id": d["draft_id"],
                "workspace_id": demo_ws_id,
                "revision_number": r["rev_num"],
                "creator_id": d["creator_id"],
                "content_text": r["text"],
                "content_hash": f"hash_{r['rev_id']}",
                "submission_type": "text",
                "original_filename": None,
                "created_at": r["created_at"]
            }
            rev_docs.append(rev_doc)

            # Run deterministic verification engine on each revision to generate authentic grounded findings
            findings = DeterministicRuleEngine.run_checks(
                draft_text=r["text"],
                guidelines=guidelines,
                approved_facts=approved_facts,
                draft_id=d["draft_id"],
                revision_id=r["rev_id"],
                workspace_id=demo_ws_id
            )
            if findings:
                db.findings.insert_many(findings)
                total_findings_count += len(findings)

        db.revisions.insert_many(rev_docs)
        total_revisions_count += len(rev_docs)

        # Current revision is the last revision
        latest_rev = rev_docs[-1]
        draft_doc = {
            "draft_id": d["draft_id"],
            "workspace_id": demo_ws_id,
            "creator_id": d["creator_id"],
            "creator_name": d["creator_name"],
            "title": d["title"],
            "target_product": d["product"],
            "target_audience": d["audience"],
            "current_revision_id": latest_rev["revision_id"],
            "status": d["status"],
            "ready_to_publish": d["ready_to_publish"],
            "created_at": d["created_at"],
            "updated_at": d["updated_at"]
        }
        db.drafts.insert_one(draft_doc)

        # Insert decision if available
        if "decision" in d:
            dec = d["decision"]
            dec_doc = {
                "decision_id": dec["decision_id"],
                "draft_id": d["draft_id"],
                "revision_id": dec["revision_id"],
                "workspace_id": demo_ws_id,
                "reviewer_id": "USR-REVIEWER-01",
                "reviewer_name": "Marcus Vance",
                "decision": dec["decision"],
                "comment": dec["comment"],
                "override_reason": dec["override_reason"],
                "source_snapshot": dec["sources"],
                "created_at": dec["created_at"]
            }
            db.approval_decisions.insert_one(dec_doc)

    print(f" -> Inserted {len(drafts_data)} drafts with {total_revisions_count} revisions and {total_findings_count} deterministic findings.")

    # 7. Source-Change Re-Review Alerts
    print("[7/8] Seeding active source-change alerts for live governance intelligence...")
    source_alerts = [
        {
            "alert_id": "ALT-SRC-001",
            "workspace_id": demo_ws_id,
            "draft_id": "DFT-DEMO-002",
            "source_id": "SRC-FACT-001",
            "old_version": "v1.0",
            "new_version": "v1.1",
            "source_statement": "Battery life: up to 14 hours under optimized low-latency mode.",
            "message": "Approved source 'SRC-FACT-001' was updated from v1.0 to v1.1. Historical approval record is preserved; re-review of this draft is recommended.",
            "status": "pending_re_review",
            "created_at": t_minus_2h
        },
        {
            "alert_id": "ALT-SRC-002",
            "workspace_id": demo_ws_id,
            "draft_id": "DFT-DEMO-005",
            "source_id": "SRC-FACT-003",
            "old_version": "v1.0",
            "new_version": "v1.1",
            "source_statement": "Limited warranty updated: 2 years standard hardware coverage in EU and NA regions.",
            "message": "Approved source 'SRC-FACT-003' was updated from v1.0 to v1.1. Historical approval record is preserved; re-review of this draft is recommended.",
            "status": "pending_re_review",
            "created_at": t_minus_2h
        }
    ]
    db.source_alerts.insert_many(source_alerts)
    print(f" -> Created {len(source_alerts)} active source-change alerts.")

    # 8. Comprehensive Immutable Audit Trail (15 chronological events)
    print("[8/8] Recording comprehensive immutable audit log events...")
    audit_events = [
        {
            "event_id": "EVT-001",
            "workspace_id": demo_ws_id,
            "actor_id": "USR-ADMIN-01",
            "actor_name": "Sarah Connor",
            "action": "workspace_configured",
            "target_type": "workspace",
            "target_id": demo_ws_id,
            "details": "Initialized brand governance workspace for Apex Sound & Mobility hardware.",
            "metadata": {"brand": "Apex Sound", "organization": "Apex Global Technologies"},
            "created_at": t_minus_48h
        },
        {
            "event_id": "EVT-002",
            "workspace_id": demo_ws_id,
            "actor_id": "USR-ADMIN-01",
            "actor_name": "Sarah Connor",
            "action": "guidelines_bulk_imported",
            "target_type": "guideline",
            "target_id": "BULK-8",
            "details": "Bulk imported 8 core brand guidelines, prohibited terminology, and FTC compliance rules.",
            "metadata": {"rules_count": 8},
            "created_at": t_minus_48h + timedelta(minutes=10)
        },
        {
            "event_id": "EVT-003",
            "workspace_id": demo_ws_id,
            "actor_id": "USR-ADMIN-01",
            "actor_name": "Sarah Connor",
            "action": "approved_facts_bulk_imported",
            "target_type": "approved_fact",
            "target_id": "BULK-10",
            "details": "Bulk imported 10 verified hardware engineering specifications for AeroPulse and PulseBand lines.",
            "metadata": {"facts_count": 10},
            "created_at": t_minus_48h + timedelta(minutes=20)
        },
        {
            "event_id": "EVT-004",
            "workspace_id": demo_ws_id,
            "actor_id": "USR-ADMIN-01",
            "actor_name": "Sarah Connor",
            "action": "user_registered",
            "target_type": "user",
            "target_id": "USR-CREATOR-01",
            "details": "Registered Alex Rivera as Content Creator in Apex Sound workspace.",
            "metadata": {"role": "creator"},
            "created_at": t_minus_48h + timedelta(minutes=30)
        },
        {
            "event_id": "EVT-005",
            "workspace_id": demo_ws_id,
            "actor_id": "USR-ADMIN-01",
            "actor_name": "Sarah Connor",
            "action": "user_registered",
            "target_type": "user",
            "target_id": "USR-REVIEWER-01",
            "details": "Registered Marcus Vance as Compliance Reviewer with sign-off authority.",
            "metadata": {"role": "reviewer"},
            "created_at": t_minus_48h + timedelta(minutes=35)
        },
        {
            "event_id": "EVT-006",
            "workspace_id": demo_ws_id,
            "actor_id": "USR-CREATOR-01",
            "actor_name": "Alex Rivera",
            "action": "draft_submitted",
            "target_type": "draft",
            "target_id": "DFT-DEMO-001",
            "details": "Submitted promotional draft 'Holiday Launch Copy — Headphones Battery Promo'.",
            "metadata": {"revision_number": 1},
            "created_at": t_minus_24h
        },
        {
            "event_id": "EVT-007",
            "workspace_id": demo_ws_id,
            "actor_id": "USR-CREATOR-01",
            "actor_name": "Alex Rivera",
            "action": "verification_completed",
            "target_type": "revision",
            "target_id": "REV-DEMO-001",
            "details": "Verification executed for 'Holiday Launch Copy'. Found 3 issues (1 critical battery contradiction, 1 guarantee claim, 1 preferred term).",
            "metadata": {"status": "requires_override"},
            "created_at": t_minus_24h + timedelta(minutes=2)
        },
        {
            "event_id": "EVT-008",
            "workspace_id": demo_ws_id,
            "actor_id": "USR-CREATOR-01",
            "actor_name": "Alex Rivera",
            "action": "revision_submitted",
            "target_type": "revision",
            "target_id": "REV-DEMO-002B",
            "details": "Submitted Revision #2 for 'Spring Campaign Social Ad' resolving battery claim to 12 hours.",
            "metadata": {"revision_number": 2},
            "created_at": t_minus_2h - timedelta(minutes=30)
        },
        {
            "event_id": "EVT-009",
            "workspace_id": demo_ws_id,
            "actor_id": "USR-REVIEWER-01",
            "actor_name": "Marcus Vance",
            "action": "draft_approved",
            "target_type": "draft",
            "target_id": "DFT-DEMO-002",
            "details": "Reviewer Marcus Vance approved Revision #2 of 'Spring Campaign Social Ad' for publication.",
            "metadata": {"decision": "approved", "decision_id": "DEC-DEMO-001"},
            "created_at": t_minus_2h
        },
        {
            "event_id": "EVT-010",
            "workspace_id": demo_ws_id,
            "actor_id": "USR-REVIEWER-01",
            "actor_name": "Marcus Vance",
            "action": "changes_requested",
            "target_type": "draft",
            "target_id": "DFT-DEMO-003",
            "details": "Reviewer Marcus Vance requested changes on 'Extreme Outdoor Billboard'. Disallowed 100m water submersion claim.",
            "metadata": {"decision": "changes_requested", "decision_id": "DEC-DEMO-002"},
            "created_at": t_minus_2h + timedelta(minutes=10)
        },
        {
            "event_id": "EVT-011",
            "workspace_id": demo_ws_id,
            "actor_id": "USR-CREATOR-02",
            "actor_name": "Elena Chen",
            "action": "draft_submitted",
            "target_type": "draft",
            "target_id": "DFT-DEMO-004",
            "details": "Submitted 'PulseBand Pro Fitness Launch Announcement' targeting outdoor athletes.",
            "metadata": {"revision_number": 1},
            "created_at": t_minus_12h
        },
        {
            "event_id": "EVT-012",
            "workspace_id": demo_ws_id,
            "actor_id": "USR-REVIEWER-01",
            "actor_name": "Marcus Vance",
            "action": "draft_approved",
            "target_type": "draft",
            "target_id": "DFT-DEMO-005",
            "details": "Reviewer Marcus Vance marked 'Executive Product Update Newsletter' as clean and approved.",
            "metadata": {"decision": "approved", "decision_id": "DEC-DEMO-003"},
            "created_at": t_minus_12h + timedelta(minutes=15)
        },
        {
            "event_id": "EVT-013",
            "workspace_id": demo_ws_id,
            "actor_id": "USR-CREATOR-01",
            "actor_name": "Alex Rivera",
            "action": "draft_submitted",
            "target_type": "draft",
            "target_id": "DFT-DEMO-006",
            "details": "Submitted promotional draft 'Black Friday Flash Sale Copy' containing markdown sale wording.",
            "metadata": {"revision_number": 1},
            "created_at": t_minus_2h
        },
        {
            "event_id": "EVT-014",
            "workspace_id": demo_ws_id,
            "actor_id": "USR-REVIEWER-01",
            "actor_name": "Marcus Vance",
            "action": "draft_approved",
            "target_type": "draft",
            "target_id": "DFT-DEMO-008",
            "details": "Reviewer Marcus Vance approved Revision #2 of 'Global Website Product Overview' after claim substantiation.",
            "metadata": {"decision": "approved", "decision_id": "DEC-DEMO-005"},
            "created_at": t_minus_2h + timedelta(minutes=20)
        },
        {
            "event_id": "EVT-015",
            "workspace_id": demo_ws_id,
            "actor_id": "USR-ADMIN-01",
            "actor_name": "Sarah Connor",
            "action": "approved_fact_updated",
            "target_type": "approved_fact",
            "target_id": "SRC-FACT-001",
            "details": "Updated specification 'SRC-FACT-001' to version v1.1. Triggered automated re-audit notifications.",
            "metadata": {"old_version": "v1.0", "new_version": "v1.1"},
            "created_at": t_minus_2h + timedelta(minutes=40)
        }
    ]
    db.audit_events.insert_many(audit_events)
    print(f" -> Recorded {len(audit_events)} chronological immutable audit trail events.")

    print("=" * 70)
    print("SUCCESS: VeriBrand AI MongoDB Atlas Demo Dataset Seeding Complete!")
    print(f"Summary:")
    print(f" - Workspaces: {db.workspaces.count_documents({})}")
    print(f" - Users: {db.users.count_documents({})}")
    print(f" - Brand Guidelines: {db.guidelines.count_documents({})}")
    print(f" - Approved Facts: {db.approved_facts.count_documents({})}")
    print(f" - Drafts: {db.drafts.count_documents({})}")
    print(f" - Revisions: {db.revisions.count_documents({})}")
    print(f" - Findings: {db.findings.count_documents({})}")
    print(f" - Decisions: {db.approval_decisions.count_documents({})}")
    print(f" - Source Alerts: {db.source_alerts.count_documents({})}")
    print(f" - Audit Events: {db.audit_events.count_documents({})}")
    print("=" * 70)


if __name__ == "__main__":
    seed_database()
