import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas
from auth import require_admin, get_current_user, require_elite

router = APIRouter()


def _deserialize_questions(test: models.Test):
    for part in test.parts:
        for q in part.questions:
            if isinstance(q.options, str):
                try:
                    q.options = json.loads(q.options)
                except Exception:
                    pass
            if isinstance(q.correct_answer, str):
                try:
                    q.correct_answer = json.loads(q.correct_answer)
                except Exception:
                    pass


@router.get("/", response_model=List[schemas.TestListItem])
def list_tests(
    type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Admin uchun plan check yo'q; student uchun elite talab
    if current_user and current_user.role != "admin":
        if current_user.plan != "elite":
            raise HTTPException(status_code=403, detail="PLAN_REQUIRED:elite")
    query = db.query(models.Test)
    if not current_user or current_user.role != "admin":
        query = query.filter(models.Test.is_published == True)
    if type:
        query = query.filter(models.Test.type == type)
    tests = query.order_by(models.Test.created_at.desc()).all()
    return [
        schemas.TestListItem(
            id=t.id,
            title=t.title,
            type=t.type,
            difficulty=t.difficulty or "Academic",
            is_published=t.is_published,
            created_at=t.created_at,
            parts_count=len(t.parts),
            questions_count=sum(len(p.questions) for p in t.parts),
            topic_id=t.topic_id,
            topic_name=t.topic.name if t.topic else None,
            topic_color=t.topic.color if t.topic else None,
        )
        for t in tests
    ]


@router.get("/{test_id}", response_model=schemas.TestDetail)
def get_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    test = db.query(models.Test).filter(models.Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    if not test.is_published and (not current_user or current_user.role != "admin"):
        raise HTTPException(status_code=403, detail="Test not available")
    _deserialize_questions(test)
    return test


@router.post("/", response_model=schemas.TestDetail)
def create_test(
    data: schemas.TestCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    test = models.Test(
        title=data.title, type=data.type, description=data.description,
        audio_url=data.audio_url, audio_filename=data.audio_filename,
        difficulty=data.difficulty, is_published=data.is_published,
        topic_id=data.topic_id,
    )
    db.add(test)
    db.flush()
    _create_parts(db, test.id, data.parts)
    db.commit()
    db.refresh(test)
    _deserialize_questions(test)
    return test


@router.put("/{test_id}", response_model=schemas.TestDetail)
def update_test(
    test_id: int,
    data: schemas.TestUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    test = db.query(models.Test).filter(models.Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    for field, value in data.model_dump(exclude_unset=True, exclude={"parts"}).items():
        setattr(test, field, value)

    if data.parts is not None:
        for part in list(test.parts):
            db.delete(part)
        db.flush()
        _create_parts(db, test.id, data.parts)

    db.commit()
    db.refresh(test)
    _deserialize_questions(test)
    return test


@router.delete("/{test_id}")
def delete_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    test = db.query(models.Test).filter(models.Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    db.delete(test)
    db.commit()
    return {"message": "Deleted"}


def _create_parts(db: Session, test_id: int, parts_data):
    for pd in parts_data:
        part = models.Part(
            test_id=test_id, part_number=pd.part_number,
            title=pd.title, description=pd.description, passage_text=pd.passage_text,
        )
        db.add(part)
        db.flush()
        for qd in pd.questions:
            db.add(models.Question(
                part_id=part.id,
                question_number=qd.question_number,
                question_type=qd.question_type,
                question_text=qd.question_text,
                options=json.dumps(qd.options) if qd.options is not None else None,
                correct_answer=json.dumps(qd.correct_answer) if qd.correct_answer is not None else None,
                feedback=qd.feedback,
            ))
