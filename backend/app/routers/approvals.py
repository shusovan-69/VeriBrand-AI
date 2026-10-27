import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

from app.database import get_db
from app.dependencies.auth_deps import get_current_user, require_roles, record_audit_event
from app.schemas.approval import DecisionRequest, DecisionResponse, PendingReviewItem

router = APIRouter(prefix="/reviews", tags=["Reviewer Workflow & Approvals"])


@router.get("/pending", response_model=List[PendingReviewItem])
def get_pending_reviews(
    current_user: Dict[str, Any] = Depends(require_roles(["reviewer", "admin", "owner"])),
    db: Database = Depends(get_db)
):
    workspace_id = current_user["workspace_id"]
    # Drafts that are submitted or under_review
    pending_drafts = list(db.drafts.find({
        "workspace_id": workspace_id,
        "status": {"$in": ["submitted", "under_review"]}
    }).sort("updated_at", -1))

    items = []
    for d in pending_drafts:
        rev_id = d.get("current_revision_id")
        rev = db.revisions.find_one({"workspace_id": workspace_id, "revision_id": rev_id})
        rev_num = rev.get("revision_number", 1) if rev else 1

        findings = list(db.findings.find({"workspace_id": workspace_id, "revision_id": rev_id}))
        crit_count = sum(1 for f in findings if f.get("severity") == "critical" and not f.get("is_resolved"))
        high_count = sum(1 for f in findings if f.get("severity") == "high" and not f.get("is_resolved"))

        items.append(PendingReviewItem(
            draft_id=d["draft_id"],
            title=d["title"],
            creator_id=d["creator_id"],
            creator_name=d.get("creator_name", "Content Creator"),
            current_revision_id=rev_id,
            revision_number=rev_num,
            target_product=d.get("target_product"),
            status=d["status"],
            critical_findings_count=crit_count,
            high_findings_count=high_count,
            total_findings=len(findings),
            submitted_at=d["updated_at"]
        ))

    return items


@router.post("/{draft_id}/decision", response_model=DecisionResponse)
def submit_decision(
    draft_id: str,
    req: DecisionRequest,
    current_user: Dict[str, Any] = Depends(require_roles(["reviewer", "admin", "owner"])),
    db: Database = Depends(get_db)
):
    workspace_id = current_user["workspace_id"]
    draft = db.drafts.find_one({"workspace_id": workspace_id, "draft_id": draft_id})
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found in workspace.")

    # 1. Block Self-Approval: Creator cannot approve their own content
    if draft["creator_id"] == current_user["user_id"] and req.decision == "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Separation of concerns violation: Creators are strictly prohibited from approving their own drafts."
        )

    current_rev_id = draft.get("current_revision_id")
    findings = list(db.findings.find({"workspace_id": workspace_id, "revision_id": current_rev_id}))
    unresolved_high = [
        f for f in findings
        if f.get("severity") in ["critical", "high"] and not f.get("is_resolved")
    ]

    # 2. If approving with unresolved critical/high issues, require explicit override reason
    if req.decision == "approved" and unresolved_high:
        if not req.override_reason or len(req.override_reason.strip()) < 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Approval blocked: Draft has {len(unresolved_high)} unresolved critical/high severity findings. "
                    "You must provide a detailed 'override_reason' justifying why this content is approved."
                )
            )

    decision_clean = req.decision.lower().strip()
    if decision_clean not in ["approved", "changes_requested"]:
        raise HTTPException(status_code=400, detail="Decision must be 'approved' or 'changes_requested'.")

    # 3. Snapshot of active sources cited
    cited_source_ids = list({f.get("source_id") for f in findings if f.get("source_id")})
    source_snapshots = []
    for sid in cited_source_ids:
        fact = db.approved_facts.find_one({"workspace_id": workspace_id, "source_id": sid})
        if fact:
            source_snapshots.append({"source_id": sid, "version_id": fact.get("version_id", "v1.0"), "type": "fact"})
        else:
            rule = db.guidelines.find_one({"workspace_id": workspace_id, "rule_id": sid})
            if rule:
                source_snapshots.append({"source_id": sid, "version_id": rule.get("version_id", "v1.0"), "type": "rule"})

    now = datetime.now(timezone.utc)
    decision_id = f"DEC-{uuid.uuid4().hex[:8].upper()}"

    decision_doc = {
        "decision_id": decision_id,
        "draft_id": draft_id,
        "revision_id": current_rev_id,
        "workspace_id": workspace_id,
        "reviewer_id": current_user["user_id"],
        "reviewer_name": current_user["full_name"],
        "decision": decision_clean,
        "comment": req.comment or "",
        "override_reason": req.override_reason if req.decision == "approved" else None,
        "source_snapshot": source_snapshots,
        "created_at": now
    }
    db.approval_decisions.insert_one(decision_doc)

    # 4. Update draft state
    new_status = "approved" if decision_clean == "approved" else "changes_requested"
    ready_publish = (decision_clean == "approved")

    db.drafts.update_one(
        {"_id": draft["_id"]},
        {"$set": {
            "status": new_status,
            "ready_to_publish": ready_publish,
            "updated_at": now
        }}
    )

    action_name = "draft_approved" if decision_clean == "approved" else "changes_requested"
    record_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_id=current_user["user_id"],
        actor_name=current_user["full_name"],
        action=action_name,
        target_type="draft",
        target_id=draft_id,
        details=f"Reviewer {current_user['full_name']} marked draft '{draft['title']}' as '{new_status}'. Comment: {req.comment or 'None'}.",
        metadata={"decision_id": decision_id, "revision_id": current_rev_id}
    )

    return DecisionResponse(**decision_doc)
