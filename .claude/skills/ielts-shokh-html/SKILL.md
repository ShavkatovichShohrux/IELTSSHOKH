---
name: ielts-shokh-html
description: Build IELTSSHOKH (t.me/ieltsshokh) interactive IELTS test pages as single HTML files in the house design — Reading (1 passage or full 3-passage test) and Listening (CDI mock with embedded audio). Use whenever the user sends a Reading/Listening PDF, text or screenshots and asks to "html qil", "tayyorla", "reading html", "listening html", "mock qil", or to fix/redo one of these pages. Also covers the "Possible predictions" Telegram post with hidden links.
---

# IELTSSHOKH test HTML (Reading & Listening)

The user (IELTSSHOKH, Telegram channel @ieltsshokh) publishes IELTS practice tests as
**one self-contained `.html` file** in a fixed house design. Never invent a new design:
always build from the templates in this folder. A page that "looks different" from
`sh_kh - CDI Full Mock Listening v7.html` / `sh_kh - Authentic Reading 2.html` is wrong.

The user writes in Uzbek (often fast, with typos). Answer in Uzbek.

## Files

| Path | What |
|---|---|
| `templates/reading_shell.html` | Reading shell (v7 design). Placeholders: `{{TITLE}} {{HD_SUB}} {{MINUTES}} {{QCOUNT}} {{PASSAGES}} {{QUESTIONS}} {{PTABS}} {{RESULT_TITLE}} {{DATA}}`. Do not edit by hand. |
| `templates/listening_v7_shell.html` | The Listening v7 file with the MP3 replaced by `{{AUDIO_SRC}}` (reference for listening tests). |
| `scripts/build_reading.py` | `python3 scripts/build_reading.py specs/<test>.json <out>.html` builds a Reading test. |
| `scripts/make_reading_shell_from_listening.py` | Re-derives `reading_shell.html` when the user sends a newer Listening design (v8...). |
| `scripts/build_pdf.py` | `python3 scripts/build_pdf.py specs/<test>.json "sh_kh - REAL EXAMS V10 Reading Test 07"` writes `<base> - Questions.pdf` and `<base> - Answers.pdf`. |
| `assets/shokh_logo.png` | shokh logo used in the PDF header and cover. |
| `specs/real_exams_v10_t07.json` | Full worked example (3 passages, every question type). Copy it as the starting point. |

Built tests go in the repository root as `reading_<source>_<test>.html`
(e.g. `reading_realexams_v10_t07.html`), next to the older `reading_c21_t*.html`.

## House design (what the shell already contains — keep it)

- Welcome overlay: logo, "IELTS**SHOKH**", motivation line *Study In Monster Mode, Achieve Monster Results.*, Synonyms Pack link (t.me/ieltsshokh/4007), **Start Reading →**, ieltsshokhspeaking.uz link. Start opens full screen (ShkhFS).
- Header: red `IELTS™` logo, timer pill (60:00 full test, 20:00 one passage) with hide button, MAIN GRID (t.me/ieltsshokh), full screen, light/dark toggle, **Submit**, IELTSSHOKH logo.
- Split layout: passage left, questions right, draggable divider; stacks on phones.
- Footer: Passage tabs, question pills 1–40 (blue when answered), ‹ › navigation.
- Highlight tool: select text → "Highlight".
- After submit: result modal (score, %, correct/incorrect/not answered, per-passage boxes, approx. band, Synonyms strip, Speaking link) → "Review answers & analysis": evidence sentences turn green with question-number tags, keyword→paraphrase table, question-by-question feedback cards.

## Reading workflow

1. **Read the whole source** (PDF pages, all of them). Copy passage text exactly; only fix obvious
   extraction errors (broken lines, missing words like "alternatives **in** employment", "young
   **males**"). Drop source watermarks such as "@IELTS_Volume" / "Source copy supplied by the user".
2. **Write the spec** (copy `specs/real_exams_v10_t07.json`):
   - `passages[].paras`: `["A", "text"]` or `["", "text"]` when paragraphs have no letters.
     Mark the answer evidence with `{{ev:N}}...{{/ev}}` (may nest: `{{ev:30}}{{ev:38}}...{{/ev}}{{/ev}}`).
     Every question needs at least one evidence span.
   - `groups[].type`:
     - `tfng` with `"mode": "TFNG"` or `"YNNG"` (legend added automatically)
     - `chip` — paragraph / person / feature matching; `"letters": "ABCDE"`; optional `"box"` list
     - `mc` — one answer from options (`items[].options`)
     - `multi` — choose TWO/THREE: `options`, `question`, one item per number (`ans` = one letter each, any order is accepted)
     - `notes` — notes/summary/table completion: `"title"` + `"prose"` or `"sections":[{"h","lines"}]`, gaps written `{N}`
     - `short` — short-answer questions with an input under each
   - Each item: `n`, `ans`, `accept` (all acceptable spellings, lower case: `["100","one hundred"]`),
     `kw` = `[keyword in the question, paraphrase in the passage]`, `ev` = quoted evidence,
     `ex` = one-line explanation ending in the bold answer; for gaps also `stmt` (the sentence with `___`).
3. **Build**: `python3 .claude/skills/ielts-shokh-html/scripts/build_reading.py <spec> reading_<name>.html`
4. **Test in Chromium (Playwright)** before giving the file: click Start, answer a few questions of
   every type on every passage, Submit (accept the confirm dialog), check the score per passage,
   that `.ans-ev.hl-answer` exists for every question, 40 feedback cards, no console errors, no
   horizontal scroll at 390px, light and dark. Fix and rebuild until clean.
5. **Answer key honesty**: if the source has no key, you solved it yourself. Say so, and name the
   doubtful items (in Test 07: Q30 and Q38–40). Never present a self-made key as official.
6. Deliver the file (SendUserFile, `display: "render"` so it opens in the panel) and commit it.

## Printable PDFs (Questions + Answers)

Reference: the owner's `sh_kh - REAL EXAMS V10 Listening Test 09 - Questions.pdf` / `- Answers.pdf`.
`build_pdf.py` reproduces that style from the same JSON spec, for Reading and Listening:
- Arial only, black/grey, no cover page. Small centred shokh logo at the top of every page;
  footer `t.me/ieltsshokh | IELTSSHOKH | Page N`.
- Questions: page 1 = "READING TEST" / "LISTENING TEST", series in italics ("REAL EXAMS Volume 10 Test 07"),
  bold "40 questions · 60 minutes", Name / Date / Score ___ / 40 box, italic lead line, then the test.
  Grey letter-spaced "READING PASSAGE 1" / "LISTENING PART 1" labels, "Questions 1–5" headings,
  italic instructions, boxed notes with centred title and ruled sub-headings, gaps "(6) ______".
  Reading: passage text first, its questions on the next page.
- Answers: title block "· Answer Key", italic "Also accepted: ..." line (from `accept`), "Answers"
  boxes per passage/part, band table, then "ANALYSIS" with one entry per question
  (`N answer stmt` / `Keyword: kw → passage|heard: ...` / italic quote / explanation), grey left rule.
- Spec needs `"pdf": {"kind": "reading"|"listening", "test_title", "series", "meta", "lead"}`.
- File names: `sh_kh - REAL EXAMS V10 Reading Test 07 - Questions.pdf` (PDFs are git-ignored; send them as files).
- Check every page as images (pdftoppm) before sending.

## Listening workflow

Start from `templates/listening_v7_shell.html`: replace the question groups `#qg0..#qg3`
(same card markup as Reading: `tfng`, `chip`, `mc`, `multi` with `data-qs`, inline `.ti-input` gaps),
the data block (`ANS ACCEPT QNUMS GROUPS PAIR KW FB`), and `{{AUDIO_SRC}}` with
`data:audio/mpeg;base64,...` of the user's MP3. In listening `ev` is what the speaker says.

## Grading rules built into the engine

- Gap answers: trimmed, lower-cased, spaces collapsed, then matched against `accept`.
- `multi` (choose N): each correct letter scores one mark (IELTS rule); the shell supports any N.
- Band: Academic Reading table (39→9, 37→8.5, 35→8, 33→7.5, 30→7, 27→6.5, 23→6, 19→5.5, 15→5, 13→4.5, 10→4).

## Telegram "Possible predictions" post

When asked for the next topics list (e.g. "37 dan keyingilarni top"): the channel post
`t.me/ieltsshokh/4888` lists 1–37; Reading posts are captioned
"CDI | AUTHENTIC READING MOCK | Real Exam | Passage N / Full Test → <topic>". Read the public
preview `https://t.me/s/ieltsshokh?before=<id>` (needs `t.me` in the environment's allowed hosts),
take every Reading post after the last listed one, in channel order, numbered on from the last
number. In the post the **title itself is the link** (no visible URL) — Telegram does not turn
`Title (https://...)` text into links, so give the user a rich-text copy (HTML `<a href>` +
clipboard `text/html`) or a bot/Telethon script with `parse_mode="html"`.

## Limits — say these plainly, do not pretend

- This cloud session cannot log in to Telegram, open the user's Chrome, or send messages to the
  teacher (Corvin / ustoz). Telethon and its `.session` live on the user's laptop, not here.
  Offer the file plus a ready message text, or a Telethon script the user runs locally.
- Never ask for or accept Telegram codes, passwords or session files in chat.
