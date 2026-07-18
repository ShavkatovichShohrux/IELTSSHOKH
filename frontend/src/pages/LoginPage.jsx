import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'

const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

// Twinkling star particles for animation layer
const STARS = (() => {
  const arr = []; let s = 300
  while (arr.length < 80) {
    const x = rnd(s++) * 100, y = rnd(s++) * 100
    // avoid center card area
    if (x > 25 && x < 75 && y > 28 && y < 90) continue
    arr.push({
      x: +x.toFixed(2), y: +y.toFixed(2),
      r: +(0.5 + rnd(s++) * 2).toFixed(2),
      dur: +(2 + rnd(s++) * 5).toFixed(2),
      delay: +(rnd(s++) * 6).toFixed(2),
      o: +(0.2 + rnd(s++) * 0.65).toFixed(2),
    })
  }
  return arr
})()

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
      <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/></>
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
  const bgRef       = useRef(null)

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

  // Parallax on background image
  const onMove = e => {
    if (!bgRef.current) return
    const nx = (e.clientX / window.innerWidth  - 0.5) * 2
    const ny = (e.clientY / window.innerHeight - 0.5) * 2
    bgRef.current.style.transform = `scale(1.07) translate3d(${(nx * 14).toFixed(1)}px,${(ny * 10).toFixed(1)}px,0)`
  }
  const onLeave = () => { if (bgRef.current) bgRef.current.style.transform = 'scale(1.07)' }

  return (
    <div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        position: 'relative', minHeight: '100vh', width: '100%', overflow: 'hidden',
        background: '#020810',
        color: '#fff',
        fontFamily: "'Inter',-apple-system,'Segoe UI',system-ui,sans-serif",
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        @keyframes lgTwinkle { 0%,100%{ opacity:var(--so); } 50%{ opacity:calc(var(--so)*.15); } }
        @keyframes lgGlowP   { 0%,100%{ opacity:.6; transform:translate(-50%,-50%) scale(1); }
                               50%{ opacity:1; transform:translate(-50%,-50%) scale(1.06); } }
        @keyframes lgBeam    { 0%,100%{ opacity:.45;box-shadow:0 0 28px 10px rgba(50,145,255,.7); }
                               50%{ opacity:.95;box-shadow:0 0 50px 18px rgba(60,170,255,.95); } }
        @keyframes lgRingP   { 0%,100%{ opacity:.5;transform:translate(-50%,-50%) scale(1); }
                               50%{ opacity:.9;transform:translate(-50%,-50%) scale(1.04); } }
        @keyframes lgSpin    { to { transform:translate(-50%,-50%) rotate(360deg); } }
        @keyframes lgSpinR   { to { transform:translate(-50%,-50%) rotate(-360deg); } }
        @keyframes lgFloat   { 0%,100%{ transform:translateY(0) rotate(var(--r,0deg)); }
                               50%{ transform:translateY(-12px) rotate(calc(var(--r,0deg)+10deg)); } }

        .lg-input { background:transparent;border:none;outline:none;flex:1;min-width:0;
                    color:#EAF0FF;font-size:15px;font-weight:400;letter-spacing:.2px;
                    font-family:inherit;height:100%; }
        .lg-input::placeholder { color:#8C97B8;font-weight:300; }
        .lg-field { transition:border-color .2s,box-shadow .2s; }
        .lg-field:focus-within { border-color:rgba(90,140,255,.7)!important;
                    box-shadow:0 0 0 3px rgba(70,120,255,.18),0 0 30px rgba(50,110,255,.25)!important; }
        .lg-eye   { background:none;border:none;cursor:pointer;padding:4px;display:flex;align-items:center;opacity:.85; }
        .lg-eye:hover { opacity:1; }
        .lg-btn   { transition:transform .2s,box-shadow .2s,filter .2s; }
        .lg-btn:hover:not(:disabled) { transform:translateY(-2px);
                    box-shadow:0 18px 55px rgba(36,76,255,.6),0 0 35px rgba(60,140,255,.5)!important;
                    filter:brightness(1.08); }
        .lg-btn:active:not(:disabled) { transform:translateY(0); }
        .lg-link  { color:#6E93FF;text-decoration:none;transition:color .15s; }
        .lg-link:hover { color:#9DB8FF; }
        .lg-fcard { transition:border-color .25s,box-shadow .25s,transform .25s; }
        .lg-fcard:hover { border-color:rgba(110,155,255,.5)!important;transform:translateY(-3px);
                    box-shadow:0 14px 44px rgba(0,0,0,.5),0 0 36px rgba(50,120,255,.18)!important; }

        @media (max-width:1180px){ .lg-side  { display:none!important; } }
        @media (max-width:900px) { .lg-vtext { display:none!important; } }
        @media (prefers-reduced-motion:reduce){
          .lg-star,.lg-sq,.lg-beam,.lg-ring,.lg-hud,.lg-glowp { animation:none!important; }
          img[data-bg] { transition:none!important; }
        }
      `}</style>

      {/* ── Background image (parallax) ── */}
      <img
        ref={bgRef}
        src="/login-bg.jpg"
        alt=""
        data-bg="1"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center',
          transform: 'scale(1.07)',
          transition: 'transform .35s ease-out',
          willChange: 'transform',
          userSelect: 'none', pointerEvents: 'none',
        }}
      />

      {/* Dark overlay — tones down image so HTML text is crisp */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(2,6,16,.52) 0%, rgba(2,6,16,.42) 45%, rgba(2,6,16,.62) 80%, rgba(2,6,16,.78) 100%)',
      }}/>

      {/* ── Animation layer (on top of image) ── */}

      {/* Pulsing planet glow — reinforces image glow with animation */}
      <div className="lg-glowp" style={{
        position: 'absolute', left: '50%', top: '30vh',
        transform: 'translate(-50%,-50%)',
        width: '160vh', height: '160vh', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(15,75,240,.28) 0%, rgba(10,55,200,.14) 35%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        animation: 'lgGlowP 8s ease-in-out infinite',
      }}/>

      {/* HUD orbit rings */}
      {[{ sz: 108, dur: 50, dir: 'lgSpin' }, { sz: 132, dur: 76, dir: 'lgSpinR' }].map((r, i) => (
        <div key={i} className="lg-hud" style={{
          position: 'absolute', left: '50%', top: '30vh',
          width: `${r.sz}vh`, height: `${r.sz}vh`, borderRadius: '50%',
          border: '1px solid rgba(80,160,255,.09)',
          transform: 'translate(-50%,-50%)',
          animation: `${r.dir} ${r.dur}s linear infinite`,
          pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', top: -3, left: '50%', marginLeft: -3,
            width: 5, height: 5, borderRadius: '50%',
            background: '#9ECEFF',
            boxShadow: '0 0 14px 4px rgba(110,195,255,.95)',
          }}/>
        </div>
      ))}

      {/* Twinkling star particles */}
      {STARS.map((s, i) => (
        <div key={i} className="lg-star" style={{
          position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
          width: s.r, height: s.r, borderRadius: '50%',
          background: '#d8eaff', opacity: s.o, '--so': s.o,
          boxShadow: `0 0 ${s.r * 2.5}px rgba(150,200,255,.85)`,
          animation: `lgTwinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          pointerEvents: 'none',
        }}/>
      ))}

      {/* Floating corner squares */}
      {[
        { x: '7%',  y: '28%', s: 8,  dur: 7,   delay: 0,   rot: 0  },
        { x: '91%', y: '26%', s: 7,  dur: 8.5, delay: 1.2, rot: 45 },
        { x: '4%',  y: '62%', s: 6,  dur: 9,   delay: .6,  rot: 45 },
        { x: '93%', y: '60%', s: 6,  dur: 7.5, delay: 1.8, rot: 0  },
        { x: '14%', y: '15%', s: 5,  dur: 10,  delay: 2.4, rot: 0  },
        { x: '83%', y: '14%', s: 5,  dur: 8,   delay: .9,  rot: 45 },
      ].map((q, i) => (
        <div key={i} className="lg-sq" style={{
          position: 'absolute', left: q.x, top: q.y, width: q.s, height: q.s,
          border: '1px solid rgba(90,155,255,.35)', background: 'rgba(60,120,255,.07)',
          '--r': `${q.rot}deg`, transform: `rotate(${q.rot}deg)`,
          animation: `lgFloat ${q.dur}s ease-in-out ${q.delay}s infinite`,
          pointerEvents: 'none',
        }}/>
      ))}

      {/* Animated holographic platform — overlays on top of image's platform */}
      <div style={{
        position: 'absolute', bottom: '-3vh', left: '50%',
        transform: 'translateX(-50%)', width: 700, height: 200,
        pointerEvents: 'none',
      }}>
        {/* Center beam */}
        <div style={{
          position: 'absolute', left: '50%', top: '28%', transform: 'translateX(-50%)',
          width: 3, height: 110,
          background: 'linear-gradient(to top, rgba(60,170,255,.8), rgba(100,210,255,.5), transparent)',
          filter: 'blur(.4px)',
        }}/>
        {/* Center glow dot */}
        <div className="lg-beam" style={{
          position: 'absolute', left: '50%', top: '60%',
          transform: 'translate(-50%,-50%)',
          width: 14, height: 14, borderRadius: '50%',
          background: 'rgba(140,205,255,.98)',
          animation: 'lgBeam 3s ease-in-out infinite',
        }}/>
        {/* Concentric ellipse rings */}
        {[
          { w: 660, h: 164, o: .32, d: '0s'   },
          { w: 520, h: 130, o: .42, d: '.25s'  },
          { w: 390, h:  97, o: .55, d: '.5s'   },
          { w: 268, h:  66, o: .68, d: '.75s'  },
          { w: 168, h:  42, o: .80, d: '1s'    },
          { w:  88, h:  22, o: .92, d: '1.2s'  },
        ].map((r, i) => (
          <div key={i} className="lg-ring" style={{
            position: 'absolute', left: '50%', top: '60%',
            transform: 'translate(-50%,-50%)',
            width: r.w, height: r.h, borderRadius: '50%',
            border: `1px solid rgba(40,155,255,${r.o})`,
            boxShadow: `0 0 ${8 + i * 3}px rgba(35,145,255,${r.o * .5})`,
            animation: `lgRingP ${3.2 + i * .38}s ease-in-out ${r.d} infinite`,
          }}/>
        ))}
      </div>

      {/* ── Foreground UI ── */}

      {/* Header */}
      <div style={{ position: 'absolute', top: 28, left: 36, zIndex: 10, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 34, height: 1, background: 'rgba(180,205,255,.4)' }}/>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500, letterSpacing: 10, color: '#EAF0FF' }}>IELTSSHOKH</div>
          <div style={{ fontSize: 9, fontWeight: 300, letterSpacing: 5, color: 'rgba(165,180,220,.75)', marginTop: 5 }}>MASTER YOUR SPEAKING</div>
        </div>
      </div>

      {/* Left vertical text */}
      <div className="lg-vtext" style={{
        position: 'absolute', left: 26, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {['FOCUS', 'PRACTICE', 'ACHIEVE'].map((w, i) => (
          <div key={w} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {i > 0 && <div style={{ width: 1, height: 22, background: 'rgba(100,158,255,.38)', margin: '6px 0' }}/>}
            <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', fontSize: 9, fontWeight: 400, letterSpacing: 8, color: 'rgba(165,180,220,.38)' }}>{w}</span>
          </div>
        ))}
      </div>

      {/* Center column */}
      <div style={{
        position: 'relative', zIndex: 10, minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '100px 20px 130px',
      }}>

        {/* Headline */}
        <div style={{ textAlign: 'center', marginBottom: 34 }}>
          <div style={{ fontSize: 13, fontWeight: 500, letterSpacing: 8, color: '#5D87FF', opacity: .9, marginBottom: 20 }}>
            WELCOME&nbsp;BACK
          </div>
          <h1 style={{
            margin: '0 0 16px', fontWeight: 300, lineHeight: 1.16, letterSpacing: '-0.5px',
            fontSize: 'clamp(34px,4.6vw,64px)', color: '#fff',
            textShadow: '0 0 60px rgba(30,80,255,.35)',
          }}>
            Every step you take<br/>
            builds your <span style={{ color: '#5B8CFF', fontWeight: 400 }}>future.</span>
          </h1>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 300, color: 'rgba(255,255,255,.72)', letterSpacing: '.4px' }}>
            Discipline today, success tomorrow.
          </p>
        </div>

        {/* Login card */}
        <div style={{
          width: 'min(560px,92vw)', borderRadius: 28,
          background: 'rgba(7,12,28,.82)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(70,130,255,.3)',
          boxShadow: '0 0 80px rgba(25,75,220,.15), inset 0 1px 0 rgba(255,255,255,.05)',
          padding: '40px 44px 34px',
        }}>
          <form onSubmit={submit}>

            {/* Username */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: 2, color: '#A5AFD6', marginBottom: 11 }}>
                USERNAME
              </label>
              <div className="lg-field" style={{
                height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px',
                background: 'rgba(4,8,22,.7)', border: '1px solid rgba(90,140,255,.24)',
              }}>
                <IconUser/>
                <input className="lg-input" type="text" placeholder="Enter your username"
                  value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  autoComplete="username"/>
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 30 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: 2, color: '#A5AFD6', marginBottom: 11 }}>
                PASSWORD
              </label>
              <div className="lg-field" style={{
                height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px 0 18px',
                background: 'rgba(4,8,22,.7)', border: '1px solid rgba(90,140,255,.24)',
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

            {/* Submit button */}
            <button type="submit" disabled={loading} className="lg-btn" style={{
              width: '100%', height: 70, borderRadius: 18, border: 'none',
              cursor: loading ? 'wait' : 'pointer',
              background: 'linear-gradient(180deg,#244CFF 0%,#1638D4 100%)',
              color: '#fff', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 34px rgba(28,68,230,.5)',
            }}>
              <span style={{
                position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                width: 48, height: 48, borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 22px rgba(120,175,255,.55)', background: 'rgba(255,255,255,.07)',
              }}>
                <IconArrow/>
              </span>
              <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: 2 }}>
                {loading ? 'KIRISH...' : 'ACCESS DASHBOARD'}
              </span>
            </button>

            {/* Divider + register link */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '22px 0 14px' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(90,140,255,.16)' }}/>
              <span style={{ fontSize: 12, color: 'rgba(165,180,220,.52)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(90,140,255,.16)' }}/>
            </div>
            <div style={{ textAlign: 'center', fontSize: 13.5, color: 'rgba(165,180,220,.82)' }}>
              Don't have an account? <a href="/register" className="lg-link" style={{ fontWeight: 500 }}>Create one</a>
            </div>

          </form>
        </div>
      </div>

      {/* Feature cards */}
      <div className="lg-side lg-fcard" style={{
        position: 'absolute', left: '3%', top: '63%', zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 14, maxWidth: 240,
        padding: '16px 20px', borderRadius: 16,
        background: 'rgba(6,11,26,.6)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(90,140,255,.22)',
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(30,80,190,.18)', border: '1px solid rgba(70,125,255,.24)',
        }}><IconFingerprint/></div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: '#DCE6FF', marginBottom: 5 }}>SECURE ACCESS</div>
          <div style={{ fontSize: 11.5, fontWeight: 300, color: 'rgba(165,180,220,.72)', lineHeight: 1.45 }}>Your data is 100% protected</div>
        </div>
      </div>

      <div className="lg-side lg-fcard" style={{
        position: 'absolute', right: '3%', top: '63%', zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 14, maxWidth: 240,
        padding: '16px 20px', borderRadius: 16,
        background: 'rgba(6,11,26,.6)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(90,140,255,.22)',
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(30,80,190,.18)', border: '1px solid rgba(70,125,255,.24)',
        }}><IconDiamond/></div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: '#DCE6FF', marginBottom: 5 }}>PREMIUM CONTENT</div>
          <div style={{ fontSize: 11.5, fontWeight: 300, color: 'rgba(165,180,220,.72)', lineHeight: 1.45 }}>Top-quality IELTS materials</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: 20, right: 32, zIndex: 10 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 300, letterSpacing: 1, color: 'rgba(165,180,220,.36)' }}>
          © 2026 <span style={{ color: '#5B8CFF', fontWeight: 500 }}>IELTSSHOKH</span>. ALL RIGHTS RESERVED.
        </p>
      </div>

    </div>
  )
}
