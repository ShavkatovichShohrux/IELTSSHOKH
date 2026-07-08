import os
import secrets
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import require_admin
from database import get_db
import models

router = APIRouter()

SPEAKING_FILES_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "speaking_files"
)
os.makedirs(SPEAKING_FILES_DIR, exist_ok=True)


# ── helpers ───────────────────────────────────────────────────────────────────
def _save_html_file(original_name: str, content: bytes) -> str:
    safe = "".join(c for c in original_name if c.isalnum() or c in ".-_")
    if not safe.endswith(".html"):
        safe += ".html"
    with open(os.path.join(SPEAKING_FILES_DIR, safe), "wb") as f:
        f.write(content)
    return safe


def _read_html(filename: str) -> Optional[str]:
    path = os.path.join(SPEAKING_FILES_DIR, filename)
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as f:
        return f.read()


def _inject(html: str, tok: models.SpeakingToken) -> str:
    name = tok.buyer_name
    tg   = tok.telegram or ""
    short = tok.token[:10]

    head = f"""
<!-- IELTSSHOKH · Licensed: {name} {tg} · {short}... -->
<meta name="owner" content="{name}">
<style>
.wm-badge{{position:fixed;bottom:14px;left:50%;transform:translateX(-50%);
background:rgba(0,0,0,0.055);color:rgba(0,0,0,0.22);font-size:11px;
font-family:monospace;padding:3px 10px;border-radius:999px;pointer-events:none;
z-index:99999;user-select:none;letter-spacing:.4px;white-space:nowrap;}}
[data-theme="dark"] .wm-badge{{background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.16);}}
@media print{{body{{display:none !important;}}}}
</style>"""

    body = f"""
<div class="wm-badge">IELTSSHOKH · {name} {tg}</div>
<script>
(function(){{
document.addEventListener('contextmenu',function(e){{e.preventDefault();}});
document.addEventListener('keydown',function(e){{
var k=(e.key||'').toLowerCase(),c=e.ctrlKey||e.metaKey;
if(c&&(k==='s'||k==='u'||k==='p')){{e.preventDefault();return false;}}
if(c&&e.shiftKey&&(k==='i'||k==='j'||k==='c')){{e.preventDefault();return false;}}
if(k==='f12'){{e.preventDefault();return false;}}
}});
}})();
</script>"""

    html = html.replace("</head>", head + "</head>", 1)
    html = html.replace("</body>", body + "</body>", 1)
    return html


# ── PUBLIC: dossier ro'yxati ──────────────────────────────────────────────────
@router.get("/api/speaking/dossiers")
async def list_dossiers(db: Session = Depends(get_db)):
    rows = (
        db.query(models.SpeakingDossier)
        .filter(models.SpeakingDossier.is_published == True)
        .order_by(models.SpeakingDossier.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "title_uz": r.title_uz,
            "title_en": r.title_en,
            "title_ru": r.title_ru,
            "description_uz": r.description_uz,
            "description_en": r.description_en,
            "description_ru": r.description_ru,
            "price": r.price,
            "created_at": r.created_at,
        }
        for r in rows
    ]


# ── ADMIN: barcha dossierlar ──────────────────────────────────────────────────
@router.get("/api/speaking/dossiers/all")
async def list_all_dossiers(
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(models.SpeakingDossier)
        .order_by(models.SpeakingDossier.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "title_uz": r.title_uz,
            "title_en": r.title_en,
            "title_ru": r.title_ru,
            "description_uz": r.description_uz,
            "description_en": r.description_en,
            "description_ru": r.description_ru,
            "html_file": r.html_file,
            "price": r.price,
            "is_published": r.is_published,
            "created_at": r.created_at,
            "token_count": len(r.tokens),
        }
        for r in rows
    ]


# ── ADMIN: dossier qo'shish (HTML fayl yuklash bilan) ─────────────────────────
@router.post("/api/speaking/dossiers")
async def create_dossier(
    title_uz: str = Form(...),
    title_en: str = Form(""),
    title_ru: str = Form(""),
    description_uz: str = Form(""),
    description_en: str = Form(""),
    description_ru: str = Form(""),
    price: str = Form(""),
    html_file: Optional[UploadFile] = File(None),
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    saved_name = ""
    if html_file and html_file.filename:
        saved_name = _save_html_file(html_file.filename, await html_file.read())

    d = models.SpeakingDossier(
        title_uz=title_uz, title_en=title_en, title_ru=title_ru,
        description_uz=description_uz, description_en=description_en,
        description_ru=description_ru, html_file=saved_name, price=price,
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return {"id": d.id, "title_uz": d.title_uz, "html_file": d.html_file}


# ── ADMIN: mavjud dossierga HTML fayl yuklash / yangilash ─────────────────────
@router.post("/api/speaking/dossiers/{id}/upload")
async def upload_dossier_file(
    id: int,
    html_file: UploadFile = File(...),
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    d = db.query(models.SpeakingDossier).filter(models.SpeakingDossier.id == id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dossier topilmadi.")

    if d.html_file:
        old_path = os.path.join(SPEAKING_FILES_DIR, d.html_file)
        if os.path.exists(old_path):
            os.remove(old_path)

    d.html_file = _save_html_file(html_file.filename, await html_file.read())
    db.commit()
    return {"html_file": d.html_file}


# ── ADMIN: dossier publish/unpublish ─────────────────────────────────────────
@router.put("/api/speaking/dossiers/{id}/publish")
async def toggle_publish(
    id: int,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    d = db.query(models.SpeakingDossier).filter(models.SpeakingDossier.id == id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Topilmadi.")
    d.is_published = not d.is_published
    db.commit()
    return {"is_published": d.is_published}


# ── ADMIN: dossier o'chirish ──────────────────────────────────────────────────
@router.delete("/api/speaking/dossiers/{id}")
async def delete_dossier(
    id: int,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    d = db.query(models.SpeakingDossier).filter(models.SpeakingDossier.id == id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Topilmadi.")
    if d.html_file:
        path = os.path.join(SPEAKING_FILES_DIR, d.html_file)
        if os.path.exists(path):
            os.remove(path)
    db.delete(d)
    db.commit()
    return {"message": "O'chirildi."}


# ── PUBLIC: token orqali HTML xizmat qilish ───────────────────────────────────
@router.get("/s/{token}", response_class=HTMLResponse, include_in_schema=False)
async def serve_speaking(token: str, db: Session = Depends(get_db)):
    tok = (
        db.query(models.SpeakingToken)
        .filter(models.SpeakingToken.token == token, models.SpeakingToken.is_active == True)
        .first()
    )
    if not tok:
        raise HTTPException(status_code=403, detail="Token yaroqsiz yoki topilmadi.")
    if tok.expires_at and datetime.utcnow() > tok.expires_at.replace(tzinfo=None):
        raise HTTPException(status_code=403, detail="Token muddati tugagan.")
    if tok.max_views > 0 and tok.view_count >= tok.max_views:
        raise HTTPException(status_code=403, detail="Ko'rish limiti tugagan.")

    html = _read_html(tok.html_file)
    if html is None:
        raise HTTPException(status_code=404, detail="Kontent topilmadi.")

    tok.view_count += 1
    tok.last_viewed_at = datetime.utcnow()
    db.commit()
    return HTMLResponse(content=_inject(html, tok))


# ── ADMIN: token yaratish ─────────────────────────────────────────────────────
class TokenCreate(BaseModel):
    buyer_name: str
    telegram: str = ""
    dossier_id: int
    max_views: int = 0


@router.post("/api/speaking/tokens")
async def create_token(
    body: TokenCreate,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    d = db.query(models.SpeakingDossier).filter(models.SpeakingDossier.id == body.dossier_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dossier topilmadi.")

    token = secrets.token_urlsafe(32)
    new = models.SpeakingToken(
        token=token, buyer_name=body.buyer_name, telegram=body.telegram,
        html_file=d.html_file, dossier_id=d.id, max_views=body.max_views,
    )
    db.add(new)
    db.commit()
    db.refresh(new)
    return {
        "token": token,
        "url": f"/s/{token}",
        "buyer_name": body.buyer_name,
        "telegram": body.telegram,
        "dossier": d.title_uz,
    }


# ── ADMIN: tokenlar ro'yxati ──────────────────────────────────────────────────
@router.get("/api/speaking/tokens")
async def list_tokens(
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(models.SpeakingToken)
        .order_by(models.SpeakingToken.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "token": r.token,
            "buyer_name": r.buyer_name,
            "telegram": r.telegram,
            "dossier": r.dossier.title_uz if r.dossier else r.html_file,
            "is_active": r.is_active,
            "view_count": r.view_count,
            "max_views": r.max_views,
            "created_at": r.created_at,
            "last_viewed_at": r.last_viewed_at,
        }
        for r in rows
    ]


# ── ADMIN: tokenni bloklash ───────────────────────────────────────────────────
@router.delete("/api/speaking/tokens/{token}")
async def revoke_token(
    token: str,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    tok = db.query(models.SpeakingToken).filter(models.SpeakingToken.token == token).first()
    if not tok:
        raise HTTPException(status_code=404, detail="Token topilmadi.")
    tok.is_active = False
    db.commit()
    return {"message": f"{tok.buyer_name} tokeni bloklandi."}
