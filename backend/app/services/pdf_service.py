import io
from typing import Tuple, Dict, Any
from fastapi import HTTPException, status
import fitz  # PyMuPDF
from app.config import settings


def extract_text_from_pdf(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    # 1. Size check
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > settings.MAX_PDF_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed limit of {settings.MAX_PDF_SIZE_MB} MB (uploaded {size_mb:.2f} MB)."
        )

    # 2. Extract using PyMuPDF
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        page_count = len(doc)
        if page_count > settings.MAX_PDF_PAGES:
            doc.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"PDF exceeds maximum page limit of {settings.MAX_PDF_PAGES} pages (found {page_count} pages)."
            )

        extracted_text = []
        for page_num in range(page_count):
            page = doc.load_page(page_num)
            extracted_text.append(page.get_text())
        doc.close()

        full_text = "\n".join(extracted_text).strip()

        # 3. Character length check
        if len(full_text) > settings.MAX_EXTRACTED_CHARS:
            # We reject oversized text clearly instead of silently truncating per Round 1 specs
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Extracted content exceeds maximum character limit of {settings.MAX_EXTRACTED_CHARS} chars (found {len(full_text)} chars)."
            )

        if not full_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No extractable text found in PDF. Note that scanned image PDFs require OCR which is outside current scope."
            )

        return {
            "filename": filename,
            "page_count": page_count,
            "character_count": len(full_text),
            "extracted_text": full_text
        }

    except HTTPException:
        raise
    except Exception as e:
        # Fallback to pypdf if fitz encounters format peculiarity
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            pages = len(reader.pages)
            if pages > settings.MAX_PDF_PAGES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"PDF exceeds maximum page limit of {settings.MAX_PDF_PAGES} pages."
                )
            text = "\n".join([p.extract_text() or "" for p in reader.pages]).strip()
            if not text:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No extractable text found in PDF."
                )
            if len(text) > settings.MAX_EXTRACTED_CHARS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Extracted text exceeds {settings.MAX_EXTRACTED_CHARS} characters."
                )
            return {
                "filename": filename,
                "page_count": pages,
                "character_count": len(text),
                "extracted_text": text
            }
        except HTTPException:
            raise
        except Exception as fallback_err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not parse PDF file: {str(e)}"
            )
