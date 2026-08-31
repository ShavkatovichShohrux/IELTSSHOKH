import os
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models
from auth import require_admin, require_elite, get_user_from_token

router = APIRouter()

EXAM_TOPICS_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "exam_topic_files"
)
os.makedirs(EXAM_TOPICS_DIR, exist_ok=True)


class ExamTopicResponse(BaseModel):
    id: int
    title: str
    description: str
    html_file: str
    order: int
    is_published: bool

    class Config:
        from_attributes = True


class ExamTopicCreate(BaseModel):
    title: str
    description: str = ""
    order: int = 0


def _resp(t: models.ExamTopic) -> ExamTopicResponse:
    return ExamTopicResponse(
        id=t.id, title=t.title, description=t.description or "",
        html_file=t.html_file or "", order=t.order or 0,
        is_published=t.is_published,
    )


# ── User endpoints (elite only) ───────────────────────────────────────────────

@router.get("/", response_model=List[ExamTopicResponse])
def list_exam_topics(
    current_user=Depends(require_elite),
    db: Session = Depends(get_db),
):
    topics = (
        db.query(models.ExamTopic)
        .filter(models.ExamTopic.is_published == True)
        .order_by(models.ExamTopic.order, models.ExamTopic.id)
        .all()
    )
    return [_resp(t) for t in topics]


@router.get("/{topic_id}/content", response_class=HTMLResponse, include_in_schema=False)
def view_exam_topic(
    topic_id: int,
    t: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    user = get_user_from_token(t or "", db)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Kirish talab qilinadi")
    if user.role != "admin" and user.plan != "elite":
        raise HTTPException(status_code=403, detail="PLAN_REQUIRED:elite")

    topic = db.query(models.ExamTopic).filter(models.ExamTopic.id == topic_id).first()
    if not topic or not topic.html_file:
        raise HTTPException(status_code=404, detail="Mavzu topilmadi")
    path = os.path.join(EXAM_TOPICS_DIR, topic.html_file)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Fayl topilmadi")
    with open(path, encoding="utf-8") as f:
        return f.read()


# ── Admin endpoints ────────────────────────────────────────────────────────────

@router.get("/all", response_model=List[ExamTopicResponse])
def list_all_exam_topics(
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    topics = (
        db.query(models.ExamTopic)
        .order_by(models.ExamTopic.order, models.ExamTopic.id)
        .all()
    )
    return [_resp(t) for t in topics]


@router.post("/", response_model=ExamTopicResponse)
def create_exam_topic(
    data: ExamTopicCreate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    topic = models.ExamTopic(
        title=data.title, description=data.description, order=data.order
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return _resp(topic)


@router.put("/{topic_id}", response_model=ExamTopicResponse)
def update_exam_topic(
    topic_id: int,
    data: ExamTopicCreate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    topic = db.query(models.ExamTopic).filter(models.ExamTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topilmadi")
    topic.title = data.title
    topic.description = data.description
    topic.order = data.order
    db.commit()
    db.refresh(topic)
    return _resp(topic)


@router.put("/{topic_id}/publish", response_model=ExamTopicResponse)
def toggle_publish(
    topic_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    topic = db.query(models.ExamTopic).filter(models.ExamTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topilmadi")
    topic.is_published = not topic.is_published
    db.commit()
    db.refresh(topic)
    return _resp(topic)


@router.post("/{topic_id}/upload")
def upload_exam_topic_file(
    topic_id: int,
    file: UploadFile = File(...),
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    topic = db.query(models.ExamTopic).filter(models.ExamTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topilmadi")
    content = file.file.read()
    safe = "".join(c for c in (file.filename or "file") if c.isalnum() or c in ".-_")
    if not safe.endswith(".html"):
        safe += ".html"
    fname = f"et_{topic_id}_{safe}"
    with open(os.path.join(EXAM_TOPICS_DIR, fname), "wb") as f:
        f.write(content)
    topic.html_file = fname
    db.commit()
    db.refresh(topic)
    return _resp(topic)


@router.delete("/{topic_id}")
def delete_exam_topic(
    topic_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    topic = db.query(models.ExamTopic).filter(models.ExamTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topilmadi")
    if topic.html_file:
        path = os.path.join(EXAM_TOPICS_DIR, topic.html_file)
        if os.path.exists(path):
            os.remove(path)
    db.delete(topic)
    db.commit()
    return {"ok": True}
