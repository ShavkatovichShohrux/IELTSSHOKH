# IELTSSHOKH

Owner: IELTSSHOKH (Telegram @ieltsshokh, site ieltsshokhspeaking.uz). Replies in Uzbek.

Working style the owner asked for: when a request is short or unclear, do not stop to ask. First look
for the answer yourself (uploaded files in this chat, this repo and its git history, the skill, the
public channel t.me/s/ieltsshokh), pick the most likely meaning, do the work, and state the
assumption in one line. Ask only when the needed file is truly unreachable from this session
(e.g. it sits in the owner's Windows Downloads folder and no computer folder is connected).

- `backend/`, `frontend/` — the ieltsshokhspeaking.uz app. Pushing to `main` deploys to production (`.github/workflows/deploy.yml`).
- Root `reading_*.html`, `test_*.html`, `index.html` — standalone IELTS practice pages.

## Making Reading / Listening test HTML

Always use the skill in `.claude/skills/ielts-shokh-html/` (read its `SKILL.md`).
It holds the house design (v7) as templates and a builder:

```bash
python3 .claude/skills/ielts-shokh-html/scripts/build_reading.py .claude/skills/ielts-shokh-html/specs/<test>.json reading_<name>.html
```

Do not hand-write a new design for these pages.
