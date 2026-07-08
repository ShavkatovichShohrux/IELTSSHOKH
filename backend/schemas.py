from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime


# ─── Topics ──────────────────────────────────────────────────────────────────

class TopicCreate(BaseModel):
    name: str
    name_uz: Optional[str] = None
    color: Optional[str] = "blue"


class TopicUpdate(BaseModel):
    name: Optional[str] = None
    name_uz: Optional[str] = None
    color: Optional[str] = None


class TopicResponse(BaseModel):
    id: int
    name: str
    name_uz: Optional[str]
    color: str
    html_file: Optional[str] = ""
    created_at: datetime
    tests_count: int = 0
    model_config = {"from_attributes": True}


# ─── Vocabulary ──────────────────────────────────────────────────────────────

class VocabTopicCreate(BaseModel):
    name: str
    name_uz: Optional[str] = ""


class VocabTopicUpdate(BaseModel):
    name: Optional[str] = None
    name_uz: Optional[str] = None


class VocabTopicResponse(BaseModel):
    id: int
    name: str
    name_uz: Optional[str] = ""
    pdf_file: Optional[str] = ""
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ─── User ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class AdminUserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    role: str = "user"


# ─── Questions ───────────────────────────────────────────────────────────────

class QuestionCreate(BaseModel):
    question_number: int
    question_type: str
    question_text: Optional[str] = None
    options: Optional[Any] = None
    correct_answer: Optional[Any] = None
    feedback: Optional[str] = None


class QuestionResponse(BaseModel):
    id: int
    part_id: int
    question_number: int
    question_type: str
    question_text: Optional[str]
    options: Optional[Any]
    correct_answer: Optional[Any]
    feedback: Optional[str]
    model_config = {"from_attributes": True}


# ─── Parts ───────────────────────────────────────────────────────────────────

class PartCreate(BaseModel):
    part_number: int
    title: Optional[str] = None
    description: Optional[str] = None
    passage_text: Optional[str] = None
    questions: List[QuestionCreate] = []


class PartResponse(BaseModel):
    id: int
    test_id: int
    part_number: int
    title: Optional[str]
    description: Optional[str]
    passage_text: Optional[str]
    questions: List[QuestionResponse] = []
    model_config = {"from_attributes": True}


# ─── Tests ───────────────────────────────────────────────────────────────────

class TestCreate(BaseModel):
    title: str
    type: str
    description: Optional[str] = None
    audio_url: Optional[str] = None
    audio_filename: Optional[str] = None
    difficulty: Optional[str] = "Academic"
    is_published: Optional[bool] = True
    topic_id: Optional[int] = None
    parts: List[PartCreate] = []


class TestUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    audio_url: Optional[str] = None
    audio_filename: Optional[str] = None
    difficulty: Optional[str] = None
    is_published: Optional[bool] = None
    topic_id: Optional[int] = None
    parts: Optional[List[PartCreate]] = None


class TestListItem(BaseModel):
    id: int
    title: str
    type: str
    difficulty: str
    is_published: bool
    created_at: datetime
    parts_count: int = 0
    questions_count: int = 0
    topic_id: Optional[int] = None
    topic_name: Optional[str] = None
    topic_color: Optional[str] = None
    model_config = {"from_attributes": True}


class TestDetail(BaseModel):
    id: int
    title: str
    type: str
    description: Optional[str]
    audio_url: Optional[str]
    audio_filename: Optional[str]
    difficulty: str
    is_published: bool
    topic_id: Optional[int] = None
    created_at: datetime
    parts: List[PartResponse] = []
    model_config = {"from_attributes": True}


# ─── Results ─────────────────────────────────────────────────────────────────

class ResultCreate(BaseModel):
    test_id: int
    score: int
    total: int
    band_score: float
    answers: Any
    time_taken: Optional[int] = None


class ResultResponse(BaseModel):
    id: int
    test_id: int
    user_id: Optional[int]
    score: int
    total: int
    band_score: float
    answers: Any
    time_taken: Optional[int]
    created_at: datetime
    test_title: Optional[str] = None
    username: Optional[str] = None
    model_config = {"from_attributes": True}


# ─── Stats ───────────────────────────────────────────────────────────────────

class GlobalStats(BaseModel):
    total_users: int
    total_tests: int
    total_results: int
    avg_band_score: float
    listening_tests: int
    reading_tests: int


class TestStats(BaseModel):
    test_id: int
    test_title: str
    test_type: str
    attempts: int
    avg_score: float
    avg_band_score: float


# ─── Audio ───────────────────────────────────────────────────────────────────

class AudioFileResponse(BaseModel):
    id: int
    test_id: Optional[int]
    filename: str
    original_name: Optional[str]
    file_size: Optional[int]
    url: str
    uploaded_at: datetime
    model_config = {"from_attributes": True}
