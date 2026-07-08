"""Admin parolini 'admin' ga, student foydalanuvchi qo'shish."""
from database import SessionLocal, engine, Base
import models
from auth import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Admin parolini yangilash
admin = db.query(models.User).filter(models.User.username == "admin").first()
if admin:
    admin.password_hash = hash_password("admin")
    print("OK Admin paroli yangilandi: admin / admin")
else:
    admin = models.User(
        username="admin",
        email="admin@ieltsshokh.uz",
        password_hash=hash_password("admin"),
        role="admin",
        is_active=True,
    )
    db.add(admin)
    print("OK Admin yaratildi: admin / admin")

# Student foydalanuvchi
student = db.query(models.User).filter(models.User.username == "student").first()
if student:
    student.password_hash = hash_password("student")
    student.is_active = True
    print("OK Student paroli yangilandi: student / student")
else:
    student = models.User(
        username="student",
        email="student@ieltsshokh.uz",
        password_hash=hash_password("student"),
        role="user",
        is_active=True,
    )
    db.add(student)
    print("OK Student yaratildi: student / student")

db.commit()
db.close()
print("\n--- Kirish ma'lumotlari ---")
print("Admin:   username=admin    password=admin")
print("Student: username=student  password=student")
