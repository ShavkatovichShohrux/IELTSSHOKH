import os
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import HTMLResponse, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models
from auth import require_admin, get_current_user, get_user_from_token, require_basic

router = APIRouter()

QT_FILES_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "qt_files"
)
os.makedirs(QT_FILES_DIR, exist_ok=True)


def _save_file(original_name: str, content: bytes) -> str:
    safe = "".join(c for c in original_name if c.isalnum() or c in ".-_")
    lower = safe.lower()
    if not lower.endswith(".html") and not lower.endswith(".pdf"):
        safe += ".html"
    with open(os.path.join(QT_FILES_DIR, safe), "wb") as f:
        f.write(content)
    return safe


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


def _to_resp(qt: models.QuestionType) -> dict:
    return {
        "id": qt.id,
        "name": qt.name,
        "name_uz": qt.name_uz or "",
        "html_file": qt.html_file or "",
        "order": qt.order or 0,
        "is_published": qt.is_published,
        "created_at": qt.created_at,
    }


# ── Student: published list ───────────────────────────────────────────────────
@router.get("/", response_model=List[dict])
def list_question_types(db: Session = Depends(get_db), _=Depends(require_basic)):
    rows = (
        db.query(models.QuestionType)
        .filter(models.QuestionType.is_published == True)
        .order_by(models.QuestionType.order, models.QuestionType.name)
        .all()
    )
    return [_to_resp(r) for r in rows]


# ── Student: view content (HTML or PDF) ──────────────────────────────────────
@router.get("/{qt_id}/content", include_in_schema=False)
def view_content(
    qt_id: int,
    t: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    user = get_user_from_token(t or "", db)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Kirish talab qilinadi")
    if user.role != "admin" and user.plan not in ("basic", "elite"):
        raise HTTPException(status_code=403, detail="PLAN_REQUIRED:basic")

    qt = db.query(models.QuestionType).filter(models.QuestionType.id == qt_id).first()
    if not qt:
        raise HTTPException(status_code=404, detail="Topilmadi")
    if not qt.html_file:
        raise HTTPException(status_code=404, detail="Fayl yo'q")

    path = os.path.join(QT_FILES_DIR, qt.html_file)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Fayl topilmadi")

    if qt.html_file.lower().endswith(".pdf"):
        with open(path, "rb") as f:
            data = f.read()
        return Response(
            content=data,
            media_type="application/pdf",
            headers={"Content-Disposition": f'inline; filename="{qt.html_file}"'},
        )

    with open(path, encoding="utf-8") as f:
        html = f.read()
    return HTMLResponse(content=_inject_watermark(html, user.username))


# ── Admin: all list ───────────────────────────────────────────────────────────
@router.get("/all", response_model=List[dict])
def list_all(db: Session = Depends(get_db), _=Depends(require_admin)):
    rows = (
        db.query(models.QuestionType)
        .order_by(models.QuestionType.order, models.QuestionType.name)
        .all()
    )
    return [_to_resp(r) for r in rows]


# ── Admin: create ─────────────────────────────────────────────────────────────
@router.post("/", response_model=dict)
def create_qt(
    name: str = Query(...),
    name_uz: str = Query(""),
    order: int = Query(0),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    qt = models.QuestionType(name=name, name_uz=name_uz, order=order)
    db.add(qt)
    db.commit()
    db.refresh(qt)
    return _to_resp(qt)


# ── Admin: upload HTML or PDF ─────────────────────────────────────────────────
@router.post("/{qt_id}/upload", response_model=dict)
async def upload_file(
    qt_id: int,
    html_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    fname = html_file.filename or ""
    if not (fname.lower().endswith(".html") or fname.lower().endswith(".pdf")):
        raise HTTPException(status_code=400, detail="Faqat .html yoki .pdf fayl qabul qilinadi")

    qt = db.query(models.QuestionType).filter(models.QuestionType.id == qt_id).first()
    if not qt:
        raise HTTPException(status_code=404, detail="Topilmadi")

    if qt.html_file:
        old = os.path.join(QT_FILES_DIR, qt.html_file)
        if os.path.exists(old):
            os.remove(old)

    qt.html_file = _save_file(fname, await html_file.read())
    db.commit()
    db.refresh(qt)
    return _to_resp(qt)


# ── Admin: update ─────────────────────────────────────────────────────────────
@router.put("/{qt_id}", response_model=dict)
def update_qt(
    qt_id: int,
    name: Optional[str] = Query(None),
    name_uz: Optional[str] = Query(None),
    order: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    qt = db.query(models.QuestionType).filter(models.QuestionType.id == qt_id).first()
    if not qt:
        raise HTTPException(status_code=404, detail="Topilmadi")
    if name is not None:
        qt.name = name
    if name_uz is not None:
        qt.name_uz = name_uz
    if order is not None:
        qt.order = order
    db.commit()
    db.refresh(qt)
    return _to_resp(qt)


# ── Admin: toggle publish ─────────────────────────────────────────────────────
@router.put("/{qt_id}/publish", response_model=dict)
def toggle_publish(qt_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    qt = db.query(models.QuestionType).filter(models.QuestionType.id == qt_id).first()
    if not qt:
        raise HTTPException(status_code=404, detail="Topilmadi")
    qt.is_published = not qt.is_published
    db.commit()
    db.refresh(qt)
    return _to_resp(qt)


# ── Admin: delete ─────────────────────────────────────────────────────────────
@router.delete("/{qt_id}")
def delete_qt(qt_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    qt = db.query(models.QuestionType).filter(models.QuestionType.id == qt_id).first()
    if not qt:
        raise HTTPException(status_code=404, detail="Topilmadi")
    if qt.html_file:
        path = os.path.join(QT_FILES_DIR, qt.html_file)
        if os.path.exists(path):
            os.remove(path)
    db.delete(qt)
    db.commit()
    return {"ok": True}
