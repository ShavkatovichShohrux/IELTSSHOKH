import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'

// Reference render lives in public/ → served at site root
const bg = '/login-bg.jpg'

/*
 * The login page is a pixel-perfect overlay on the reference render
 * (login-bg.jpg, 1280×853). The image supplies all core visuals; live
 * interactive pieces (inputs, button, eye toggle, Create-one link) are
 * overlaid at exact measured pixel coordinates inside a fixed 1280:853 stage.
 *
 * On top of the flat render we add subtle "alive" layers — clarity filter,
 * mouse parallax, a breathing globe aura, twinkling stars, rising light motes
 * and a pulsing beam — all pointer-events:none so they never block the form.
 */
const IMG_W = 1280, IMG_H = 853
const pctX = px => `${(px / IMG_W * 100).toFixed(3)}%`
const pctY = py => `${(py / IMG_H * 100).toFixed(3)}%`

// Field geometry in source pixels (measured by column pixel-scan)
const FIELD_L = 414, FIELD_R = 867
const U_TOP = 396, U_BOT = 444            // username field (border-to-border)
const P_TOP = 490, P_BOT = 538            // password field
const B_TOP = 558, B_BOT = 604            // ACCESS DASHBOARD button
const CREATE_L = 720, CREATE_R = 794, CREATE_TOP = 666, CREATE_BOT = 690

const fieldBox = (top, bot) => ({
  position:'absolute',
  left:  pctX(FIELD_L),
  top:   pctY(top),
  width: pctX(FIELD_R - FIELD_L),
  height:pctY(bot - top),
})

/* ── Decorative particle data (deterministic, generated once) ──────────── */
const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
const STARS = (() => {
  const arr = []; let s = 1
  while (arr.length < 46) {
    const x = rnd(s++) * 100, y = rnd(s++) * 100
    // keep clear of the login card so stars don't clutter the form
    if (x > 27 && x < 73 && y > 40 && y < 87) continue
    arr.push({
      x: +x.toFixed(2), y: +y.toFixed(2),
      r: +(0.6 + rnd(s++) * 1.7).toFixed(2),
      dur: +(2.4 + rnd(s++) * 4.5).toFixed(2),
      delay: +(rnd(s++) * 5).toFixed(2),
      o: +(0.35 + rnd(s++) * 0.55).toFixed(2),
    })
  }
  return arr
})()
const MOTES = Array.from({ length: 8 }, (_, i) => ({
  x: +(40 + rnd(i * 3 + 2) * 20).toFixed(2),   // 40–60% (over water/beam)
  dur: +(7 + rnd(i * 3 + 3) * 6).toFixed(2),
  delay: +(rnd(i * 3 + 4) * 8).toFixed(2),
  size: +(2 + rnd(i * 3 + 5) * 2.5).toFixed(2),
}))

/* ── Icons ─────────────────────────────────────────────────────────────── */
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="rgba(120,165,235,.82)" strokeWidth="2" strokeLinecap="round"
    style={{ width:'1.35cqw', height:'1.35cqw' }}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="rgba(120,165,235,.82)" strokeWidth="2" strokeLinecap="round"
    style={{ width:'1.35cqw', height:'1.35cqw' }}>
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IconEye = ({ off }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="rgba(140,175,235,.72)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ width:'1.4cqw', height:'1.4cqw' }}>
    {off ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </>
    )}
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
      navigate(
        res.data.user.role === 'admin' ? '/admin'
        : from && from !== '/' ? from : '/tests',
        { replace: true }
      )
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login yoki parol noto'g'ri")
    } finally {
      setLoading(false)
    }
  }

  // Mouse parallax — shifts the whole scene (image + form together) so
  // alignment is preserved while adding depth/life.
  const BASE = 'scale(1.055)'
  const onMove = e => {
    const el = sceneRef.current; if (!el) return
    const r = e.currentTarget.getBoundingClientRect()
    const nx = ((e.clientX - r.left) / r.width  - 0.5) * 2
    const ny = ((e.clientY - r.top)  / r.height - 0.5) * 2
    el.style.transform = `${BASE} translate3d(${(-nx * 1.15).toFixed(2)}%, ${(-ny * 1.15).toFixed(2)}%, 0)`
  }
  const onLeave = () => { if (sceneRef.current) sceneRef.current.style.transform = `${BASE} translate3d(0,0,0)` }

  const fillStyle = {
    position:'absolute', inset:0,
    background:'#03030b',
    border:'1px solid rgba(58,104,205,.20)',
    borderRadius:'0.85cqw',
    display:'flex', alignItems:'center',
    boxSizing:'border-box',
    paddingLeft:'1.15cqw', paddingRight:'1.15cqw',
    gap:'0.9cqw',
  }
  const inputStyle = {
    flex:1, minWidth:0, height:'100%',
    background:'transparent', border:'none', outline:'none',
    color:'#e2ecff', fontSize:'1.18cqw', letterSpacing:'0.2px',
    fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",
  }

  return (
    <>
      <style>{`
        @keyframes lpxTwinkle { 0%,100%{ opacity:var(--o); transform:scale(1); } 50%{ opacity:calc(var(--o)*.22); transform:scale(.55); } }
        @keyframes lpxAura    { 0%,100%{ opacity:.55; transform:translate(-50%,-50%) scale(1); } 50%{ opacity:.95; transform:translate(-50%,-50%) scale(1.07); } }
        @keyframes lpxBeam    { 0%,100%{ opacity:.4; } 50%{ opacity:.9; } }
        @keyframes lpxMote    { 0%{ transform:translateY(10px); opacity:0; } 18%{ opacity:.75; } 82%{ opacity:.45; } 100%{ transform:translateY(-150px); opacity:0; } }
        @keyframes lpxSweep   { 0%{ transform:translate(-50%,-50%) rotate(0deg); } 100%{ transform:translate(-50%,-50%) rotate(360deg); } }
        .lpx-input::placeholder{ color:rgba(150,172,208,.72); font-weight:400; }
        .lpx-eye{ background:none;border:none;cursor:pointer;padding:0;display:flex;align-items:center;transition:transform .15s; }
        .lpx-eye:hover{ transform:scale(1.12); }
        .lpx-btn{ transition:filter .2s; }
        .lpx-btn:hover:not(:disabled){ filter:brightness(1.14) drop-shadow(0 0 10px rgba(60,130,255,.5)); }
        .lpx-field{ transition:box-shadow .2s; border-radius:0.85cqw; }
        .lpx-field:focus-within{ box-shadow:0 0 0 2px rgba(70,140,255,.4), 0 0 22px rgba(50,120,255,.28); }
        @media (prefers-reduced-motion: reduce){
          .lpx-star, .lpx-mote, .lpx-aura, .lpx-beam, .lpx-sweep { animation:none !important; }
        }
      `}</style>

      <div style={{
        minHeight:'100vh', width:'100%',
        background:'#010103',
        display:'flex', alignItems:'center', justifyContent:'center',
        overflow:'hidden',
      }}>
        {/* Fixed-aspect stage (clipping container) */}
        <div
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          style={{
            position:'relative',
            width:'min(100vw, calc(100vh * 1280 / 853))',
            aspectRatio:'1280 / 853',
            overflow:'hidden',
            containerType:'inline-size',
            userSelect:'none',
          }}
        >
          {/* Scene — parallax-transformed; holds image, glow layers AND form
              so everything moves together and stays aligned. */}
          <div ref={sceneRef} style={{
            position:'absolute', inset:0,
            transform:`${BASE} translate3d(0,0,0)`,
            transition:'transform .25s ease-out',
            willChange:'transform',
          }}>

            {/* Base render + clarity boost */}
            <div style={{
              position:'absolute', inset:0,
              backgroundImage:`url(${bg})`,
              backgroundSize:'100% 100%',
              backgroundRepeat:'no-repeat',
              filter:'contrast(1.08) saturate(1.18) brightness(1.03)',
            }}/>

            {/* Vignette — deepens edges, lifts focus to centre */}
            <div style={{
              position:'absolute', inset:0, pointerEvents:'none',
              background:'radial-gradient(ellipse 75% 75% at 50% 42%, transparent 55%, rgba(0,0,6,.32) 100%)',
            }}/>

            {/* Globe breathing aura (screen-blend light over the planet) */}
            <div className="lpx-aura" style={{
              position:'absolute', left:'50%', top:'30.5%',
              width:'42%', aspectRatio:'1', borderRadius:'50%',
              transform:'translate(-50%,-50%)',
              background:'radial-gradient(circle, rgba(70,140,255,.20) 0%, rgba(40,100,240,.10) 42%, transparent 66%)',
              mixBlendMode:'screen', pointerEvents:'none',
              animation:'lpxAura 6s ease-in-out infinite',
            }}/>

            {/* Slow light sweep across the globe */}
            <div className="lpx-sweep" style={{
              position:'absolute', left:'50%', top:'30.5%',
              width:'50%', aspectRatio:'1', borderRadius:'50%',
              transform:'translate(-50%,-50%)',
              background:'conic-gradient(from 0deg, transparent 0deg, rgba(90,160,255,.10) 40deg, transparent 120deg, transparent 360deg)',
              mixBlendMode:'screen', pointerEvents:'none',
              animation:'lpxSweep 22s linear infinite',
            }}/>

            {/* Twinkling stars */}
            {STARS.map((s, i) => (
              <div key={i} className="lpx-star" style={{
                position:'absolute', left:`${s.x}%`, top:`${s.y}%`,
                width:s.r, height:s.r, borderRadius:'50%',
                background:'#dbe8ff',
                boxShadow:`0 0 ${s.r * 2.4}px rgba(150,190,255,.8)`,
                '--o': s.o,
                opacity:s.o,
                mixBlendMode:'screen', pointerEvents:'none',
                animation:`lpxTwinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
              }}/>
            ))}

            {/* Rising light motes near the beam/water */}
            {MOTES.map((m, i) => (
              <div key={i} className="lpx-mote" style={{
                position:'absolute', left:`${m.x}%`, top:'93%',
                width:m.size, height:m.size, borderRadius:'50%',
                background:'rgba(120,180,255,.9)',
                boxShadow:'0 0 6px rgba(90,160,255,.9)',
                filter:'blur(.4px)',
                mixBlendMode:'screen', pointerEvents:'none',
                animation:`lpxMote ${m.dur}s ease-in-out ${m.delay}s infinite`,
              }}/>
            ))}

            {/* Pulsing beam glow at the ring centre */}
            <div className="lpx-beam" style={{
              position:'absolute', left:'50%', top:'90.5%',
              width:'15%', height:'8%',
              transform:'translate(-50%,-50%)',
              background:'radial-gradient(ellipse at center, rgba(90,165,255,.55) 0%, transparent 68%)',
              mixBlendMode:'screen', pointerEvents:'none',
              animation:'lpxBeam 3.4s ease-in-out infinite',
            }}/>

            {/* ══ INTERACTIVE FORM (aligned to the render) ══ */}
            <form onSubmit={submit} style={{ position:'absolute', inset:0 }}>

              {/* USERNAME */}
              <div className="lpx-field" style={fieldBox(U_TOP, U_BOT)}>
                <div style={fillStyle}>
                  <IconUser/>
                  <input
                    className="lpx-input"
                    type="text"
                    placeholder="Enter your username"
                    value={form.username}
                    onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                    autoComplete="username"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="lpx-field" style={fieldBox(P_TOP, P_BOT)}>
                <div style={fillStyle}>
                  <IconLock/>
                  <input
                    className="lpx-input"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    autoComplete="current-password"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    className="lpx-eye"
                    onClick={() => setShowPw(v => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    <IconEye off={showPw}/>
                  </button>
                </div>
              </div>

              {/* ACCESS DASHBOARD — transparent clickable overlay */}
              <button
                type="submit"
                disabled={loading}
                className="lpx-btn"
                style={{
                  ...fieldBox(B_TOP, B_BOT),
                  background:'transparent', border:'none',
                  cursor: loading ? 'wait' : 'pointer',
                  borderRadius:'0.9cqw',
                }}
                aria-label="Access dashboard"
              />

              {/* CREATE ONE — transparent link overlay */}
              <a
                href="/register"
                style={{
                  position:'absolute',
                  left:  pctX(CREATE_L - 6),
                  top:   pctY(CREATE_TOP - 4),
                  width: pctX((CREATE_R - CREATE_L) + 12),
                  height:pctY((CREATE_BOT - CREATE_TOP) + 8),
                  cursor:'pointer',
                }}
                aria-label="Create an account"
              />

            </form>
          </div>
        </div>
      </div>
    </>
  )
}
