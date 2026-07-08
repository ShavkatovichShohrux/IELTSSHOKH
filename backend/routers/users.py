from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from auth import require_admin, require_user, hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()


@router.post("/auth/login", response_model=schemas.Token)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == data.username).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Username yoki parol noto'g'ri")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Hisobingiz bloklangan")
    token = create_access_token({"sub": str(user.id)})
    return schemas.Token(access_token=token, user=schemas.UserResponse.model_validate(user))


@router.post("/auth/register", response_model=schemas.Token)
def register(data: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Bu username band")
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Bu email allaqachon ro'yxatdan o'tgan")
    user = models.User(
        username=data.username, email=data.email,
        password_hash=hash_password(data.password), role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return schemas.Token(access_token=token, user=schemas.UserResponse.model_validate(user))


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user=Depends(require_user)):
    return current_user


@router.post("/", response_model=schemas.UserResponse)
def admin_create_user(
    data: schemas.AdminUserCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    if db.query(models.User).filter(models.User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Bu username band")
    email = (data.email or "").strip() or f"{data.username}@ieltsshokh.uz"
    if db.query(models.User).filter(models.User.email == email).first():
        email = f"{data.username}_{models.User.__table__.c.id}@ieltsshokh.uz"
    user = models.User(
        username=data.username.strip(),
        email=email,
        password_hash=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/", response_model=List[schemas.UserResponse])
def list_users(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    return db.query(models.User).order_by(models.User.created_at.desc()).all()


@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int, data: schemas.UserUpdate,
    db: Session = Depends(get_db), current_user=Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    update = data.model_dump(exclude_unset=True)
    if "password" in update:
        update["password_hash"] = hash_password(update.pop("password"))
    for k, v in update.items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="O'z hisobingizni o'chira olmaysiz")
    db.delete(user)
    db.commit()
    return {"message": "Deleted"}
