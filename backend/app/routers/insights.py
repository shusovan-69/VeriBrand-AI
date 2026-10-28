from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, HTTPException, status
from typing import Dict, Any, List, Optional
from pymongo.database import Database

from app.database import get_db
from app.dependencies.auth_deps import get_current_user
from app.services.revision_insights_service import RevisionInsightsService
from app.services.source_alert_service import SourceAlertService
from app.services.image_service import ImageReviewService

router = APIRouter(prefix="/insights", tags=["Analytics & Revision Insights"])


@router.get("/revisions/compare", response_model=Dict[str, Any])
def compare_draft_revisions(
    draft_id: str = Query(...),
    base_rev: str = Query(...),
    new_rev: str = Query(...),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    workspace_id = current_user["workspace_id"]
    return RevisionInsightsService.compare_revisions(
        db=db,
        workspace_id=workspace_id,
        draft_id=draft_id,
        base_revision_id=base_rev,
        new_revision_id=new_rev
    )


@router.get("/trends", response_model=Dict[str, Any])
def get_recurring_trends(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    workspace_id = current_user["workspace_id"]
    return RevisionInsightsService.get_workspace_recurring_trends(db, workspace_id)


@router.get("/source-alerts", response_model=List[Dict[str, Any]])
def get_source_alerts(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    workspace_id = current_user["workspace_id"]
    alerts = SourceAlertService.get_workspace_alerts(db, workspace_id)
    for a in alerts:
        a["_id"] = str(a["_id"])
    return alerts


@router.post("/image-review", response_model=Dict[str, Any])
async def review_brand_image(
    file: UploadFile = File(...),
    sampled_hex: Optional[str] = Form(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    ext = file.filename.lower().split(".")[-1]
    if ext not in ["png", "jpg", "jpeg", "webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image must be PNG, JPEG or WebP format."
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty image file.")

    return ImageReviewService.analyze_image_region(
        image_bytes=file_bytes,
        filename=file.filename,
        sampled_hex=sampled_hex
    )
