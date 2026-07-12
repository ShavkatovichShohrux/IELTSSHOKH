from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from database import get_db
import models
from auth import require_admin

router = APIRouter()


class SettingsUpdate(BaseModel):
    card_number: Optional[str] = None
    card_holder: Optional[str] = None
    basic_name: Optional[str] = None
    elite_name: Optional[str] = None
    basic_price: Optional[str] = None
    elite_price: Optional[str] = None
    telegram_username: Optional[str] = None
    payment_note: Optional[str] = None


def _get_or_create(db: Session) -> models.SiteSettings:
    s = db.query(models.SiteSettings).filter(models.SiteSettings.id == 1).first()
    if not s:
        s = models.SiteSettings(id=1, telegram_username="shokh_shavkatovich")
        db.add(s)
        db.commit()
        db.refresh(s)
    return s


def _to_dict(s: models.SiteSettings) -> dict:
    return {
        "card_number": s.card_number or "",
        "card_holder": s.card_holder or "",
        "basic_name": s.basic_name or "Basic",
        "elite_name": s.elite_name or "Elite",
        "basic_price": s.basic_price or "",
        "elite_price": s.elite_price or "",
        "telegram_username": s.telegram_username or "shokh_shavkatovich",
        "payment_note": s.payment_note or "",
    }


@router.get("/")
def get_settings(db: Session = Depends(get_db)):
    return _to_dict(_get_or_create(db))


@router.put("/")
def update_settings(
    data: SettingsUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    s = _get_or_create(db)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return _to_dict(s)
