#!/usr/bin/env python3
"""Build the IELTSSHOKH printable PDFs (house style of
"sh_kh - REAL EXAMS V10 Listening Test 09 - Questions.pdf" / "... - Answers.pdf").

Usage:
    python3 build_pdf.py specs/<test>.json "<out dir>/sh_kh - REAL EXAMS V10 Reading Test 07"

Writes two A4 files next to that base name:
    "<base> - Questions.pdf"  question paper (passages + questions, answer lines)
    "<base> - Answers.pdf"    answer key boxes, also-accepted line, band table, ANALYSIS

House style: Arial everywhere, black/grey only, small centred shokh logo at the top of
every page, footer "t.me/ieltsshokh | IELTSSHOKH | Page N". No cover page: page 1 opens
with the title block (LISTENING/READING TEST, series in italics, "40 questions · ...",
Name/Date/Score box) and the test starts on the same page.
Works for Reading (passages with "paras") and Listening (parts without "paras").
Needs Node with Playwright (preinstalled in Claude cloud sessions).
"""
import base64
import html
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
LOGO = "data:image/png;base64," + base64.b64encode((HERE.parent / "assets" / "shokh_logo.png").read_bytes()).decode()

TFNG = {
    "TFNG": [("TRUE", "if the statement agrees with the information"),
             ("FALSE", "if the statement contradicts the information"),
             ("NOT GIVEN", "if there is no information on this")],
    "YNNG": [("YES", "if the statement agrees with the claims of the writer"),
             ("NO", "if the statement contradicts the claims of the writer"),
             ("NOT GIVEN", "if it is impossible to say what the writer thinks about this")],
}
BANDS = {
    "reading": [("39-40", "9.0"), ("37-38", "8.5"), ("35-36", "8.0"), ("33-34", "7.5"), ("30-32", "7.0"),
                ("27-29", "6.5"), ("23-26", "6.0"), ("19-22", "5.5"), ("15-18", "5.0"), ("13-14", "4.5"),
                ("10-12", "4.0"), ("8-9", "3.5"), ("6-7", "3.0"), ("4-5", "2.5")],
    "listening": [("39-40", "9.0"), ("37-38", "8.5"), ("35-36", "8.0"), ("32-34", "7.5"), ("30-31", "7.0"),
                  ("26-29", "6.5"), ("23-25", "6.0"), ("18-22", "5.5"), ("16-17", "5.0"), ("13-15", "4.5"),
                  ("10-12", "4.0"), ("8-9", "3.5"), ("6-7", "3.0"), ("4-5", "2.5")],
}
LINE = '<span class="ln"></span>'

CSS = """
@page { size: A4; margin: 26mm 17mm 18mm 17mm; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 10.5pt; line-height: 1.45; margin: 0; }
b, strong { font-weight: 700; }
.pb { break-before: page; }
.title { text-align: center; margin: 0 0 5mm; }
.title h1 { font-size: 22pt; font-weight: 800; margin: 0 0 2mm; letter-spacing: .01em; }
.title .series { font-style: italic; margin: 0 0 2mm; }
.title .meta { font-weight: 700; }
.namebox { border: 1px solid #999; display: flex; justify-content: space-between; align-items: center;
  padding: 3.5mm 6mm; margin: 0 0 3.5mm; }
.namebox span { white-space: nowrap; }
.namebox i { display: inline-block; width: 40mm; border-bottom: 1px solid #111; margin-left: 3mm; }
.namebox .score i { width: 12mm; margin-right: 1mm; }
.lead { text-align: center; font-style: italic; font-size: 9.5pt; margin: 0 0 6mm; }
.part { font-size: 8pt; font-weight: 700; letter-spacing: .22em; color: #666; text-transform: uppercase; margin: 6mm 0 4mm; }
.ptitle { font-size: 14pt; font-weight: 800; margin: 0 0 1.5mm; }
.cap { font-style: italic; font-size: 9.5pt; margin: 0 0 4mm; }
.passage p { margin: 0 0 2.4mm; }
.pl { font-weight: 800; margin-right: 1.5mm; }
.grp { margin: 0 0 6mm; }
.keep { break-inside: avoid; }
h3 { font-size: 13pt; font-weight: 800; margin: 0 0 1.5mm; break-after: avoid; }
.desc { font-style: italic; font-size: 9.5pt; margin: 0 0 3.5mm; }
.desc b { font-style: italic; }
.legend { border-collapse: collapse; margin: 0 0 3mm; font-size: 9.5pt; }
.legend th { text-align: left; padding: .6mm 8mm .6mm 0; white-space: nowrap; }
.q { display: flex; gap: 3mm; margin: 0 0 2.6mm; break-inside: avoid; }
.q .n { font-weight: 700; min-width: 6mm; }
.ln { display: inline-block; width: 30mm; border-bottom: 1px solid #111; margin-left: 2mm; vertical-align: baseline; }
.opts { margin: 1.6mm 0 0; }
.opt { display: flex; gap: 3mm; margin: 0 0 1.3mm; }
.opt b { min-width: 4mm; }
.box { border: 1px solid #999; padding: 4mm 5mm; margin: 0 0 4mm; break-inside: avoid; }
.box-t { font-weight: 700; margin: 0 0 2mm; }
.box-t.c { text-align: center; }
.sub { font-weight: 700; margin: 3.5mm 0 1.5mm; padding-bottom: 1.2mm; border-bottom: 1px solid #bbb; }
.box ul { margin: 0; padding-left: 5mm; }
.box li { margin: 0 0 1.8mm; }
.prose { margin: 0; line-height: 1.9; }
.gap b { font-weight: 700; }
.list .opt { margin-bottom: 1mm; }
/* answers */
.ans-h { font-size: 13pt; font-weight: 800; margin: 5mm 0 3mm; }
.also { text-align: center; font-style: italic; font-size: 9.5pt; margin: 0 0 4mm; }
.also b { font-style: italic; }
.akeys { display: flex; gap: 5mm; }
.akey { flex: 1; border: 1px solid #999; padding: 3mm 4mm; }
.akey .h { font-weight: 700; border-bottom: 1px solid #bbb; padding-bottom: 1.5mm; margin-bottom: 2mm; }
.akey .r { display: flex; gap: 4mm; margin: 0 0 1.3mm; }
.akey .r b { min-width: 7mm; }
.band { border-collapse: collapse; width: 100%; font-size: 8pt; margin-top: 2mm; }
.band th, .band td { border: 1px solid #ccc; text-align: center; padding: 1.4mm .6mm; }
.band th { background: #eee; }
.an-title { text-align: center; margin: 0 0 6mm; }
.an-title h1 { font-size: 22pt; font-weight: 800; margin: 0 0 2mm; }
.an-title p { font-style: italic; margin: 0; }
.an { border-left: 2px solid #bbb; padding: 0 0 0 3.5mm; margin: 0 0 4.5mm; break-inside: avoid; }
.an .top { margin: 0 0 1mm; }
.an .top b { margin-right: 1.5mm; }
.an .kw { font-size: 9pt; color: #444; margin: 0 0 1mm; }
.an .kw b { color: #222; }
.an .ev { font-style: italic; margin: 0 0 1mm; }
.an .ex { margin: 0; }
"""


def clean(t):
    return re.sub(r"\{\{/?ev(:\d+)?\}\}", "", t)


def en(r):
    return str(r).replace("-", "–")


def gaps(t):
    return re.sub(r"\{(\d+)\}", lambda m: f'<span class="gap"><b>({m.group(1)})</b>{LINE}</span>', t)


def title_block(spec, answers=False):
    pdf = spec.get("pdf", {})
    nq = n_questions(spec)
    if answers:
        series = f'{pdf.get("series", "")} · Answer Key'
        meta = f"{nq} questions · answers and analysis"
        return f'<div class="title"><h1>{pdf.get("test_title", "READING TEST")}</h1><p class="series">{series}</p><p class="meta">{meta}</p></div>'
    meta = pdf.get("meta", f'{nq} questions · {spec.get("minutes", 60)} minutes')
    return (f'<div class="title"><h1>{pdf.get("test_title", "READING TEST")}</h1>'
            f'<p class="series">{pdf.get("series", "")}</p><p class="meta">{meta}</p></div>'
            f'<div class="namebox"><span>Name: <i></i></span><span>Date: <i></i></span>'
            f'<span class="score"><b>Score:</b> <i></i>/ {nq}</span></div>'
            f'<p class="lead">{pdf.get("lead", "")}</p>')


def n_questions(spec):
    return sum(len(g["items"]) for p in spec["passages"] for g in p["groups"])


def items(spec):
    for pi, p in enumerate(spec["passages"]):
        for g in p["groups"]:
            for it in g["items"]:
                yield pi, g, it


def group_html(g):
    t = g["type"]
    keep = " keep" if t in ("multi", "notes", "mc", "short") else ""
    h = [f'<section class="grp{keep}"><h3>Questions {en(g["range"])}</h3><p class="desc">{g.get("desc", "")}</p>']
    if t == "tfng":
        h.append('<table class="legend">' + "".join(f"<tr><th>{k}</th><td>{v}</td></tr>"
                                                    for k, v in TFNG[g.get("mode", "TFNG")]) + "</table>")
    if g.get("box"):
        rows = "".join(f'<div class="opt"><b>{l}</b><span>{x}</span></div>' for l, x in g["box"]["rows"])
        h.append(f'<div class="box list"><div class="box-t">{g["box"]["title"]}</div>{rows}</div>')
    if t in ("tfng", "chip", "short"):
        for it in g["items"]:
            h.append(f'<div class="q"><span class="n">{it["n"]}</span><span>{it["text"]}{LINE}</span></div>')
    elif t == "mc":
        for it in g["items"]:
            opts = "".join(f'<div class="opt"><b>{l}</b><span>{x}</span></div>' for l, x in it["options"])
            h.append(f'<div class="q"><span class="n">{it["n"]}</span><div>{it["text"]}<div class="opts">{opts}</div></div></div>')
    elif t == "multi":
        opts = "".join(f'<div class="opt"><b>{l}</b><span>{x}</span></div>' for l, x in g["options"])
        nums = [it["n"] for it in g["items"]]
        h.append(f'<p>{g["question"]}</p><div class="opts">{opts}</div>'
                 f'<div class="q" style="margin-top:3mm">' + "".join(
                     f'<span class="n">{n}</span>{LINE}&nbsp;&nbsp;&nbsp;' for n in nums) + '</div>')
    elif t == "notes":
        b = [f'<div class="box"><div class="box-t c">{g["title"]}</div>']
        if g.get("prose"):
            b.append(f'<p class="prose">{gaps(g["prose"])}</p>')
        for sec in g.get("sections", []):
            if sec.get("h"):
                b.append(f'<div class="sub">{sec["h"]}</div>')
            b.append("<ul>" + "".join(f"<li>{gaps(l)}</li>" for l in sec["lines"]) + "</ul>")
        b.append("</div>")
        h.append("".join(b))
    h.append("</section>")
    return "".join(h)


def questions_html(spec):
    word = spec.get("section_word", "Passage")
    out = [title_block(spec)]
    for i, p in enumerate(spec["passages"]):
        label = p.get("label", f"{word} {i + 1}").upper()
        if p.get("paras"):  # Reading: passage text, questions on the next page
            paras = "".join(f'<p>{f"<span class=pl>{l}</span>" if l else ""}{clean(t)}</p>' for l, t in p["paras"])
            out.append(('<div class="pb"></div>' if i else "") +
                       f'<div class="part">{label}</div><div class="ptitle">{p["heading"]}</div>'
                       f'<p class="cap">{p["caption"]}</p><div class="passage">{paras}</div>'
                       f'<div class="pb"></div>')
        else:  # Listening: each part on a new page (part 1 starts on page 1)
            out.append(('<div class="pb"></div>' if i else "") + f'<div class="part">{label}</div>')
        out.append("".join(group_html(g) for g in p["groups"]))
    return "".join(out).replace("class=pl", 'class="pl"')


def answers_html(spec):
    word = spec.get("section_word", "Passage")
    kind = spec.get("pdf", {}).get("kind", "reading")
    out = [title_block(spec, answers=True)]
    also = []
    for _, g, it in items(spec):
        alts = [a for a in (it.get("accept") or []) if a.lower() != str(it["ans"]).lower()]
        if alts and g["type"] in ("notes", "short"):
            also.append(f'Q{it["n"]} <b>{" / ".join(alts)}</b>')
    multi = [g for p in spec["passages"] for g in p["groups"] if g["type"] == "multi"]
    if multi:
        also.append("; ".join(f'Q{en(g["range"])} in any order' for g in multi))
    if also:
        out.append(f'<p class="also">Also accepted: {"; ".join(also)}.</p>')
    out.append('<div class="ans-h">Answers</div><div class="akeys">')
    for i, p in enumerate(spec["passages"]):
        its = [it for g in p["groups"] for it in g["items"]]
        rows = "".join(f'<div class="r"><b>{it["n"]}</b><span>{it["ans"]}</span></div>' for it in its)
        out.append(f'<div class="akey"><div class="h">{word} {i + 1} · Q{its[0]["n"]}-{its[-1]["n"]}</div>{rows}</div>')
    out.append("</div>")
    bands = BANDS[kind]
    out.append('<div class="ans-h">Band score (approximate)</div><table class="band"><tr><th>Raw score</th>' +
               "".join(f"<td>{r}</td>" for r, _ in bands) + "</tr><tr><th>Band</th>" +
               "".join(f"<td>{b}</td>" for _, b in bands) + "</tr></table>")
    sub = "What you hear, and why each answer is correct" if kind == "listening" else \
        "Where each answer is in the passage, and why it is correct"
    verb = "heard" if kind == "listening" else "passage"
    out.append(f'<div class="pb"></div><div class="an-title"><h1>ANALYSIS</h1><p>{sub}</p></div>')
    for i, p in enumerate(spec["passages"]):
        out.append(f'<div class="part">{p.get("label", f"{word} {i + 1}").upper()}</div>')
        for g in p["groups"]:
            for it in g["items"]:
                stmt = it.get("stmt") or it.get("text") or ""
                q = it["ev"].strip().strip('"').replace('\\"', '"')
                out.append(
                    f'<div class="an"><div class="top"><b>{it["n"]}&nbsp; {it["ans"]}</b>{stmt}</div>'
                    f'<div class="kw">Keyword: <b>{it["kw"][0]}</b> &nbsp;→&nbsp; {verb}: {it["kw"][1]}</div>'
                    f'<div class="ev">“{q}”</div><p class="ex">{it["ex"]}</p></div>')
    return "".join(out)


HEAD = f'<div style="width:100%;text-align:center;padding-top:8mm;"><img src="{LOGO}" style="height:10mm;"></div>'
FOOT = ('<div style="width:100%;margin:0 17mm;font-family:Arial,sans-serif;font-size:7.5pt;color:#444;'
        'display:flex;justify-content:space-between;">'
        '<span style="flex:1">t.me/ieltsshokh</span><span style="flex:1;text-align:center">IELTSSHOKH</span>'
        '<span style="flex:1;text-align:right">Page <span class="pageNumber"></span></span></div>')

NODE = r'''
const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const jobs=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const b=await chromium.launch(); const p=await b.newPage();
for(const j of jobs){ await p.goto('file://'+j.src,{waitUntil:'load'});
 await p.pdf({path:j.out,format:'A4',printBackground:true,displayHeaderFooter:true,headerTemplate:j.head,footerTemplate:j.foot,
  margin:{top:'26mm',bottom:'18mm',left:'17mm',right:'17mm'}}); }
await b.close(); })();
'''


def page(spec, body, suffix):
    t = html.escape(f'{spec.get("pdf", {}).get("series", spec["title"])} - {suffix}')
    return f'<!doctype html><html><head><meta charset="utf-8"><title>{t}</title><style>{CSS}</style></head><body>{body}</body></html>'


if __name__ == "__main__":
    spec = json.loads(Path(sys.argv[1]).read_text(encoding="utf8"))
    base = Path(sys.argv[2]).resolve()
    outs = {"Questions": questions_html(spec), "Answers": answers_html(spec)}
    with tempfile.TemporaryDirectory() as d:
        jobs = []
        for name, body in outs.items():
            src = Path(d) / f"{name}.html"
            src.write_text(page(spec, body, name), encoding="utf8")
            jobs.append({"src": str(src), "out": f"{base} - {name}.pdf", "head": HEAD, "foot": FOOT})
        (Path(d) / "jobs.json").write_text(json.dumps(jobs), encoding="utf8")
        (Path(d) / "print.js").write_text(NODE, encoding="utf8")
        subprocess.run(["node", str(Path(d) / "print.js"), str(Path(d) / "jobs.json")], check=True)
    for j in jobs:
        print("built", j["out"])
