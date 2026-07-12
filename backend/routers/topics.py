import os
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas
from auth import require_admin, get_current_user, get_user_from_token, require_basic

router = APIRouter()

TOPIC_FILES_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "topic_files"
)
os.makedirs(TOPIC_FILES_DIR, exist_ok=True)


def _save_topic_file(original_name: str, content: bytes) -> str:
    safe = "".join(c for c in original_name if c.isalnum() or c in ".-_")
    if not safe.endswith(".html"):
        safe += ".html"
    with open(os.path.join(TOPIC_FILES_DIR, safe), "wb") as f:
        f.write(content)
    return safe


def _topic_resp(t: models.Topic) -> schemas.TopicResponse:
    return schemas.TopicResponse(
        id=t.id,
        name=t.name,
        name_uz=t.name_uz,
        color=t.color or "blue",
        html_file=t.html_file or "",
        created_at=t.created_at,
        tests_count=len(t.tests),
    )


def _inject_watermark(html: str, username: str) -> str:
    badge = f"""
<style>
.wm{{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);
background:rgba(0,0,0,0.06);color:rgba(0,0,0,0.25);font-size:11px;
font-family:monospace;padding:3px 10px;border-radius:999px;pointer-events:none;
z-index:99999;user-select:none;white-space:nowrap;}}
@media print{{body{{display:none!important;}}}}
</style>
<div class="wm">IELTSSHOKH · {username}</div>
<script>
(function(){{
document.addEventListener('contextmenu',function(e){{e.preventDefault();}});
document.addEventListener('keydown',function(e){{
var k=(e.key||'').toLowerCase(),c=e.ctrlKey||e.metaKey;
if(c&&(k==='s'||k==='u'||k==='p')){{e.preventDefault();}}
if(c&&e.shiftKey&&['i','j','c'].includes(k)){{e.preventDefault();}}
if(k==='f12'){{e.preventDefault();}}
}});
}})();
</script>"""
    if "</body>" in html:
        return html.replace("</body>", badge + "</body>", 1)
    return html + badge


@router.get("/{topic_id}/content", response_class=HTMLResponse, include_in_schema=False)
def view_topic_content(
    topic_id: int,
    t: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    user = get_user_from_token(t or "", db)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Kirish talab qilinadi")
    if user.role != "admin" and user.plan not in ("basic", "elite"):
        raise HTTPException(status_code=403, detail="PLAN_REQUIRED:basic")

    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic topilmadi")
    if not topic.html_file:
        raise HTTPException(status_code=404, detail="Bu topicda HTML fayl yo'q")
    path = os.path.join(TOPIC_FILES_DIR, topic.html_file)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Fayl topilmadi")
    with open(path, encoding="utf-8") as f:
        html = f.read()
    return HTMLResponse(content=_inject_watermark(html, user.username))


@router.get("/", response_model=List[schemas.TopicResponse])
def list_topics(db: Session = Depends(get_db), _=Depends(require_basic)):
    topics = db.query(models.Topic).order_by(models.Topic.name).all()
    return [_topic_resp(t) for t in topics]


@router.post("/", response_model=schemas.TopicResponse)
def create_topic(data: schemas.TopicCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(models.Topic).filter(models.Topic.name == data.name).first():
        raise HTTPException(status_code=400, detail="Bu nom bilan topic allaqachon mavjud")
    topic = models.Topic(name=data.name, name_uz=data.name_uz, color=data.color or "blue", html_file="")
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return _topic_resp(topic)


@router.post("/{topic_id}/upload", response_model=schemas.TopicResponse)
async def upload_topic_file(
    topic_id: int,
    html_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic topilmadi")

    if topic.html_file:
        old_path = os.path.join(TOPIC_FILES_DIR, topic.html_file)
        if os.path.exists(old_path):
            os.remove(old_path)

    topic.html_file = _save_topic_file(html_file.filename, await html_file.read())
    db.commit()
    db.refresh(topic)
    return _topic_resp(topic)


@router.put("/{topic_id}", response_model=schemas.TopicResponse)
def update_topic(topic_id: int, data: schemas.TopicUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic topilmadi")
    if data.name is not None:
        existing = db.query(models.Topic).filter(models.Topic.name == data.name, models.Topic.id != topic_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Bu nom bilan topic allaqachon mavjud")
        topic.name = data.name
    if data.name_uz is not None:
        topic.name_uz = data.name_uz
    if data.color is not None:
        topic.color = data.color
    db.commit()
    db.refresh(topic)
    return _topic_resp(topic)


@router.delete("/{topic_id}")
def delete_topic(topic_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic topilmadi")
    if topic.html_file:
        path = os.path.join(TOPIC_FILES_DIR, topic.html_file)
        if os.path.exists(path):
            os.remove(path)
    db.query(models.Test).filter(models.Test.topic_id == topic_id).update({"topic_id": None})
    db.delete(topic)
    db.commit()
    return {"ok": True}
