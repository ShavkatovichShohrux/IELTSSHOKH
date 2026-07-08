import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from database import get_db
import models, schemas
from auth import get_current_user, require_admin

router = APIRouter()

BAND_MAP = [
    (39, 9.0), (37, 8.5), (35, 8.0), (32, 7.5), (30, 7.0),
    (26, 6.5), (23, 6.0), (18, 5.5), (16, 5.0), (13, 4.5),
    (11, 4.0), (9, 3.5), (7, 3.0), (5, 2.5), (0, 2.0),
]


def calc_band(score: int, total: int = 40) -> float:
    normalized = round(score * 40 / total) if total != 40 else score
    for threshold, band in BAND_MAP:
        if normalized >= threshold:
            return band
    return 2.0


def _fmt(r: models.Result) -> schemas.ResultResponse:
    return schemas.ResultResponse(
        id=r.id, test_id=r.test_id, user_id=r.user_id,
        score=r.score, total=r.total, band_score=r.band_score,
        answers=json.loads(r.answers) if isinstance(r.answers, str) else r.answers,
        time_taken=r.time_taken, created_at=r.created_at,
        test_title=r.test.title if r.test else None,
        username=r.user.username if r.user else None,
    )


@router.post("/", response_model=schemas.ResultResponse)
def submit_result(
    data: schemas.ResultCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    test = db.query(models.Test).filter(models.Test.id == data.test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    r = models.Result(
        user_id=current_user.id if current_user else None,
        test_id=data.test_id, score=data.score, total=data.total,
        band_score=data.band_score,
        answers=json.dumps(data.answers),
        time_taken=data.time_taken,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return _fmt(r)


@router.get("/my", response_model=List[schemas.ResultResponse])
def my_results(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if not current_user:
        return []
    results = (
        db.query(models.Result)
        .filter(models.Result.user_id == current_user.id)
        .order_by(models.Result.created_at.desc())
        .all()
    )
    return [_fmt(r) for r in results]


@router.get("/", response_model=List[schemas.ResultResponse])
def all_results(
    test_id: Optional[int] = None,
    limit: int = Query(200, le=500),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    q = db.query(models.Result)
    if test_id:
        q = q.filter(models.Result.test_id == test_id)
    return [_fmt(r) for r in q.order_by(models.Result.created_at.desc()).limit(limit).all()]


@router.get("/stats/global", response_model=schemas.GlobalStats)
def global_stats(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    return schemas.GlobalStats(
        total_users=db.query(func.count(models.User.id)).scalar() or 0,
        total_tests=db.query(func.count(models.Test.id)).scalar() or 0,
        total_results=db.query(func.count(models.Result.id)).scalar() or 0,
        avg_band_score=round(db.query(func.avg(models.Result.band_score)).scalar() or 0, 2),
        listening_tests=db.query(func.count(models.Test.id)).filter(models.Test.type == "listening").scalar() or 0,
        reading_tests=db.query(func.count(models.Test.id)).filter(models.Test.type == "reading").scalar() or 0,
    )


@router.get("/stats/tests", response_model=List[schemas.TestStats])
def test_stats(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    tests = db.query(models.Test).all()
    out = []
    for t in tests:
        rows = db.query(models.Result).filter(models.Result.test_id == t.id).all()
        if not rows:
            continue
        out.append(schemas.TestStats(
            test_id=t.id, test_title=t.title, test_type=t.type,
            attempts=len(rows),
            avg_score=round(sum(r.score for r in rows) / len(rows), 1),
            avg_band_score=round(sum(r.band_score for r in rows) / len(rows), 2),
        ))
    return sorted(out, key=lambda x: x.attempts, reverse=True)
