import os
import uuid
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas
from auth import require_admin, require_user, get_user_from_token, get_current_user

router = APIRouter()

VOCAB_FILES_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "vocab_files"
)
os.makedirs(VOCAB_FILES_DIR, exist_ok=True)


def _save_pdf(original_name: str, content: bytes) -> str:
    safe = "".join(c for c in original_name if c.isalnum() or c in ".-_")
    if not safe.lower().endswith(".pdf"):
        safe += ".pdf"
    unique = f"{uuid.uuid4().hex[:8]}_{safe}"
    with open(os.path.join(VOCAB_FILES_DIR, unique), "wb") as f:
        f.write(content)
    return unique


@router.get("/", response_model=List[schemas.VocabTopicResponse])
def list_vocab(db: Session = Depends(get_db), _=Depends(require_user)):
    return db.query(models.VocabTopic).order_by(models.VocabTopic.name).all()


@router.post("/", response_model=schemas.VocabTopicResponse)
def create_vocab(data: schemas.VocabTopicCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    vt = models.VocabTopic(name=data.name.strip(), name_uz=(data.name_uz or "").strip(), pdf_file="")
    db.add(vt)
    db.commit()
    db.refresh(vt)
    return vt


@router.post("/{vocab_id}/upload", response_model=schemas.VocabTopicResponse)
async def upload_vocab_pdf(
    vocab_id: int,
    pdf_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    vt = db.query(models.VocabTopic).filter(models.VocabTopic.id == vocab_id).first()
    if not vt:
        raise HTTPException(status_code=404, detail="Topilmadi")
    if vt.pdf_file:
        old = os.path.join(VOCAB_FILES_DIR, vt.pdf_file)
        if os.path.exists(old):
            os.remove(old)
    vt.pdf_file = _save_pdf(pdf_file.filename, await pdf_file.read())
    db.commit()
    db.refresh(vt)
    return vt


@router.get("/{vocab_id}/pdf", include_in_schema=False)
def view_vocab_pdf(
    vocab_id: int,
    t: Optional[str] = Query(None),
    bearer_user: Optional[models.User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = bearer_user or (get_user_from_token(t, db) if t else None)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Kirish talab qilinadi")
    vt = db.query(models.VocabTopic).filter(models.VocabTopic.id == vocab_id).first()
    if not vt:
        raise HTTPException(status_code=404, detail="Topilmadi")
    if not vt.pdf_file:
        raise HTTPException(status_code=404, detail="PDF fayl yo'q")
    path = os.path.join(VOCAB_FILES_DIR, vt.pdf_file)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Fayl topilmadi")
    safe_name = f"{vt.name}.pdf".encode("ascii", errors="ignore").decode()
    return FileResponse(
        path=path,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{safe_name}"'},
    )


@router.put("/{vocab_id}", response_model=schemas.VocabTopicResponse)
def update_vocab(vocab_id: int, data: schemas.VocabTopicUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    vt = db.query(models.VocabTopic).filter(models.VocabTopic.id == vocab_id).first()
    if not vt:
        raise HTTPException(status_code=404, detail="Topilmadi")
    if data.name is not None:
        vt.name = data.name.strip()
    if data.name_uz is not None:
        vt.name_uz = data.name_uz.strip()
    db.commit()
    db.refresh(vt)
    return vt


@router.delete("/{vocab_id}")
def delete_vocab(vocab_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    vt = db.query(models.VocabTopic).filter(models.VocabTopic.id == vocab_id).first()
    if not vt:
        raise HTTPException(status_code=404, detail="Topilmadi")
    if vt.pdf_file:
        path = os.path.join(VOCAB_FILES_DIR, vt.pdf_file)
        if os.path.exists(path):
            os.remove(path)
    db.delete(vt)
    db.commit()
    return {"ok": True}
