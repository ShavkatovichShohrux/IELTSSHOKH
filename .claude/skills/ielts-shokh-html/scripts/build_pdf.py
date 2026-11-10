#!/usr/bin/env python3
"""Build the printable IELTSSHOKH question paper (A4 PDF) from the same JSON spec as the HTML.

Usage:
    python3 build_pdf.py specs/<test>.json out/<file>.pdf [--no-key]

Layout: cover page, each passage on new pages, then its questions on new pages,
answer key on the last page (leave it out with --no-key). Branded header (shokh logo,
IELTSSHOKH, series) and footer (t.me/ieltsshokh, page x / y) on every page.
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
NAVY = "#1e293b"
BLUE = "#1e3a8a"

TFNG = {
    "TFNG": [("TRUE", "if the statement agrees with the information"),
             ("FALSE", "if the statement contradicts the information"),
             ("NOT GIVEN", "if there is no information on this")],
    "YNNG": [("YES", "if the statement agrees with the claims of the writer"),
             ("NO", "if the statement contradicts the claims of the writer"),
             ("NOT GIVEN", "if it is impossible to say what the writer thinks about this")],
}
DOTS = '<span class="dots">..............................</span>'


def clean(t):
    return re.sub(r"\{\{/?ev(:\d+)?\}\}", "", t)


def gap(m):
    return f'<b>{m.group(1)}</b> {DOTS}'


def dash(r):
    return str(r).replace("-", " - ").replace("–", " - ")


def group_html(g):
    keep = " keep" if g["type"] in ("multi", "notes", "short", "mc") else ""
    h = [f'<section class="grp{keep}"><h3>Questions {dash(g["range"])}</h3>']
    desc = g.get("desc", "")
    h.append(f'<p class="desc">{desc}</p>')
    t = g["type"]
    if t == "tfng":
        h.append('<table class="legend">' + "".join(
            f"<tr><th>{k}</th><td>{v}</td></tr>" for k, v in TFNG[g.get("mode", "TFNG")]) + "</table>")
    if g.get("box"):
        h.append(f'<div class="box"><div class="box-t">{g["box"]["title"]}</div><table class="list">' + "".join(
            f"<tr><th>{l}</th><td>{x}</td></tr>" for l, x in g["box"]["rows"]) + "</table></div>")
    if t in ("tfng", "chip", "short"):
        for it in g["items"]:
            h.append(f'<div class="q"><span class="n">{it["n"]}</span><span class="qt">{it["text"]} {DOTS}</span></div>')
    elif t == "mc":
        for it in g["items"]:
            opts = "".join(f'<div class="opt"><b>{l}</b> {x}</div>' for l, x in it["options"])
            h.append(f'<div class="q"><span class="n">{it["n"]}</span><span class="qt">{it["text"]}{opts}</span></div>')
    elif t == "multi":
        opts = "".join(f'<div class="opt"><b>{l}</b> {x}</div>' for l, x in g["options"])
        h.append(f'<div class="keep"><p class="mq">{g["question"]}</p>{opts}</div>')
    elif t == "notes":
        b = [f'<div class="box notes"><div class="box-t">{g["title"]}</div>']
        if g.get("prose"):
            b.append(f'<p class="prose">{re.sub(r"[{](\d+)[}]", gap, g["prose"])}</p>')
        for sec in g.get("sections", []):
            if sec.get("h"):
                b.append(f'<div class="sub">{sec["h"]}</div>')
            b.append("<ul>" + "".join(f'<li>{re.sub(r"[{](\d+)[}]", gap, l)}</li>' for l in sec["lines"]) + "</ul>")
        b.append("</div>")
        h.append("".join(b))
    h.append("</section>")
    return "\n".join(h)


def key_html(spec):
    rows = []
    for p in spec["passages"]:
        for g in p["groups"]:
            for it in g["items"]:
                acc = [a for a in (it.get("accept") or []) if a.lower() != str(it["ans"]).lower()]
                alt = f' <span class="alt">/ {" / ".join(acc)}</span>' if acc and g["type"] in ("notes", "short") else ""
                rows.append(f'<div class="k"><span class="n">{it["n"]}</span>{it["ans"]}{alt}</div>')
    multi = [g for p in spec["passages"] for g in p["groups"] if g["type"] == "multi"]
    note = "".join(f'<p class="knote">Questions {dash(g["range"])}: answers may be written in any order.</p>' for g in multi)
    return (f'<div class="page-break"></div><h2 class="kh">Answer Key</h2>'
            f'<div class="keygrid">{"".join(rows)}</div>{note}')


def build_html(spec, with_key=True):
    pdf = spec.get("pdf", {})
    nq = sum(len(g["items"]) for p in spec["passages"] for g in p["groups"])
    mins = spec.get("minutes", 60)
    cover = f'''
<div class="cover">
  <div class="c-kind">{pdf.get("kind", "IELTS ACADEMIC PRACTICE")}</div>
  <div class="c-paper">{pdf.get("paper", "READING")}</div>
  <div class="c-sub">{pdf.get("subtitle", "QUESTION PAPER")}</div>
  <div class="c-meta">{mins} minutes &nbsp;/&nbsp; {len(spec["passages"])} passage{"s" if len(spec["passages"]) > 1 else ""} &nbsp;/&nbsp; {nq} questions</div>
  <table class="cand">
    <tr><th>Candidate name</th><td></td></tr>
    <tr><th>Candidate number</th><td></td></tr>
    <tr><th>Date</th><td></td></tr>
  </table>
  <div class="c-ins">INSTRUCTIONS TO CANDIDATES</div>
  <p>Keep this booklet closed until you are told to begin.</p>
  <p>Answer all {nq} questions. Each correct answer is worth one mark.</p>
  <p>Follow the directions and word limit for each question group.</p>
  <p>Finish writing your answers within the {mins} minutes.</p>
  <div class="c-brand"><img src="{LOGO}" alt=""><div><b>IELTSSHOKH</b><span>Study In Monster Mode, Achieve Monster Results.</span><span>t.me/ieltsshokh &nbsp;·&nbsp; ieltsshokhspeaking.uz</span></div></div>
</div>'''
    body = [cover]
    for p in spec["passages"]:
        paras = "".join(
            f'<p>{f"<b class=pl>{l}</b>" if l else ""}{clean(t)}</p>'.replace("class=pl", 'class="pl"')
            for l, t in p["paras"])
        body.append(f'<div class="page-break"></div><div class="plabel">{p["label"].upper()}</div>'
                    f'<p class="cap">{p["caption"]}</p><h2 class="ptitle">{p["heading"]}</h2>'
                    f'<div class="passage">{paras}</div>')
        body.append('<div class="page-break"></div>' + "\n".join(group_html(g) for g in p["groups"]))
    if with_key:
        body.append(key_html(spec))
    css = f'''
@page {{ size: A4; margin: 28mm 18mm 20mm 18mm; }}
* {{ box-sizing: border-box; }}
body {{ font-family: "Times New Roman", Times, serif; color: #111; font-size: 11.5pt; line-height: 1.5; margin: 0; }}
.page-break {{ break-before: page; }}
.cover {{ font-family: Arial, Helvetica, sans-serif; padding-top: 6mm; }}
.c-kind {{ font-weight: 700; font-size: 13pt; letter-spacing: .02em; }}
.c-paper {{ font-weight: 900; font-size: 44pt; line-height: 1.05; color: {NAVY}; margin: 2mm 0; }}
.c-sub {{ font-weight: 700; font-size: 15pt; color: #555; }}
.c-meta {{ margin: 3mm 0 10mm; font-size: 11pt; }}
.cand {{ width: 100%; border-collapse: collapse; margin-bottom: 10mm; }}
.cand th {{ text-align: left; width: 45mm; font-size: 10pt; padding: 5mm 0 1mm; }}
.cand td {{ border-bottom: 1px solid #999; }}
.c-ins {{ font-weight: 700; font-size: 11pt; margin-bottom: 2mm; }}
.cover p {{ margin: 0 0 1.6mm; font-size: 10.5pt; }}
.c-brand {{ margin-top: 30mm; display: flex; gap: 5mm; align-items: center; border-top: 2px solid {NAVY}; padding-top: 6mm; }}
.c-brand img {{ height: 22mm; }}
.c-brand b {{ display: block; font-size: 16pt; color: {NAVY}; letter-spacing: .04em; }}
.c-brand span {{ display: block; font-size: 9.5pt; color: #444; }}
.plabel {{ font-weight: 700; font-size: 11pt; }}
.cap {{ margin: 1mm 0 4mm; }}
.ptitle {{ text-align: center; font-size: 15pt; margin: 0 0 4mm; }}
.passage p {{ margin: 0 0 2.6mm; text-align: left; }}
.pl {{ margin-right: 2mm; }}
.grp {{ margin-bottom: 7mm; }}
.grp h3 {{ font-size: 12pt; margin: 0 0 2mm; break-after: avoid; }}
.desc {{ margin: 0 0 3mm; }}
.legend {{ border-collapse: collapse; margin: 0 0 3mm; }}
.legend th {{ text-align: left; padding: 1mm 10mm 1mm 0; white-space: nowrap; }}
.legend td {{ padding: 1mm 0; }}
.q {{ display: flex; gap: 2.5mm; margin: 0 0 3mm; break-inside: avoid; }}
.q .n {{ font-weight: 700; min-width: 6mm; }}
.dots {{ color: #333; letter-spacing: .5px; }}
.opt {{ margin: 1mm 0 1mm 0; break-inside: avoid; }}
.opt b {{ display: inline-block; width: 6mm; }}
.mq {{ margin: 0 0 2mm; }}
.keep {{ break-inside: avoid; }}
.grp h3 + .desc {{ break-before: avoid; }}
.box {{ border: 1px solid #333; padding: 3mm 4mm; margin: 0 0 4mm; break-inside: avoid; }}
.box-t {{ font-weight: 700; margin-bottom: 1.5mm; }}
.notes .sub {{ font-weight: 700; margin: 2.5mm 0 1mm; }}
.notes ul {{ margin: 0; padding-left: 5mm; }}
.notes li {{ margin: 0 0 1.6mm; }}
.notes .prose {{ margin: 0; line-height: 1.75; }}
.list th {{ text-align: left; width: 10mm; padding: .6mm 0; }}
.list td {{ padding: .6mm 0; }}
.kh {{ font-family: Arial, sans-serif; color: {NAVY}; font-size: 18pt; margin: 0 0 5mm; }}
.keygrid {{ columns: 2; column-gap: 12mm; font-family: Arial, sans-serif; font-size: 10.5pt; }}
.k {{ break-inside: avoid; padding: 1.4mm 0; border-bottom: 1px solid #ddd; }}
.k .n {{ display: inline-block; width: 9mm; font-weight: 700; color: {BLUE}; }}
.alt {{ color: #666; }}
.knote {{ font-family: Arial, sans-serif; font-size: 9.5pt; color: #444; margin-top: 4mm; }}
'''
    return f'<!doctype html><html><head><meta charset="utf-8"><title>{html.escape(spec["title"])}</title><style>{css}</style></head><body>{"".join(body)}</body></html>'


def header_footer(spec):
    series = html.escape(spec.get("pdf", {}).get("series", ""))
    head = f'''<div style="width:100%;margin:0 18mm;font-family:Arial,sans-serif;-webkit-print-color-adjust:exact;">
<div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1.5px solid {NAVY};padding-bottom:2.5mm;">
<div style="display:flex;align-items:center;gap:2.5mm;"><img src="{LOGO}" style="height:9mm;"><span style="font-size:13pt;font-weight:800;color:{NAVY};letter-spacing:.04em;">IELTSSHOKH</span></div>
<span style="font-size:8.5pt;color:#555;letter-spacing:.06em;">{series}</span></div></div>'''
    foot = f'''<div style="width:100%;margin:0 18mm;font-family:Arial,sans-serif;font-size:7.5pt;color:#555;display:flex;justify-content:space-between;border-top:1px solid #bbb;padding-top:2mm;">
<span style="letter-spacing:.06em;">IELTSSHOKH &nbsp;/&nbsp; T.ME/IELTSSHOKH</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'''
    return head, foot


NODE = r'''
const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const [src,out,hf]=process.argv.slice(2); const {head,foot}=JSON.parse(fs.readFileSync(hf,'utf8'));
const b=await chromium.launch(); const p=await b.newPage(); await p.goto('file://'+src,{waitUntil:'load'});
await p.pdf({path:out,format:'A4',printBackground:true,displayHeaderFooter:true,headerTemplate:head,footerTemplate:foot,
 margin:{top:'28mm',bottom:'20mm',left:'18mm',right:'18mm'}}); await b.close(); })();
'''

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    spec = json.loads(Path(args[0]).read_text(encoding="utf8"))
    out = Path(args[1]).resolve()
    with tempfile.TemporaryDirectory() as d:
        src = Path(d) / "paper.html"
        src.write_text(build_html(spec, "--no-key" not in sys.argv), encoding="utf8")
        head, foot = header_footer(spec)
        hf = Path(d) / "hf.json"
        hf.write_text(json.dumps({"head": head, "foot": foot}), encoding="utf8")
        js = Path(d) / "print.js"
        js.write_text(NODE, encoding="utf8")
        subprocess.run(["node", str(js), str(src), str(out), str(hf)], check=True)
    print("built", out)
