import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'

/*
 * Fully hand-built, editable recreation of the reference login screen.
 * Everything (planet, HUD rings, stars, platform, cards, text) is real
 * HTML/CSS — no baked image. Palette & metrics follow the provided spec:
 *   bg #050814 · card rgba(12,16,35,.55) · primary #4B7CFF · muted #A5AFD6
 *   card 560px / r28 · inputs h64 r16 · button h70 r18 (#244CFF→#1638D4)
 */

const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

/* Planet surface "city lights" — dots inside the disc, upper-centre biased */
const CITY = (() => {
  const arr = []; let s = 1
  while (arr.length < 130) {
    const a  = rnd(s++) * Math.PI * 2
    const rr = Math.sqrt(rnd(s++)) * 0.46
    const x  = 50 + Math.cos(a) * rr * 100
    const y  = 43 + Math.sin(a) * rr * 96
    if (y > 82 && rnd(s++) > 0.4) continue          // thin out the bottom
    arr.push({
      x:+x.toFixed(2), y:+y.toFixed(2),
      r:+(0.35 + rnd(s++) * 1.5).toFixed(2),
      o:+(0.12 + rnd(s++) * 0.6).toFixed(2),
      dur:+(2 + rnd(s++) * 4).toFixed(2),
      delay:+(rnd(s++) * 4).toFixed(2),
    })
  }
  return arr
})()

/* Twinkling background stars — kept clear of the login card */
const STARS = (() => {
  const arr = []; let s = 200
  while (arr.length < 60) {
    const x = rnd(s++) * 100, y = rnd(s++) * 100
    if (x > 26 && x < 74 && y > 34 && y < 88) continue
    arr.push({
      x:+x.toFixed(2), y:+y.toFixed(2),
      r:+(0.5 + rnd(s++) * 1.6).toFixed(2),
      dur:+(2.4 + rnd(s++) * 4.5).toFixed(2),
      delay:+(rnd(s++) * 5).toFixed(2),
      o:+(0.3 + rnd(s++) * 0.55).toFixed(2),
    })
  }
  return arr
})()

/* Small floating glowing squares */
const SQUARES = [
  { x:'23%', y:'46%', s:9,  dur:7,  delay:0,   rot:0  },
  { x:'75%', y:'44%', s:8,  dur:8.5,delay:1.2, rot:45 },
  { x:'88%', y:'70%', s:7,  dur:9,  delay:.6,  rot:0  },
  { x:'12%', y:'70%', s:6,  dur:7.5,delay:1.8, rot:45 },
  { x:'75%', y:'12%', s:5,  dur:10, delay:2.4, rot:0  },
  { x:'20%', y:'20%', s:6,  dur:8,  delay:.9,  rot:45 },
]

/* ── Icons (outline only) ──────────────────────────────────────────────── */
const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7FA0E6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconLock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7FA0E6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IconEye = ({ off }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8FA6D8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {off ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    ) : (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>)}
  </svg>
)
const IconArrow = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)
const IconFingerprint = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5B87F0" strokeWidth="1.4" strokeLinecap="round">
    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/>
    <path d="M2 17.5c2.25 0 8.5-.5 8.5-5.5"/><path d="M5.45 5.11A7 7 0 0 1 19 12c-.06 2-.48 2.91-.52 3"/>
    <path d="M21.5 12A9.5 9.5 0 0 0 3 9.5"/><path d="M7 22c.9-3.3 1-5.5 1-9"/><path d="M9 12c0-2.21 1.79-4 4-4"/>
  </svg>
)
const IconDiamond = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5B87F0" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="6 3 18 3 22 9 12 22 2 9"/><line x1="2" y1="9" x2="22" y2="9"/>
    <line x1="12" y1="3" x2="6" y2="9"/><line x1="12" y1="3" x2="18" y2="9"/>
  </svg>
)

export default function LoginPage() {
  const [form, setForm]       = useState({ username: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate    = useNavigate()
  const location    = useLocation()
  const from        = location.state?.from?.pathname
  const sceneRef    = useRef(null)

  const submit = async e => {
    e.preventDefault()
    if (!form.username || !form.password) return toast.error("Barcha maydonlarni to'ldiring")
    setLoading(true)
    try {
      const res = await api.login(form)
      setAuth(res.data.user, res.data.access_token)
      toast.success(`Xush kelibsiz, ${res.data.user.username}!`)
      navigate(res.data.user.role === 'admin' ? '/admin' : from && from !== '/' ? from : '/tests', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login yoki parol noto'g'ri")
    } finally { setLoading(false) }
  }

  // Gentle mouse parallax on the whole decorative scene
  const onMove = e => {
    const el = sceneRef.current; if (!el) return
    const nx = (e.clientX / window.innerWidth  - 0.5) * 2
    const ny = (e.clientY / window.innerHeight - 0.5) * 2
    el.style.transform = `translate3d(${(-nx * 10).toFixed(1)}px, ${(-ny * 8).toFixed(1)}px, 0)`
  }
  const onLeave = () => { if (sceneRef.current) sceneRef.current.style.transform = 'translate3d(0,0,0)' }

  return (
    <div onMouseMove={onMove} onMouseLeave={onLeave} style={{
      position:'relative', minHeight:'100vh', width:'100%', overflow:'hidden',
      background:'#050814', color:'#fff',
      fontFamily:"'Inter',-apple-system,'Segoe UI',system-ui,sans-serif",
      WebkitFontSmoothing:'antialiased',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        @keyframes lgTwinkle { 0%,100%{ opacity:var(--o); } 50%{ opacity:calc(var(--o)*.2); } }
        @keyframes lgSpin    { to { transform:translate(-50%,-50%) rotate(360deg); } }
        @keyframes lgSpinR   { to { transform:translate(-50%,-50%) rotate(-360deg); } }
        @keyframes lgFloat   { 0%,100%{ transform:translateY(0) rotate(var(--r,0deg)); } 50%{ transform:translateY(-14px) rotate(calc(var(--r,0deg) + 12deg)); } }
        @keyframes lgAura    { 0%,100%{ opacity:.5; } 50%{ opacity:.85; } }
        @keyframes lgBeam    { 0%,100%{ opacity:.4; } 50%{ opacity:.85; } }
        @keyframes lgRingP   { 0%,100%{ opacity:.5; transform:translate(-50%,-50%) scale(1); } 50%{ opacity:.8; transform:translate(-50%,-50%) scale(1.03); } }
        @keyframes lgPlanet  { to { transform:translateX(-50%) rotate(360deg); } }

        .lg-scene { transition:transform .3s ease-out; will-change:transform; }
        .lg-input { background:transparent; border:none; outline:none; flex:1; min-width:0;
                    color:#EAF0FF; font-size:15px; font-weight:400; letter-spacing:.2px;
                    font-family:inherit; height:100%; }
        .lg-input::placeholder { color:#8C97B8; font-weight:300; }
        .lg-field { transition:border-color .2s, box-shadow .2s; }
        .lg-field:focus-within { border-color:rgba(90,130,255,.6)!important;
                    box-shadow:0 0 0 3px rgba(70,120,255,.14), 0 0 26px rgba(50,110,255,.20)!important; }
        .lg-eye  { background:none;border:none;cursor:pointer;padding:4px;display:flex;align-items:center;transition:transform .15s,opacity .15s;opacity:.85; }
        .lg-eye:hover { transform:scale(1.12); opacity:1; }
        .lg-btn  { transition:transform .2s, box-shadow .2s, filter .2s; }
        .lg-btn:hover:not(:disabled) { transform:translateY(-2px);
                    box-shadow:0 14px 44px rgba(36,76,255,.5), 0 0 26px rgba(60,120,255,.4)!important; filter:brightness(1.06); }
        .lg-btn:active:not(:disabled) { transform:translateY(0); }
        .lg-link { color:#6E93FF; text-decoration:none; transition:color .15s; }
        .lg-link:hover { color:#9DB8FF; }
        .lg-fcard { transition:border-color .25s, box-shadow .25s, transform .25s; }
        .lg-fcard:hover { border-color:rgba(110,140,255,.4)!important; transform:translateY(-3px);
                    box-shadow:0 12px 40px rgba(0,0,0,.4), 0 0 30px rgba(50,110,255,.12)!important; }

        @media (max-width:1180px){ .lg-side { display:none!important; } }
        @media (max-width:900px){  .lg-vtext { display:none!important; } }
        @media (prefers-reduced-motion: reduce){
          .lg-star,.lg-sq,.lg-aura,.lg-beam,.lg-ring,.lg-planet,.lg-mote,.lg-hud { animation:none!important; }
        }
      `}</style>

      {/* ══════════════ BACKGROUND SCENE ══════════════ */}
      <div ref={sceneRef} className="lg-scene" style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:0 }}>

        {/* Bloom behind planet */}
        <div style={{
          position:'absolute', left:'50%', top:'32vh', transform:'translate(-50%,-50%)',
          width:'110vh', height:'110vh', borderRadius:'50%',
          background:'radial-gradient(circle, rgba(45,110,255,.34) 0%, rgba(35,90,235,.16) 38%, transparent 68%)',
          filter:'blur(24px)',
        }}/>

        {/* HUD rings around the planet */}
        {[74, 94, 114, 134].map((sz, i) => (
          <div key={i} style={{
            position:'absolute', left:'50%', top:'32vh', transform:'translate(-50%,-50%)',
            width:`${sz}vh`, height:`${sz}vh`, borderRadius:'50%',
            border:`1px solid rgba(120,150,255,${0.15 - i * 0.025})`,
          }}/>
        ))}
        {/* Two rotating HUD rings with a bright tick */}
        {[{ sz:104, dur:44, dir:'lgSpin' }, { sz:126, dur:66, dir:'lgSpinR' }].map((r, i) => (
          <div key={i} className="lg-hud" style={{
            position:'absolute', left:'50%', top:'32vh',
            width:`${r.sz}vh`, height:`${r.sz}vh`, borderRadius:'50%',
            border:'1px solid rgba(120,160,255,.06)',
            transform:'translate(-50%,-50%)',
            animation:`${r.dir} ${r.dur}s linear infinite`,
          }}>
            <div style={{
              position:'absolute', top:-2, left:'50%', marginLeft:-2,
              width:4, height:4, borderRadius:'50%',
              background:'#9DC0FF', boxShadow:'0 0 10px 2px rgba(120,180,255,.9)',
            }}/>
          </div>
        ))}

        {/* Planet */}
        <div className="lg-planet" style={{
          position:'absolute', left:'50%', top:'-11vh', transform:'translateX(-50%)',
          width:'85vh', height:'85vh', borderRadius:'50%',
          background:'radial-gradient(circle at 50% 40%, #16386f 0%, #0d2149 32%, #071531 58%, #030d20 80%, #020813 100%)',
          boxShadow:'0 0 210px 50px rgba(45,110,255,.34), 0 0 100px 22px rgba(60,130,255,.26), inset 0 0 110px 26px rgba(10,30,90,.5)',
          overflow:'hidden',
          animation:'lgPlanet 240s linear infinite',
        }}>
          {/* city lights */}
          {CITY.map((d, i) => (
            <div key={i} className="lg-star" style={{
              position:'absolute', left:`${d.x}%`, top:`${d.y}%`,
              width:d.r, height:d.r, borderRadius:'50%',
              background:'#bcd4ff', opacity:d.o, '--o':d.o,
              boxShadow:`0 0 ${d.r*2}px rgba(150,190,255,.7)`,
              animation:`lgTwinkle ${d.dur}s ease-in-out ${d.delay}s infinite`,
            }}/>
          ))}
          {/* bright atmospheric limb */}
          <div style={{
            position:'absolute', inset:0, borderRadius:'50%',
            background:'radial-gradient(circle at 50% 50%, transparent 87%, rgba(80,150,255,.42) 91%, rgba(175,212,255,1) 95.5%, rgba(105,172,255,.55) 98%, transparent 100%)',
          }}/>
          {/* darken lower half so the rim glows mostly on top */}
          <div style={{
            position:'absolute', inset:0, borderRadius:'50%',
            background:'linear-gradient(to bottom, rgba(3,8,20,0) 40%, rgba(3,8,20,.38) 70%, rgba(3,8,20,.72) 100%)',
          }}/>
          {/* top highlight bloom */}
          <div className="lg-aura" style={{
            position:'absolute', inset:0, borderRadius:'50%',
            background:'radial-gradient(ellipse 66% 34% at 50% 7%, rgba(150,200,255,.55) 0%, transparent 62%)',
            animation:'lgAura 6s ease-in-out infinite',
          }}/>
        </div>

        {/* Stars */}
        {STARS.map((s, i) => (
          <div key={i} className="lg-star" style={{
            position:'absolute', left:`${s.x}%`, top:`${s.y}%`,
            width:s.r, height:s.r, borderRadius:'50%',
            background:'#dbe8ff', opacity:s.o, '--o':s.o,
            boxShadow:`0 0 ${s.r*2.4}px rgba(150,190,255,.8)`,
            animation:`lgTwinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}/>
        ))}

        {/* Floating squares */}
        {SQUARES.map((q, i) => (
          <div key={i} className="lg-sq" style={{
            position:'absolute', left:q.x, top:q.y, width:q.s, height:q.s,
            border:'1px solid rgba(110,150,255,.32)', background:'rgba(80,120,255,.06)',
            '--r':`${q.rot}deg`, transform:`rotate(${q.rot}deg)`,
            animation:`lgFloat ${q.dur}s ease-in-out ${q.delay}s infinite`,
          }}/>
        ))}

        {/* Blueprint: top-right dot grid */}
        <div style={{ position:'absolute', top:'12%', right:'6%', width:44, height:44 }}>
          {[0,1,2,3].flatMap(r => [0,1,2,3].map(c => (
            <div key={`${r}-${c}`} style={{
              position:'absolute', top:r*11, left:c*11, width:2.4, height:2.4, borderRadius:'50%',
              background:`rgba(110,150,255,${0.28 + ((r+c)%2)*0.1})`,
            }}/>
          )))}
        </div>
        {/* edge tick marks */}
        <div style={{ position:'absolute', top:'5.5%', right:'3%' }}>
          <div style={{ width:22, height:1, background:'rgba(110,150,255,.3)', marginBottom:5 }}/>
          <div style={{ width:12, height:1, background:'rgba(110,150,255,.18)' }}/>
        </div>

        {/* Mountain silhouettes framing the horizon */}
        <svg viewBox="0 0 1440 300" preserveAspectRatio="none" style={{
          position:'absolute', bottom:0, left:0, width:'100%', height:'34vh', display:'block',
        }}>
          <path fill="rgba(4,10,26,.66)" d="M0,235 L120,175 L230,205 L360,150 L470,190 L590,138 L700,178
            L820,120 L940,165 L1060,112 L1180,158 L1300,110 L1440,150 L1440,300 L0,300Z"/>
          <path fill="rgba(3,8,20,.85)" d="M0,262 L110,222 L215,244 L320,205 L430,236 L540,196 L650,228
            L760,186 L880,222 L1000,180 L1120,216 L1240,176 L1360,210 L1440,188 L1440,300 L0,300Z"/>
          <path fill="#020813" d="M0,300 L90,270 L180,286 L280,260 L380,282 L490,256 L600,278 L710,252
            L820,274 L930,250 L1050,272 L1160,250 L1280,270 L1400,250 L1440,262 L1440,300Z"/>
          {/* faint blue rim-light on the front ridge (planet reflection) */}
          <path fill="none" stroke="rgba(70,140,255,.16)" strokeWidth="1.4"
            d="M0,300 L90,270 L180,286 L280,260 L380,282 L490,256 L600,278 L710,252
               L820,274 L930,250 L1050,272 L1160,250 L1280,270 L1400,250 L1440,262"/>
        </svg>

        {/* Ground holographic platform */}
        <div style={{ position:'absolute', bottom:'-3vh', left:'50%', transform:'translateX(-50%)', width:640, height:180 }}>
          <div style={{
            position:'absolute', left:'50%', top:'34%', transform:'translateX(-50%)',
            width:3, height:96, background:'linear-gradient(to top, rgba(60,140,255,.7), transparent)', filter:'blur(.5px)',
          }}/>
          <div className="lg-beam" style={{
            position:'absolute', left:'50%', top:'58%', transform:'translate(-50%,-50%)',
            width:12, height:12, borderRadius:'50%',
            background:'rgba(120,180,255,.9)', boxShadow:'0 0 24px 8px rgba(50,130,255,.6)',
            animation:'lgBeam 3.2s ease-in-out infinite',
          }}/>
          {[
            { w:600, h:150, o:.26, d:'0s' }, { w:470, h:118, o:.34, d:'.3s' },
            { w:350, h:88,  o:.44, d:'.6s' }, { w:240, h:60,  o:.56, d:'.9s' },
            { w:150, h:38,  o:.68, d:'1.1s' }, { w:80, h:20,   o:.82, d:'1.3s' },
          ].map((r, i) => (
            <div key={i} className="lg-ring" style={{
              position:'absolute', left:'50%', top:'58%', transform:'translate(-50%,-50%)',
              width:r.w, height:r.h, borderRadius:'50%',
              border:`1px solid rgba(45,130,255,${r.o})`,
              boxShadow:`0 0 ${6+i*2}px rgba(40,120,255,${r.o*0.4})`,
              animation:`lgRingP ${3 + i*0.4}s ease-in-out ${r.d} infinite`,
            }}/>
          ))}
        </div>

      </div>

      {/* ══════════════ FOREGROUND UI ══════════════ */}

      {/* Header */}
      <div style={{ position:'absolute', top:28, left:36, zIndex:10, display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ width:34, height:1, background:'rgba(180,200,255,.35)' }}/>
        <div>
          <div style={{ fontSize:16, fontWeight:500, letterSpacing:10, color:'#EAF0FF' }}>IELTSSHOKH</div>
          <div style={{ fontSize:9, fontWeight:300, letterSpacing:5, color:'rgba(165,175,214,.75)', marginTop:5 }}>MASTER YOUR SPEAKING</div>
        </div>
      </div>

      {/* Left vertical text */}
      <div className="lg-vtext" style={{
        position:'absolute', left:26, top:'50%', transform:'translateY(-50%)', zIndex:10,
        display:'flex', flexDirection:'column', alignItems:'center', gap:0,
      }}>
        {['FOCUS','PRACTICE','ACHIEVE'].map((w, i) => (
          <div key={w} style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            {i > 0 && <div style={{ width:1, height:22, background:'rgba(120,150,255,.35)', margin:'6px 0' }}/>}
            <span style={{ writingMode:'vertical-rl', textOrientation:'mixed', fontSize:9, fontWeight:400, letterSpacing:8, color:'rgba(165,175,214,.35)' }}>{w}</span>
          </div>
        ))}
      </div>

      {/* Center column */}
      <div style={{
        position:'relative', zIndex:10, minHeight:'100vh',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:'96px 20px 120px',
      }}>
        {/* Headline block */}
        <div style={{ textAlign:'center', marginBottom:34 }}>
          <div style={{ fontSize:13, fontWeight:500, letterSpacing:8, color:'#5D82FF', opacity:.8, marginBottom:20 }}>WELCOME&nbsp;BACK</div>
          <h1 style={{
            margin:'0 0 16px', fontWeight:300, lineHeight:1.16, letterSpacing:'-0.5px',
            fontSize:'clamp(34px, 4.6vw, 64px)', color:'#fff',
          }}>
            Every step you take<br/>
            builds your <span style={{ color:'#5B8CFF', fontWeight:400 }}>future.</span>
          </h1>
          <p style={{ margin:0, fontSize:18, fontWeight:300, color:'rgba(255,255,255,.7)', letterSpacing:'.3px' }}>
            Discipline today, success tomorrow.
          </p>
        </div>

        {/* Login card */}
        <div style={{
          width:'min(560px, 92vw)', borderRadius:28,
          background:'rgba(12,16,35,.55)',
          backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
          border:'1px solid rgba(90,120,255,.25)',
          boxShadow:'0 0 60px rgba(40,90,220,.10), inset 0 1px 0 rgba(255,255,255,.04)',
          padding:'40px 44px 34px',
        }}>
          <form onSubmit={submit}>

            {/* USERNAME */}
            <div style={{ marginBottom:22 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:500, letterSpacing:2, color:'#A5AFD6', marginBottom:11 }}>USERNAME</label>
              <div className="lg-field" style={{
                height:64, borderRadius:16, display:'flex', alignItems:'center', gap:12, padding:'0 18px',
                background:'rgba(6,10,26,.6)', border:'1px solid rgba(110,140,255,.2)',
              }}>
                <IconUser/>
                <input className="lg-input" type="text" placeholder="Enter your username"
                  value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  autoComplete="username"/>
              </div>
            </div>

            {/* PASSWORD */}
            <div style={{ marginBottom:30 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:500, letterSpacing:2, color:'#A5AFD6', marginBottom:11 }}>PASSWORD</label>
              <div className="lg-field" style={{
                height:64, borderRadius:16, display:'flex', alignItems:'center', gap:12, padding:'0 14px 0 18px',
                background:'rgba(6,10,26,.6)', border:'1px solid rgba(110,140,255,.2)',
              }}>
                <IconLock/>
                <input className="lg-input" type={showPw ? 'text' : 'password'} placeholder="Enter your password"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  autoComplete="current-password"/>
                <button type="button" className="lg-eye" onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}>
                  <IconEye off={showPw}/>
                </button>
              </div>
            </div>

            {/* BUTTON */}
            <button type="submit" disabled={loading} className="lg-btn" style={{
              width:'100%', height:70, borderRadius:18, border:'none', cursor:loading ? 'wait' : 'pointer',
              background:'linear-gradient(180deg, #244CFF 0%, #1638D4 100%)',
              color:'#fff', position:'relative',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 8px 30px rgba(30,70,220,.4)',
            }}>
              <span style={{
                position:'absolute', left:11, top:'50%', transform:'translateY(-50%)',
                width:48, height:48, borderRadius:'50%',
                border:'1.5px solid rgba(255,255,255,.55)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 0 18px rgba(120,170,255,.5)', background:'rgba(255,255,255,.06)',
              }}>
                <IconArrow/>
              </span>
              <span style={{ fontSize:14, fontWeight:500, letterSpacing:2 }}>
                {loading ? 'KIRISH...' : 'ACCESS DASHBOARD'}
              </span>
            </button>

            {/* Divider + link */}
            <div style={{ display:'flex', alignItems:'center', gap:14, margin:'22px 0 14px' }}>
              <div style={{ flex:1, height:1, background:'rgba(110,140,255,.14)' }}/>
              <span style={{ fontSize:12, color:'rgba(165,175,214,.5)' }}>or</span>
              <div style={{ flex:1, height:1, background:'rgba(110,140,255,.14)' }}/>
            </div>
            <div style={{ textAlign:'center', fontSize:13.5, color:'rgba(165,175,214,.8)' }}>
              Don't have an account? <a href="/register" className="lg-link" style={{ fontWeight:500 }}>Create one</a>
            </div>

          </form>
        </div>
      </div>

      {/* Bottom feature cards */}
      <div className="lg-side lg-fcard" style={{
        position:'absolute', left:'3.4%', top:'64%', zIndex:10,
        display:'flex', alignItems:'center', gap:14, maxWidth:230,
        padding:'16px 20px', borderRadius:16,
        background:'rgba(10,14,30,.5)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
        border:'1px solid rgba(110,140,255,.18)',
      }}>
        <div style={{ width:46, height:46, borderRadius:12, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
          background:'rgba(40,90,200,.14)', border:'1px solid rgba(90,120,255,.2)' }}><IconFingerprint/></div>
        <div>
          <div style={{ fontSize:11, fontWeight:600, letterSpacing:1, color:'#DCE6FF', marginBottom:5 }}>SECURE ACCESS</div>
          <div style={{ fontSize:11.5, fontWeight:300, color:'rgba(165,175,214,.7)', lineHeight:1.45 }}>Your data is 100% protected</div>
        </div>
      </div>

      <div className="lg-side lg-fcard" style={{
        position:'absolute', right:'3.4%', top:'64%', zIndex:10,
        display:'flex', alignItems:'center', gap:14, maxWidth:230,
        padding:'16px 20px', borderRadius:16,
        background:'rgba(10,14,30,.5)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
        border:'1px solid rgba(110,140,255,.18)',
      }}>
        <div style={{ width:46, height:46, borderRadius:12, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
          background:'rgba(40,90,200,.14)', border:'1px solid rgba(90,120,255,.2)' }}><IconDiamond/></div>
        <div>
          <div style={{ fontSize:11, fontWeight:600, letterSpacing:1, color:'#DCE6FF', marginBottom:5 }}>PREMIUM CONTENT</div>
          <div style={{ fontSize:11.5, fontWeight:300, color:'rgba(165,175,214,.7)', lineHeight:1.45 }}>Top-quality IELTS materials</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position:'absolute', bottom:20, right:32, zIndex:10 }}>
        <p style={{ margin:0, fontSize:11, fontWeight:300, letterSpacing:1, color:'rgba(165,175,214,.35)' }}>
          © 2026 <span style={{ color:'#5B8CFF', fontWeight:500 }}>IELTSSHOKH</span>. ALL RIGHTS RESERVED.
        </p>
      </div>

    </div>
  )
}
