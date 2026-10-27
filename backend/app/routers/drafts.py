import hashlib
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

from app.database import get_db
from app.dependencies.auth_deps import get_current_user, require_roles, record_audit_event
from app.schemas.draft import (
    DraftCreateRequest, RevisionCreateRequest, DraftResponse, RevisionResponse, DraftHistoryResponse
)

router = APIRouter(prefix="/drafts", tags=["Drafts & Submissions"])


def hash_content(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


@router.post("", response_model=DraftResponse, status_code=status.HTTP_201_CREATED)
def create_draft(
    req: DraftCreateRequest,
    current_user: Dict[str, Any] = Depends(require_roles(["creator", "admin", "owner"])),
    db: Database = Depends(get_db)
):
    workspace_id = current_user["workspace_id"]
    draft_id = f"DFT-{uuid.uuid4().hex[:8].upper()}"
    revision_id = f"REV-{uuid.uuid4().hex[:8].upper()}"

    now = datetime.now(timezone.utc)
    content_clean = req.content_text.strip()
    c_hash = hash_content(content_clean)

    # 1. Create Revision 1 doc (Immutable)
    rev_doc = {
        "revision_id": revision_id,
        "draft_id": draft_id,
        "workspace_id": workspace_id,
        "revision_number": 1,
        "creator_id": current_user["user_id"],
        "content_text": content_clean,
        "content_hash": c_hash,
        "submission_type": req.submission_type or "text",
        "original_filename": req.original_filename,
        "created_at": now
    }
    db.revisions.insert_one(rev_doc)

    # 2. Create Draft doc
    draft_doc = {
        "draft_id": draft_id,
        "workspace_id": workspace_id,
        "creator_id": current_user["user_id"],
        "creator_name": current_user["full_name"],
        "title": req.title.strip(),
        "target_product": req.target_product.strip() if req.target_product else None,
        "target_audience": req.target_audience or "General Consumer",
        "current_revision_id": revision_id,
        "status": "submitted",
        "ready_to_publish": False,
        "created_at": now,
        "updated_at": now
    }
    db.drafts.insert_one(draft_doc)

    record_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_id=current_user["user_id"],
        actor_name=current_user["full_name"],
        action="draft_submitted",
        target_type="draft",
        target_id=draft_id,
        details=f"Submitted draft '{req.title}' (Revision #1, {len(content_clean)} characters)."
    )

    resp_data = dict(draft_doc)
    resp_data["latest_content_text"] = content_clean
    return DraftResponse(**resp_data)


@router.get("", response_model=List[DraftResponse])
def list_drafts(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    workspace_id = current_user["workspace_id"]
    drafts = list(db.drafts.find({"workspace_id": workspace_id}).sort("updated_at", -1))

    results = []
    for d in drafts:
        # Fetch current revision text
        rev = db.revisions.find_one({"workspace_id": workspace_id, "revision_id": d.get("current_revision_id")})
        d_copy = dict(d)
        d_copy["latest_content_text"] = rev.get("content_text") if rev else ""
        results.append(DraftResponse(**d_copy))

    return results


@router.get("/{draft_id}", response_model=DraftResponse)
def get_draft(
    draft_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    workspace_id = current_user["workspace_id"]
    draft = db.drafts.find_one({"workspace_id": workspace_id, "draft_id": draft_id})
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found in workspace.")

    rev = db.revisions.find_one({"workspace_id": workspace_id, "revision_id": draft.get("current_revision_id")})
    d_copy = dict(draft)
    d_copy["latest_content_text"] = rev.get("content_text") if rev else ""
    return DraftResponse(**d_copy)


@router.post("/{draft_id}/revisions", response_model=RevisionResponse, status_code=status.HTTP_201_CREATED)
def submit_revision(
    draft_id: str,
    req: RevisionCreateRequest,
    current_user: Dict[str, Any] = Depends(require_roles(["creator", "admin", "owner"])),
    db: Database = Depends(get_db)
):
    workspace_id = current_user["workspace_id"]
    draft = db.drafts.find_one({"workspace_id": workspace_id, "draft_id": draft_id})
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found in workspace.")

    # Calculate next revision number
    existing_revisions = list(db.revisions.find({"workspace_id": workspace_id, "draft_id": draft_id}))
    next_num = len(existing_revisions) + 1

    revision_id = f"REV-{uuid.uuid4().hex[:8].upper()}"
    content_clean = req.content_text.strip()
    c_hash = hash_content(content_clean)
    now = datetime.now(timezone.utc)

    rev_doc = {
        "revision_id": revision_id,
        "draft_id": draft_id,
        "workspace_id": workspace_id,
        "revision_number": next_num,
        "creator_id": current_user["user_id"],
        "content_text": content_clean,
        "content_hash": c_hash,
        "submission_type": req.submission_type or "text",
        "original_filename": req.original_filename,
        "created_at": now
    }
    db.revisions.insert_one(rev_doc)

    # Update draft pointer to current revision and reset status to submitted
    db.drafts.update_one(
        {"_id": draft["_id"]},
        {"$set": {
            "current_revision_id": revision_id,
            "status": "submitted",
            "ready_to_publish": False,
            "updated_at": now
        }}
    )

    record_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_id=current_user["user_id"],
        actor_name=current_user["full_name"],
        action="revision_submitted",
        target_type="revision",
        target_id=revision_id,
        details=f"Submitted Revision #{next_num} for draft '{draft['title']}'."
    )

    return RevisionResponse(**rev_doc)


@router.get("/{draft_id}/history", response_model=DraftHistoryResponse)
def get_draft_history(
    draft_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    workspace_id = current_user["workspace_id"]
    draft = db.drafts.find_one({"workspace_id": workspace_id, "draft_id": draft_id})
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found.")

    revisions = list(db.revisions.find({"workspace_id": workspace_id, "draft_id": draft_id}).sort("revision_number", 1))
    decisions = list(db.approval_decisions.find({"workspace_id": workspace_id, "draft_id": draft_id}).sort("created_at", -1))
    audit_events = list(db.audit_events.find({"workspace_id": workspace_id, "target_id": {"$in": [draft_id] + [r["revision_id"] for r in revisions]}}).sort("created_at", -1))

    # Clean mongo _id
    for dec in decisions:
        dec["_id"] = str(dec["_id"])
    for ev in audit_events:
        ev["_id"] = str(ev["_id"])

    rev_latest = db.revisions.find_one({"workspace_id": workspace_id, "revision_id": draft.get("current_revision_id")})
    d_copy = dict(draft)
    d_copy["latest_content_text"] = rev_latest.get("content_text") if rev_latest else ""

    return DraftHistoryResponse(
        draft=DraftResponse(**d_copy),
        revisions=[RevisionResponse(**r) for r in revisions],
        decisions=decisions,
        audit_events=audit_events
    )
