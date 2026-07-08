"""Run once: python seed.py"""
import json
from database import SessionLocal, engine, Base
import models
from auth import hash_password

Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    if db.query(models.User).filter(models.User.role == "admin").first():
        print("Admin already exists. Skipping.")
        db.close()
        return

    # Admin user
    admin = models.User(
        username="admin",
        email="admin@ieltsshokh.uz",
        password_hash=hash_password("Admin@123"),
        role="admin",
        is_active=True,
    )
    db.add(admin)

    # Sample listening test
    test = models.Test(
        title="Cambridge 21 Test 1",
        type="listening",
        description="IELTS Academic Listening — Cambridge 21 Test 1",
        audio_url="https://shavkatovichshohrux.github.io/ielts-audio/c21t1.mp3",
        difficulty="Academic",
        is_published=True,
    )
    db.add(test)
    db.flush()

    parts_data = [
        {
            "part_number": 1,
            "title": "International Club",
            "description": "Questions 1–10: Complete the notes below.",
            "questions": [
                {"n": 1, "type": "text", "text": "Date joined: _____", "ans": "March", "fb": ""},
                {"n": 2, "type": "text", "text": "Last name: _____", "ans": "Kowalski", "fb": ""},
                {"n": 3, "type": "text", "text": "Come alone or with: _____", "ans": "Partner", "fb": ""},
                {"n": 4, "type": "text", "text": "Meeting day: _____", "ans": "Thursday", "fb": ""},
                {"n": 5, "type": "text", "text": "First event at: _____", "ans": "7.30", "fb": ""},
                {"n": 6, "type": "text", "text": "Event location: _____", "ans": "Hall", "fb": ""},
                {"n": 7, "type": "text", "text": "Bring: _____", "ans": "shoes", "fb": ""},
                {"n": 8, "type": "text", "text": "Contact name: _____", "ans": "Helen", "fb": ""},
                {"n": 9, "type": "text", "text": "Newsletter frequency: _____", "ans": "weekly", "fb": ""},
                {"n": 10, "type": "text", "text": "Fee (per term): £_____", "ans": "15", "fb": ""},
            ],
        },
        {
            "part_number": 2,
            "title": "City Tour",
            "description": "Questions 11–20",
            "questions": [
                {"n": 11, "type": "radio", "text": "What does the guide say about the castle?",
                 "opts": [{"label": "A", "text": "It is now a hotel"}, {"label": "B", "text": "It has a famous garden"}, {"label": "C", "text": "It is open all year"}],
                 "ans": "B", "fb": ""},
                {"n": 12, "type": "radio", "text": "The art gallery is closed on:",
                 "opts": [{"label": "A", "text": "Mondays"}, {"label": "B", "text": "Tuesdays"}, {"label": "C", "text": "Sundays"}],
                 "ans": "A", "fb": ""},
            ],
        },
    ]

    for pd in parts_data:
        part = models.Part(
            test_id=test.id, part_number=pd["part_number"],
            title=pd["title"], description=pd["description"],
        )
        db.add(part)
        db.flush()
        for qd in pd["questions"]:
            db.add(models.Question(
                part_id=part.id,
                question_number=qd["n"],
                question_type=qd["type"],
                question_text=qd["text"],
                options=json.dumps(qd.get("opts")) if qd.get("opts") else None,
                correct_answer=json.dumps(qd["ans"]),
                feedback=qd.get("fb", ""),
            ))

    db.commit()
    print("✅ Seed completed!")
    print("   Admin: username=admin  password=Admin@123")
    print("   ⚠️  Change password after first login!")
    db.close()


if __name__ == "__main__":
    seed()
