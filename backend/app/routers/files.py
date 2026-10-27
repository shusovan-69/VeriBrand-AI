from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from typing import Dict, Any

from app.dependencies.auth_deps import get_current_user
from app.services.pdf_service import extract_text_from_pdf

router = APIRouter(prefix="/files", tags=["File Processing"])


@router.post("/extract-pdf", response_model=Dict[str, Any])
async def upload_and_extract_pdf(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents are supported for text extraction."
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    result = extract_text_from_pdf(file_bytes, file.filename)
    return result
