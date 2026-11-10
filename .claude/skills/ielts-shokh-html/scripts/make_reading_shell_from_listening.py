"""Re-derive templates/reading_shell.html from a newer CDI Listening house file.

Usage: python3 make_reading_shell_from_listening.py "sh_kh - CDI Full Mock Listening v7.html" ../templates/reading_shell.html

Run this only when the Listening design changes (v8, v9 ...). Every rep() asserts that the
piece of the Listening file it edits still exists, so a changed source fails loudly
instead of producing a broken shell: fix the failing rep() and run again.
"""
import re, sys
SRC = sys.argv[1]; OUT = sys.argv[2]
_raw = open(SRC, encoding='utf8').read()
_uris = []
def _cut(m):
    _uris.append(m.group(0)); return f'__DATAURI_{len(_uris)-1}__'
s = re.sub(r'data:[a-z]+/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]{2000,}', _cut, _raw)
AUDIO_IDX = next(i for i, u in enumerate(_uris) if u.startswith('data:audio'))
s = s.replace(f'src="__DATAURI_{AUDIO_IDX}__"', 'src="__DATAURI_5__"') if AUDIO_IDX != 5 else s
uris = {i: u for i, u in enumerate(_uris) if not u.startswith('data:audio')}

def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, (old[:80], n)
    s = s.replace(old, new)

def rep_between(start, end, new, keep_end=True):
    global s
    i = s.index(start); j = s.index(end, i)
    s = s[:i] + new + (s[j:] if keep_end else s[j+len(end):])

# ---------- head ----------
s = re.sub(r'<title>.*?</title>', '<title>{{TITLE}}</title>', s, count=1, flags=re.S)
# listening-only CSS: hide passage panel / single column
rep('#passage-panel,#resize-handle{display:none!important;}\n#layout{display:block;overflow:hidden;}\n#questions-panel{flex:none;height:100%;overflow-y:auto;padding:28px 20px 40px;}\n', '')
rep('</style>', '''
/* ----- reading (v7 shell): split passage | questions, timer in the header ----- */
#timer-box{margin:0 auto;flex:0 0 auto;}
.qgroup,#analysis-section{max-width:none;}
.part-head{margin:0 0 18px;}
.part-head h2{font-size:1.5rem;}
.tfng-key{display:block;margin:6px 0 0;}
.choose-n{font-size:.78rem;color:var(--muted);margin:6px 0 0 40px;}
</style>''')

# ---------- body ----------
rep('<div id="ap-msg" role="status"></div><audio id="audio" preload="auto" src="__DATAURI_5__"></audio>', '')
rep('Start Listening →', 'Start Reading →')
s = re.sub(r'<div class="fs-hint">.*?</div>', '<div class="fs-hint">{{MINUTES}} minutes · {{QCOUNT}} questions. The test opens in full screen. Press F11 to leave or re-enter it.</div>', s, count=1, flags=re.S)
rep('<span>Academic · Listening</span>', '<span>{{HD_SUB}}</span>')
rep_between('<div id="audio-player"', '<div class="hd-actions">',
  '''<div id="timer-box">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2 2M9 2h6"></path></svg>
    <span id="timer">{{MINUTES}}:00</span>
    <button id="timer-toggle" onclick="toggleTimer()" title="Hide/show time">👁</button>
  </div>

  ''')
rep_between('<div id="passage-panel">', '<div id="resize-handle">', '<div id="passage-panel">\n{{PASSAGES}}\n</div>\n')
rep_between('<div id="questions-panel">', '<div id="analysis-section">', '<div id="questions-panel">\n{{QUESTIONS}}\n')
rep('exactly what you hear in the recording, and why it is correct', 'exactly where it sits in the passage, and why it is correct')
s = re.sub(r'<div class="ptabs">.*?</div>', '{{PTABS}}', s, count=1, flags=re.S)
rep('Your Result — Listening', '{{RESULT_TITLE}}')
rep('Your Listening is on track', 'Your Reading is on track')
rep('Paraphrase in the recording', 'Paraphrase in the passage')

# ---------- JS ----------
i = s.index('const ANS = '); j = s.index('const ICON = ')
s = s[:i] + '{{DATA}}\n' + s[j:]
# generalised "choose N" groups (PAIR value may hold 2 or 3 letters)
rep("const pairKey = n => PAIR[n] !== undefined ? n : (PAIR[n-1] !== undefined ? n-1 : null);",
    "const pairSize = k => PAIR[k].split(',').length;\nconst pairKey = n => { for (const k in PAIR) { const kk=+k; if (n>=kk && n<kk+pairSize(kk)) return kk; } return null; };")
rep("if(!already && card.querySelectorAll('.multi-opt.selected').length>=2) return;",
    "if(!already && card.querySelectorAll('.multi-opt.selected').length>=pairSize(+card.dataset.q)) return;")
rep("if(pk!==null){ const r=responses[pk]; const len=r?r.split(',').length:0; return n===pk?len>=1:len>=2; }",
    "if(pk!==null){ const r=responses[pk]; const len=r?r.split(',').length:0; return len>=n-pk+1; }")
rep("""    let state;
    if(n===pk) state=user.length===0?'skipped':(hits>=1?'correct':'wrong');
    else state=user.length<2?'skipped':(hits===2?'correct':'wrong');""",
    """    const k=n-pk;
    const state=user.length<=k?'skipped':(hits>k?'correct':'wrong');""")
rep("""      const a=grade(n), b=grade(n+1);
      const cls=(a.ok&&b.ok)?'correct':(a.state==='skipped'?'skipped':'wrong');""",
    """      const gs=card.dataset.qs.split(' ').map(x=>grade(+x));
      const cls=gs.every(g=>g.ok)?'correct':(gs[0].state==='skipped'?'skipped':'wrong');""")
# audio player -> reading timer
i = s.index('/* ================= AUDIO PLAYER'); j = s.index('function toggleDark(){')
s = s[:i] + '''/* ================= TIMER ================= */
let secs={{MINUTES}}*60, tInt=null, tHidden=false;
function startTimer(){
  tInt=setInterval(()=>{ secs--; renderTimer(); if(secs<=0){ clearInterval(tInt); if(!submitted) doSubmit(); } },1000);
}
function renderTimer(){
  const el=document.getElementById('timer');
  if(tHidden){ el.textContent='••:••'; return; }
  const m=Math.floor(secs/60), sc=secs%60;
  el.textContent=(m<10?'0':'')+m+':'+(sc<10?'0':'')+sc;
  el.classList.toggle('warn',secs<=300&&secs>60);
  el.classList.toggle('danger',secs<=60);
}
function toggleTimer(){ tHidden=!tHidden; renderTimer(); }
/* full screen: see fullscreen.js (ShkhFS); the Start click is the user gesture the browser requires */
function startTest(){
  ShkhFS.enter(); ShkhFS.arm();
  document.getElementById('welcome-overlay').style.display = 'none';
  startTimer(); markActive();
}

''' + s[j:]
rep("submitted=true; clearInterval(tInt); try{AUD.pause();}catch(e){}", "submitted=true; clearInterval(tInt);")
rep("'</b>Part '+(i+1)+'</div>'", "'</b>'+SEC+' '+(i+1)+'</div>'")
rep(">Part '+(gi+1)+'</td>'", ">'+SEC+' '+(gi+1)+'</td>'")
rep("h.textContent='Part '+(gi+1)+' · Q'", "h.textContent=SEC+' '+(gi+1)+' · Q'")
rep("What you hear", "Evidence in the passage")
rep("const t=[[39,9],[37,8.5],[35,8],[32,7.5],[30,7],[26,6.5],[23,6],[18,5.5],[16,5],[13,4.5],[10,4],[8,3.5],[6,3],[4,2.5]];",
    "const t=[[39,9],[37,8.5],[35,8],[33,7.5],[30,7],[27,6.5],[23,6],[19,5.5],[15,5],[13,4.5],[10,4],[8,3.5],[6,3],[4,2.5]];")
rep("' — approx. Listening Band '", "' — approx. Academic Reading Band '")
rep("every answer is pinned to the exact words you hear and the paraphrase in the question.", "every answer is pinned to the exact line in the passage and the paraphrase in the question.")

for k, v in uris.items():
    s = s.replace(f'__DATAURI_{k}__', v)
assert '__DATAURI_' not in s and 'AUD' not in s.split('{{DATA}}')[1], 'leftovers'
open(OUT, 'w', encoding='utf8').write(s)
print('shell', len(s))
