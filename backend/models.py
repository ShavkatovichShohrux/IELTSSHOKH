from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base



class Topic(Base):
    __tablename__ = "topics"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    name_uz = Column(String(100))
    color = Column(String(20), default="blue")
    html_file = Column(String(200), default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    tests = relationship("Test", back_populates="topic")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user")       # admin | user
    plan = Column(String(20), default="none")       # none | basic | elite
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    results = relationship("Result", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")


class UserSession(Base):
    __tablename__ = "user_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String(64), unique=True, index=True, nullable=False)
    ip_address = Column(String(45), default="")
    user_agent = Column(String(500), default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="sessions")


class Test(Base):
    __tablename__ = "tests"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    type = Column(String(20), nullable=False)        # listening | reading
    description = Column(Text)
    audio_url = Column(String(500))
    audio_filename = Column(String(200))
    difficulty = Column(String(20), default="Academic")
    is_published = Column(Boolean, default=True)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    topic = relationship("Topic", back_populates="tests")
    parts = relationship("Part", back_populates="test", cascade="all, delete-orphan",
                         order_by="Part.part_number")
    results = relationship("Result", back_populates="test")


class Part(Base):
    __tablename__ = "parts"
    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id", ondelete="CASCADE"), nullable=False)
    part_number = Column(Integer, nullable=False)
    title = Column(String(200))
    description = Column(Text)
    passage_text = Column(Text)        # HTML content for reading passages
    test = relationship("Test", back_populates="parts")
    questions = relationship("Question", back_populates="part", cascade="all, delete-orphan",
                             order_by="Question.question_number")


class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    part_id = Column(Integer, ForeignKey("parts.id", ondelete="CASCADE"), nullable=False)
    question_number = Column(Integer, nullable=False)
    question_type = Column(String(30), nullable=False)   # text|radio|select|multi_select|tfng|match
    question_text = Column(Text)
    options = Column(Text)            # JSON array/object
    correct_answer = Column(Text)     # JSON value
    feedback = Column(Text)
    part = relationship("Part", back_populates="questions")


class Result(Base):
    __tablename__ = "results"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    score = Column(Integer, nullable=False)
    total = Column(Integer, nullable=False)
    band_score = Column(Float, nullable=False)
    answers = Column(Text, nullable=False)    # JSON
    time_taken = Column(Integer)              # seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="results")
    test = relationship("Test", back_populates="results")


class AudioFile(Base):
    __tablename__ = "audio_files"
    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=True)
    filename = Column(String(200), nullable=False)
    original_name = Column(String(200))
    file_path = Column(String(500))
    file_size = Column(Integer)
    url = Column(String(500))
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())


class VocabTopic(Base):
    __tablename__ = "vocab_topics"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    name_uz = Column(String(100), default="")
    pdf_file = Column(String(200), default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class QuestionType(Base):
    __tablename__ = "question_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    name_uz = Column(String(200), default="")
    html_file = Column(String(200), default="")
    order = Column(Integer, default=0)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SiteSettings(Base):
    __tablename__ = "site_settings"
    id = Column(Integer, primary_key=True, default=1)
    card_number = Column(String(50), default="")
    card_holder = Column(String(100), default="")
    basic_name = Column(String(50), default="Basic")
    elite_name = Column(String(50), default="Elite")
    basic_price = Column(String(50), default="")
    elite_price = Column(String(50), default="")
    telegram_username = Column(String(100), default="shokh_shavkatovich")
    payment_note = Column(Text, default="")
    updated_at = Column(DateTime(timezone=True), server_default=func.now())


class SpeakingDossier(Base):
    __tablename__ = "speaking_dossiers"
    id = Column(Integer, primary_key=True, index=True)
    title_uz = Column(String(200), nullable=False)
    title_en = Column(String(200), default="")
    title_ru = Column(String(200), default="")
    description_uz = Column(Text, default="")
    description_en = Column(Text, default="")
    description_ru = Column(Text, default="")
    html_file = Column(String(200), nullable=False)
    price = Column(String(50), default="")
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    tokens = relationship("SpeakingToken", back_populates="dossier")


class SpeakingToken(Base):
    __tablename__ = "speaking_tokens"
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(64), unique=True, index=True, nullable=False)
    buyer_name = Column(String(100), nullable=False)
    telegram = Column(String(100), default="")
    html_file = Column(String(200), default="default.html")
    dossier_id = Column(Integer, ForeignKey("speaking_dossiers.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    view_count = Column(Integer, default=0)
    max_views = Column(Integer, default=0)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_viewed_at = Column(DateTime(timezone=True), nullable=True)
    dossier = relationship("SpeakingDossier", back_populates="tokens")
