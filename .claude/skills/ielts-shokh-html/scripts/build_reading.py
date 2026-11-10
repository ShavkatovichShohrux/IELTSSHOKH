#!/usr/bin/env python3
"""Build an IELTSSHOKH Reading test HTML from a JSON spec.

Usage:
    python3 build_reading.py specs/<test>.json  out/<file>.html

The shell (design, header, welcome screen, timer, highlight, result modal,
analysis, Synonyms Vault CTA, full screen) lives in ../templates/reading_shell.html.
This script only fills in passages, questions and the answer data.
See ../SKILL.md for the spec format.
"""
import html
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SHELL = HERE.parent / "templates" / "reading_shell.html"

TFNG_KEYS = {
    "TFNG": [("TRUE", "if the statement agrees with the information"),
             ("FALSE", "if the statement contradicts the information"),
             ("NOT GIVEN", "if there is no information on this")],
    "YNNG": [("YES", "if the statement agrees with the claims of the writer"),
             ("NO", "if the statement contradicts the claims of the writer"),
             ("NOT GIVEN", "if it is impossible to say what the writer thinks about this")],
}


def dash(r):
    return str(r).replace("-", "&ndash;").replace("–", "&ndash;")


def ev(text):
    """{{ev:5}}...{{/ev}}  ->  evidence span that turns green after submit."""
    text = re.sub(r"\{\{ev:(\d+)\}\}", r'<span class="ans-ev" data-q="\1">', text)
    return text.replace("{{/ev}}", "</span>")


def gap(n, width=160):
    return (f'<span class="q-card q-card-inline" data-q="{n}" data-type="text">'
            f'<input class="ti-input" data-q="{n}" type="text" autocomplete="off" '
            f'spellcheck="false" placeholder="{n}" style="width:{width}px;"></span>')


def fill_gaps(text, width):
    return re.sub(r"\{(\d+)\}", lambda m: gap(m.group(1), width), text)


def q_row(n, text):
    return f'<div class="q-row"><span class="q-n">{n}</span><span class="q-text">{text}</span></div>'


def render_group(g):
    out = [f'<div class="section-block">',
           f'<div class="section-label">Questions {dash(g["range"])}</div>']
    desc = g.get("desc", "")
    if g["type"] == "tfng":
        desc += "".join(f'<span class="tfng-key"><b>{k}</b> {v}</span>'
                        for k, v in TFNG_KEYS[g.get("mode", "TFNG")])
    out.append(f'<div class="section-desc">{desc}</div>')
    if g.get("box"):
        rows = "<br>".join(f"{l}&nbsp; {t}" for l, t in g["box"]["rows"])
        out.append(f'<div class="pbox"><b>{g["box"]["title"]}</b><br>{rows}</div>')

    t = g["type"]
    if t == "tfng":
        vals = [k for k, _ in TFNG_KEYS[g.get("mode", "TFNG")]]
        for it in g["items"]:
            btns = "".join(f'<button class="tfng-btn" data-val="{v}">{v}</button>' for v in vals)
            out.append(f'<div class="q-card" data-q="{it["n"]}" data-type="tfng">'
                       f'{q_row(it["n"], it["text"])}<div class="tfng-group">{btns}</div></div>')
    elif t == "chip":
        for it in g["items"]:
            chips = "".join(f'<span class="chip-opt" data-opt="{l}" tabindex="0">{l}</span>'
                            for l in g["letters"])
            out.append(f'<div class="q-card" data-q="{it["n"]}" data-type="chip">'
                       f'{q_row(it["n"], it["text"])}<div class="q-row-chip" '
                       f'style="padding-left:40px;margin-top:8px"><div class="chip-picker">{chips}'
                       f'</div></div></div>')
    elif t == "mc":
        for it in g["items"]:
            opts = "".join(f'<div class="mc-opt" data-opt="{l}" tabindex="0">{tx}</div>'
                           for l, tx in it["options"])
            out.append(f'<div class="q-card" data-q="{it["n"]}" data-type="mc">'
                       f'{q_row(it["n"], it["text"])}<div class="mc-opts">{opts}</div></div>')
    elif t == "multi":
        nums = [it["n"] for it in g["items"]]
        opts = "".join(f'<div class="multi-opt" data-opt="{l}" tabindex="0">{tx}</div>'
                       for l, tx in g["options"])
        out.append(f'<div class="q-card" data-q="{nums[0]}" data-qs="{" ".join(map(str, nums))}" '
                   f'data-type="multi"><div class="q-row"><span class="q-n pair">'
                   f'{nums[0]}&ndash;{nums[-1]}</span><span class="q-text"><i>{g["question"]}</i>'
                   f'</span></div><div class="multi-opts">{opts}</div>'
                   f'<div class="choose-n">Choose {len(nums)} letters.</div></div>')
    elif t == "short":
        for it in g["items"]:
            out.append(f'<div class="q-card" data-q="{it["n"]}" data-type="text">'
                       f'{q_row(it["n"], it["text"])}<div style="padding-left:40px;margin-top:8px">'
                       f'<input class="ti-input" data-q="{it["n"]}" type="text" autocomplete="off" '
                       f'spellcheck="false" placeholder="{it["n"]}" style="width:220px;"></div></div>')
    elif t == "notes":
        w = g.get("width", 160)
        body = [f'<div class="note-box"><div class="note-box-title">{g["title"]}</div>'
                f'<div class="note-txt" style="line-height:2.6">']
        if g.get("prose"):
            body.append(fill_gaps(g["prose"], w))
        for sec in g.get("sections", []):
            if sec.get("h"):
                body.append(f'<div class="nt-h">{sec["h"]}</div>')
            body.append('<ul class="nt">' + "".join(f"<li>{fill_gaps(l, w)}</li>" for l in sec["lines"]) + "</ul>")
        body.append("</div></div>")
        out.append("".join(body))
    else:
        raise ValueError(f"unknown group type {t}")
    out.append("</div>")
    return "\n".join(out)


def build(spec):
    passages, questions, ptabs = [], [], []
    ANS, ACCEPT, KW, FB, PAIR, GROUPS, QNUMS = {}, {}, {}, {}, {}, [], []
    word = spec.get("section_word", "Passage")
    for i, p in enumerate(spec["passages"]):
        on = " on" if i == 0 else ""
        paras = "\n".join(
            f'<p>{f"<span class=para-letter>{l}</span>" if l else ""}{ev(t)}</p>'.replace(
                "<span class=para-letter>", '<span class="para-letter">')
            for l, t in p["paras"])
        passages.append(
            f'<div class="psec{on}" id="ps{i}"><div class="passage-card-body">'
            f'<div class="passage-label">{p["label"]}</div>'
            f'<div class="passage-heading">{p["heading"]}</div>'
            f'<div class="passage-caption"><em>{p["caption"]}</em></div>'
            f'<div class="passage-body">\n{paras}\n</div></div></div>')
        lo = hi = None
        for g in p["groups"]:
            for it in g["items"]:
                n = it["n"]
                lo = n if lo is None else min(lo, n)
                hi = n if hi is None else max(hi, n)
                QNUMS.append(n)
                ans = it["ans"]
                ANS[n] = ans
                acc = it.get("accept") or [ans]
                ACCEPT[n] = [re.sub(r"\s+", " ", a.strip().lower()) for a in acc]
                KW[n] = it["kw"]
                FB[n] = {"verd": ans, "stmt": it.get("stmt") or re.sub(r"\{(\d+)\}", "___", it.get("text", "")),
                         "ev": it["ev"], "ex": it["ex"]}
            if g["type"] == "multi":
                PAIR[g["items"][0]["n"]] = ",".join(sorted(it["ans"] for it in g["items"]))
        GROUPS.append([lo, hi])
        questions.append(
            f'<div class="qgroup{on}" id="qg{i}"><div class="part-head"><span>Reading</span>'
            f'<h2>{word} {i + 1}</h2><em>Questions {lo}&ndash;{hi}</em></div>\n'
            + "\n".join(render_group(g) for g in p["groups"]) + "\n</div>")
        ptabs.append(f'<button class="ptab{on}" onclick="setPassage({i})"><span class="pt-long">'
                     f'{word} </span><span class="pt-short">{word[0]}</span>{i + 1}</button>')

    assert QNUMS == sorted(QNUMS) and len(set(QNUMS)) == len(QNUMS), "question numbers must be unique and ascending"
    j = lambda o: json.dumps({str(k): v for k, v in o.items()} if isinstance(o, dict) else o, ensure_ascii=False)
    data = "\n".join([
        f"const ANS = {j(ANS)};",
        f"const ACCEPT = {j(ACCEPT)};",
        f"const QNUMS = {json.dumps(QNUMS)};",
        f"const GROUPS = {json.dumps(GROUPS)};",
        f"const PAIR = {j(PAIR)};      // first number of each \"choose N\" card -> correct letters",
        f"const KW = {j(KW)};",
        f"const FB = {j(FB)};",
        f"const SEC = {json.dumps(word)};",
    ])
    out = SHELL.read_text(encoding="utf8")
    repl = {
        "{{TITLE}}": html.escape(spec["title"]),
        "{{HD_SUB}}": spec.get("hd_sub", "Academic · Reading"),
        "{{MINUTES}}": str(spec.get("minutes", 60)),
        "{{QCOUNT}}": str(len(QNUMS)),
        "{{PASSAGES}}": "\n".join(passages),
        "{{QUESTIONS}}": "\n".join(questions),
        "{{PTABS}}": '<div class="ptabs">' + "".join(ptabs) + "</div>",
        "{{RESULT_TITLE}}": spec.get("result_title", "Your Result — Reading"),
        "{{DATA}}": data,
    }
    for k, v in repl.items():
        assert k in out, k
        out = out.replace(k, v)
    return out


if __name__ == "__main__":
    spec = json.loads(Path(sys.argv[1]).read_text(encoding="utf8"))
    Path(sys.argv[2]).write_text(build(spec), encoding="utf8")
    print("built", sys.argv[2])
