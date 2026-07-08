import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas
from auth import require_admin

router = APIRouter()
UPLOAD_DIR = "uploads/audio"
ALLOWED = {".mp3", ".m4a", ".ogg", ".wav"}


@router.post("/upload", response_model=schemas.AudioFileResponse)
async def upload_audio(
    file: UploadFile = File(...),
    test_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED:
        raise HTTPException(status_code=400, detail="Faqat audio fayllar qabul qilinadi")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    unique = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, unique)
    content = await file.read()
    with open(path, "wb") as f:
        f.write(content)
    record = models.AudioFile(
        test_id=test_id, filename=unique, original_name=file.filename,
        file_path=path, file_size=len(content),
        url=f"/uploads/audio/{unique}",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/", response_model=List[schemas.AudioFileResponse])
def list_audio(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    return db.query(models.AudioFile).order_by(models.AudioFile.uploaded_at.desc()).all()


@router.delete("/{audio_id}")
def delete_audio(
    audio_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin),
):
    rec = db.query(models.AudioFile).filter(models.AudioFile.id == audio_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Not found")
    if rec.file_path and os.path.exists(rec.file_path):
        os.remove(rec.file_path)
    db.delete(rec)
    db.commit()
    return {"message": "Deleted"}
