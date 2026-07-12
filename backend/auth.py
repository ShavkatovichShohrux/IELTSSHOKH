import os
import uuid
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
import models

SECRET_KEY = os.getenv("SECRET_KEY", "ieltsshokh-super-secret-key-2024")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_session(user_id: int, db: Session, ip: str = "", ua: str = "") -> str:
    """Faol sessiyalarni noaktiv qil, yangi session yarat. Tarixni saqlaydi."""
    db.query(models.UserSession).filter(
        models.UserSession.user_id == user_id,
        models.UserSession.is_active == True,
    ).update({"is_active": False})

    # Oxirgi 20 ta sessiyani saqlash, qolganlarni o'chirish
    old_ids = [
        row.id for row in
        db.query(models.UserSession.id)
        .filter(models.UserSession.user_id == user_id)
        .order_by(models.UserSession.created_at.desc())
        .offset(19).all()
    ]
    if old_ids:
        db.query(models.UserSession).filter(models.UserSession.id.in_(old_ids)).delete(synchronize_session=False)

    session_id = str(uuid.uuid4())
    session = models.UserSession(
        user_id=user_id,
        session_id=session_id,
        ip_address=ip[:45] if ip else "",
        user_agent=ua[:500] if ua else "",
        is_active=True,
    )
    db.add(session)
    db.commit()
    return session_id


def invalidate_user_sessions(user_id: int, db: Session):
    """Foydalanuvchining barcha faol sessiyalarini noaktiv qil (logout)."""
    db.query(models.UserSession).filter(
        models.UserSession.user_id == user_id,
        models.UserSession.is_active == True,
    ).update({"is_active": False})
    db.commit()


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[models.User]:
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        sid = payload.get("sid")
        if not user_id:
            return None
    except JWTError:
        return None

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        return None

    if sid:
        session = db.query(models.UserSession).filter(
            models.UserSession.user_id == user.id,
            models.UserSession.session_id == sid,
            models.UserSession.is_active == True,
        ).first()
        if not session:
            raise HTTPException(status_code=401, detail="SESSION_INVALID")

    return user


def get_user_from_token(token: str, db: Session) -> Optional[models.User]:
    """Query-param orqali berilgan raw JWT tokendan foydalanuvchini olish."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        sid = payload.get("sid")
        if not user_id:
            return None
    except JWTError:
        return None

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        return None

    if sid:
        session = db.query(models.UserSession).filter(
            models.UserSession.user_id == user.id,
            models.UserSession.session_id == sid,
            models.UserSession.is_active == True,
        ).first()
        if not session:
            return None

    return user


def require_user(current_user: Optional[models.User] = Depends(get_current_user)):
    if not current_user or not current_user.is_active:
        raise HTTPException(status_code=401, detail="Authentication required")
    return current_user


def require_admin(current_user: Optional[models.User] = Depends(get_current_user)):
    if not current_user or not current_user.is_active:
        raise HTTPException(status_code=401, detail="Authentication required")
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def require_basic(current_user: Optional[models.User] = Depends(get_current_user)):
    """Basic yoki Elite tarifga ega foydalanuvchi (admin ham kiradi)."""
    if not current_user or not current_user.is_active:
        raise HTTPException(status_code=401, detail="Authentication required")
    if current_user.role == "admin":
        return current_user
    if current_user.plan not in ("basic", "elite"):
        raise HTTPException(status_code=403, detail="PLAN_REQUIRED:basic")
    return current_user


def require_elite(current_user: Optional[models.User] = Depends(get_current_user)):
    """Faqat Elite tarifga ega foydalanuvchi (admin ham kiradi)."""
    if not current_user or not current_user.is_active:
        raise HTTPException(status_code=401, detail="Authentication required")
    if current_user.role == "admin":
        return current_user
    if current_user.plan != "elite":
        raise HTTPException(status_code=403, detail="PLAN_REQUIRED:elite")
    return current_user
