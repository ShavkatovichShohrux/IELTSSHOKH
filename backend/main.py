import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from dotenv import load_dotenv

from database import engine, Base
from routers import tests, users, results, audio, topics, speaking, vocab

load_dotenv()
Base.metadata.create_all(bind=engine)

# SQLite migration: add topic_id column to tests if it doesn't exist yet
try:
    with engine.connect() as _conn:
        _cols = [row[1] for row in _conn.execute(text("PRAGMA table_info(tests)")).fetchall()]
        if "topic_id" not in _cols:
            _conn.execute(text("ALTER TABLE tests ADD COLUMN topic_id INTEGER"))
            _conn.commit()
except Exception as _e:
    print(f"[migration] topic_id column: {_e}")

try:
    with engine.connect() as _conn:
        _cols = [row[1] for row in _conn.execute(text("PRAGMA table_info(speaking_tokens)")).fetchall()]
        if "dossier_id" not in _cols:
            _conn.execute(text("ALTER TABLE speaking_tokens ADD COLUMN dossier_id INTEGER"))
            _conn.commit()
except Exception as _e:
    print(f"[migration] dossier_id column: {_e}")

try:
    with engine.connect() as _conn:
        _cols = [row[1] for row in _conn.execute(text("PRAGMA table_info(topics)")).fetchall()]
        if "html_file" not in _cols:
            _conn.execute(text("ALTER TABLE topics ADD COLUMN html_file VARCHAR(200) DEFAULT ''"))
            _conn.commit()
except Exception as _e:
    print(f"[migration] topics.html_file column: {_e}")

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="IELTS Platform API",
    description="IELTSSHOKH — Professional IELTS Practice Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url=None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


os.makedirs("uploads/audio", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(tests.router, prefix="/api/tests", tags=["Tests"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(results.router, prefix="/api/results", tags=["Results"])
app.include_router(audio.router, prefix="/api/audio", tags=["Audio"])
app.include_router(topics.router, prefix="/api/topics", tags=["Topics"])
app.include_router(speaking.router, tags=["Speaking"])
app.include_router(vocab.router, prefix="/api/vocab", tags=["Vocabulary"])


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "IELTS Platform v1.0"}
