from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from pymongo.database import Database

from app.database import get_db
from app.dependencies.auth_deps import get_current_user
from app.schemas.dashboard import DashboardStats, RecentActivityItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    workspace_id = current_user["workspace_id"]

    total_drafts = db.drafts.count_documents({"workspace_id": workspace_id})
    pending_reviews = db.drafts.count_documents({
        "workspace_id": workspace_id,
        "status": {"$in": ["submitted", "under_review"]}
    })
    approved_content = db.drafts.count_documents({
        "workspace_id": workspace_id,
        "status": "approved"
    })
    flagged_issues = db.findings.count_documents({
        "workspace_id": workspace_id,
        "is_resolved": False
    })

    active_guidelines = db.guidelines.count_documents({
        "workspace_id": workspace_id,
        "is_active": True
    })
    approved_facts = db.approved_facts.count_documents({
        "workspace_id": workspace_id
    })

    source_change_alerts = db.source_alerts.count_documents({
        "workspace_id": workspace_id,
        "status": "pending_re_review"
    })

    clean_drafts = db.drafts.count_documents({
        "workspace_id": workspace_id,
        "status": "approved"
    })

    compliance_rate = 100.0
    if total_drafts > 0:
        compliance_rate = round((approved_content / total_drafts) * 100, 1)

    return DashboardStats(
        total_drafts=total_drafts,
        pending_reviews=pending_reviews,
        approved_content=approved_content,
        flagged_issues=flagged_issues,
        clean_drafts=clean_drafts,
        active_guidelines=active_guidelines,
        approved_facts=approved_facts,
        source_change_alerts=source_change_alerts,
        compliance_rate_percent=compliance_rate
    )


@router.get("/activity", response_model=List[RecentActivityItem])
def get_recent_activity(
    limit: int = 20,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    workspace_id = current_user["workspace_id"]
    events = list(db.audit_events.find({"workspace_id": workspace_id}).sort("created_at", -1).limit(limit))

    return [
        RecentActivityItem(
            event_id=e["event_id"],
            action=e["action"],
            actor_name=e.get("actor_name", "System"),
            target_type=e["target_type"],
            target_id=e["target_id"],
            details=e.get("details", ""),
            created_at=e["created_at"]
        )
        for e in events
    ]
