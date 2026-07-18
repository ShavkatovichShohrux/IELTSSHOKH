import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'

/* ── City-lights dots for Earth at night ──────────────────────────────── */
function genEarthDots() {
  const dots = []
  const cx = 300, cy = 290, R = 272
  const seed = (n) => { let x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x) }
  const clusters = [
    // Europe
    { nx: -0.05, ny: -0.18, spread: 0.28, count: 60, bright: 0.85 },
    // East Asia / China
    { nx:  0.38, ny: -0.10, spread: 0.26, count: 55, bright: 0.80 },
    // Japan
    { nx:  0.58, ny: -0.22, spread: 0.10, count: 28, bright: 0.95 },
    // India
    { nx:  0.18, ny:  0.18, spread: 0.13, count: 30, bright: 0.78 },
    // SE Asia
    { nx:  0.38, ny:  0.28, spread: 0.12, count: 22, bright: 0.72 },
    // Middle East
    { nx:  0.08, ny:  0.02, spread: 0.13, count: 20, bright: 0.70 },
    // North America East
    { nx: -0.52, ny: -0.20, spread: 0.20, count: 45, bright: 0.88 },
    // North America West
    { nx: -0.62, ny: -0.10, spread: 0.14, count: 22, bright: 0.75 },
    // South America
    { nx: -0.38, ny:  0.32, spread: 0.18, count: 20, bright: 0.65 },
    // Australia
    { nx:  0.52, ny:  0.35, spread: 0.15, count: 18, bright: 0.70 },
    // North Africa
    { nx: -0.08, ny:  0.10, spread: 0.20, count: 15, bright: 0.55 },
    // Russia
    { nx:  0.15, ny: -0.35, spread: 0.30, count: 18, bright: 0.50 },
    // Scattered random
    { nx:  0.00, ny:  0.00, spread: 0.90, count: 80, bright: 0.30 },
  ]
  let idx = 0
  clusters.forEach(({ nx, ny, spread, count, bright }) => {
    for (let i = 0; i < count; i++) {
      const angle = seed(idx++) * Math.PI * 2
      const rad   = seed(idx++) * spread * R
      const x = cx + (nx * R) + Math.cos(angle) * rad
      const y = cy + (ny * R * 0.88) + Math.sin(angle) * rad * 0.78
      const dx = (x - cx) / R, dy = (y - cy) / R
      if (dx*dx + dy*dy > 0.88) continue
      const r = 0.6 + seed(idx++) * 2.2
      const o = (0.35 + seed(idx++) * 0.65) * bright
      dots.push({ x: +x.toFixed(1), y: +y.toFixed(1), r: +r.toFixed(1), o: +o.toFixed(2) })
    }
  })
  return dots
}
const EARTH_DOTS = genEarthDots()

/* ── Icons ────────────────────────────────────────────────────────────── */
const IconUser = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(120,160,255,0.75)" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconLock = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(120,160,255,0.75)" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IconEye = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(120,160,255,0.6)" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const IconEyeOff = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(120,160,255,0.6)" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)
const IconArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
)
const IconFingerprint = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,255,0.9)" strokeWidth="1.5">
    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
    <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
    <path d="M2 12a10 10 0 0 1 18-6"/>
    <path d="M2 17.5c2.25 0 8.5-.5 8.5-5.5"/>
    <path d="M5.45 5.11A7 7 0 0 1 19 12c-.06 2-.48 2.91-.52 3"/>
    <path d="M21.5 12A9.5 9.5 0 0 0 3 9.5"/>
    <path d="M7 22c.9-3.3 1-5.5 1-9"/>
    <path d="M9 12c0-2.21 1.79-4 4-4"/>
  </svg>
)
const IconDiamond = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,255,0.9)" strokeWidth="1.5">
    <polygon points="6 3 18 3 22 9 12 22 2 9"/>
    <line x1="2" y1="9" x2="22" y2="9"/>
    <line x1="12" y1="3" x2="6" y2="9"/>
    <line x1="12" y1="3" x2="18" y2="9"/>
  </svg>
)

/* ── Mountain SVG ─────────────────────────────────────────────────────── */
const Mountains = () => (
  <svg viewBox="0 0 1440 320" preserveAspectRatio="none"
    style={{ width:'100%', height:'100%', display:'block' }}>
    <defs>
      <linearGradient id="mtnGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#050d24"/>
        <stop offset="100%" stopColor="#020810"/>
      </linearGradient>
    </defs>
    {/* Far mountains — lighter */}
    <path d="M0,280 L80,210 L160,240 L260,170 L360,220 L450,155 L540,200 L640,140 L720,185 L820,130 L900,170 L1000,120 L1100,165 L1200,110 L1300,155 L1380,130 L1440,160 L1440,320 L0,320 Z"
      fill="rgba(5,15,45,0.6)"/>
    {/* Mid mountains */}
    <path d="M0,300 L60,255 L130,275 L210,230 L310,260 L400,210 L480,245 L570,195 L660,235 L760,185 L850,220 L950,175 L1040,215 L1150,168 L1240,205 L1340,175 L1440,195 L1440,320 L0,320 Z"
      fill="rgba(4,12,35,0.75)"/>
    {/* Front mountains — darkest */}
    <path d="M0,320 L50,285 L110,300 L185,268 L260,292 L340,258 L420,280 L500,252 L580,275 L660,248 L740,270 L820,242 L900,265 L980,240 L1060,262 L1150,238 L1230,258 L1320,238 L1440,255 L1440,320 Z"
      fill="url(#mtnGrad)"/>
  </svg>
)

export default function LoginPage() {
  const [form, setForm]     = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate    = useNavigate()
  const location    = useLocation()
  const from        = location.state?.from?.pathname

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

  return (
    <>
      <style>{`
        @keyframes globeGlow {
          0%,100% { box-shadow: 0 0 80px 20px rgba(30,90,255,.50), 0 0 180px 40px rgba(20,60,200,.22), inset 0 0 80px 10px rgba(10,40,160,.18); }
          50%      { box-shadow: 0 0 120px 30px rgba(40,110,255,.70), 0 0 260px 60px rgba(20,60,200,.32), inset 0 0 110px 15px rgba(10,40,160,.28); }
        }
        @keyframes ringPulse {
          0%,100% { opacity:.5; transform:scaleX(1) scaleY(1); }
          50%      { opacity:.8; transform:scaleX(1.03) scaleY(1.03); }
        }
        @keyframes flt1 { 0%,100%{transform:translateY(0) rotate(0deg)}   50%{transform:translateY(-14px) rotate(18deg)} }
        @keyframes flt2 { 0%,100%{transform:translateY(0) rotate(45deg)}  50%{transform:translateY(-10px) rotate(63deg)} }
        @keyframes flt3 { 0%,100%{transform:translateY(0) rotate(12deg)}  50%{transform:translateY(-16px) rotate(-5deg)} }
        @keyframes flt4 { 0%,100%{transform:translateY(0) rotate(30deg)}  50%{transform:translateY(-8px)  rotate(50deg)} }
        @keyframes starTwinkle { 0%,100%{opacity:.18} 50%{opacity:.55} }
        .li  { user-select:text!important;-webkit-user-select:text!important; }
        .li:focus { outline:none!important; border-color:rgba(74,108,247,.8)!important; box-shadow:0 0 0 3px rgba(74,108,247,.14)!important; }
        .abtn { transition:all .2s; }
        .abtn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 36px rgba(50,100,255,.6)!important; }
        .fcard { transition:border-color .22s,box-shadow .22s; }
        .fcard:hover { border-color:rgba(74,108,247,.45)!important; box-shadow:0 4px 24px rgba(74,108,247,.12)!important; }
      `}</style>

      <div style={{
        minHeight:'100vh', background:'#030b1a',
        position:'relative', overflow:'hidden',
        fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",
      }}>

        {/* ── GLOBE ─────────────────────────────────────────────────── */}
        <div style={{
          position:'absolute', top:-60, left:'50%',
          transform:'translateX(-50%)',
          width:640, height:640,
          borderRadius:'50%',
          background:'radial-gradient(ellipse at 55% 35%, #0d2a5e 0%, #061535 30%, #030d28 58%, #010810 100%)',
          border:'1.5px solid rgba(60,120,255,.35)',
          animation:'globeGlow 5s ease-in-out infinite',
          zIndex:1,
          flexShrink:0,
        }}>
          {/* atmosphere rim */}
          <div style={{
            position:'absolute', inset:-2, borderRadius:'50%',
            background:'radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(40,100,255,.28) 80%, rgba(20,60,200,.55) 95%, transparent 100%)',
            pointerEvents:'none',
          }}/>
          {/* latitude lines */}
          {[0.25,0.45,0.65,0.80].map((f,i) => (
            <div key={i} style={{
              position:'absolute',
              left:`${(1-f)*50}%`, top:`${(1-f)*50}%`,
              width:`${f*100}%`, height:`${f*100}%`,
              borderRadius:'50%',
              border:'1px solid rgba(80,140,255,.06)',
              pointerEvents:'none',
            }}/>
          ))}
          {/* city lights SVG */}
          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', borderRadius:'50%' }}
            viewBox="0 0 600 580">
            <defs>
              <radialGradient id="dotGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#aac4ff" stopOpacity="1"/>
                <stop offset="100%" stopColor="#6699ff" stopOpacity="0"/>
              </radialGradient>
            </defs>
            {EARTH_DOTS.map((d,i) => (
              <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#aac4ff" opacity={d.o}/>
            ))}
            {/* bright city clusters */}
            {[
              [285,195,5],[310,188,4],[268,200,4.5],[255,185,3.5],
              [340,175,4],[360,182,3.5],[380,168,5],[395,178,3],
              [420,165,4.5],[408,155,3.5],
              [220,210,4],[238,205,3.5],
              [185,200,3.5],[175,210,3],
              [320,225,4],[335,232,3.5],
              [460,210,3.5],[475,200,3],
            ].map(([x,y,r],i) => (
              <circle key={`bc${i}`} cx={x} cy={y} r={r} fill="white" opacity={0.6+i%3*0.1}/>
            ))}
          </svg>
          {/* top atmospheric glow */}
          <div style={{
            position:'absolute', inset:0, borderRadius:'50%',
            background:'radial-gradient(ellipse 70% 35% at 50% 10%, rgba(70,130,255,.18) 0%, transparent 70%)',
            pointerEvents:'none',
          }}/>
        </div>

        {/* ── MOUNTAINS ─────────────────────────────────────────────── */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0,
          height:260, zIndex:2, pointerEvents:'none',
        }}>
          <Mountains/>
        </div>

        {/* ── HOLOGRAPHIC RINGS (bottom center) ─────────────────────── */}
        <div style={{
          position:'absolute', bottom:-30, left:'50%',
          transform:'translateX(-50%)',
          zIndex:3, pointerEvents:'none',
          width:600, height:160,
        }}>
          {[600,480,360,250,150,80].map((w,i) => (
            <div key={i} style={{
              position:'absolute',
              left:'50%', top:'50%',
              transform:'translate(-50%,-50%)',
              width:w, height:w*0.28,
              borderRadius:'50%',
              border:`1px solid rgba(40,120,255,${0.55-i*0.08})`,
              boxShadow:`0 0 ${8+i*2}px rgba(40,120,255,${0.22-i*0.03})`,
              animation:`ringPulse ${3+i*0.4}s ease-in-out ${i*0.3}s infinite`,
            }}/>
          ))}
          {/* center beam */}
          <div style={{
            position:'absolute', left:'50%', top:'50%',
            transform:'translate(-50%,-50%)',
            width:4, height:80,
            background:'linear-gradient(to top, rgba(60,140,255,.7), transparent)',
          }}/>
        </div>

        {/* ── FLOATING SHAPES ───────────────────────────────────────── */}
        {[
          { s:14, t:13, l:8,  anim:'flt1', d:0,    op:.22 },
          { s:10, t:28, l:88, anim:'flt2', d:1.2,  op:.18 },
          { s:12, t:70, l:5,  anim:'flt3', d:0.6,  op:.15 },
          { s:9,  t:55, l:92, anim:'flt4', d:1.8,  op:.20 },
          { s:7,  t:8,  l:72, anim:'flt1', d:2.4,  op:.15 },
          { s:11, t:82, l:80, anim:'flt2', d:0.9,  op:.17 },
          { s:8,  t:42, l:3,  anim:'flt3', d:1.5,  op:.13 },
          { s:6,  t:20, l:95, anim:'flt4', d:3.0,  op:.14 },
        ].map(({ s, t, l, anim, d, op }, i) => (
          <div key={i} style={{
            position:'absolute', top:`${t}%`, left:`${l}%`,
            width:s, height:s,
            border:`1.5px solid rgba(74,120,255,${op+.08})`,
            background:`rgba(74,120,255,${op*0.3})`,
            transform: i%2===0 ? 'rotate(0deg)' : 'rotate(45deg)',
            animation:`${anim} ${5+i*0.7}s ease-in-out ${d}s infinite`,
            zIndex:2, pointerEvents:'none',
          }}/>
        ))}

        {/* ── CORNER DOT GRID (top right) ───────────────────────────── */}
        <div style={{ position:'absolute', top:22, right:22, zIndex:2, pointerEvents:'none' }}>
          {Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>(
            <div key={`${r}-${c}`} style={{
              position:'absolute',
              top:r*10, left:c*10,
              width:2.5, height:2.5, borderRadius:'50%',
              background:`rgba(74,120,255,${0.25+((r+c)%2)*0.1})`,
            }}/>
          )))}
        </div>
        {/* bottom-left corner dots */}
        <div style={{ position:'absolute', bottom:24, left:22, zIndex:4, pointerEvents:'none' }}>
          {Array.from({length:3},(_,r)=>Array.from({length:3},(_,c)=>(
            <div key={`${r}-${c}`} style={{
              position:'absolute',
              top:r*9, left:c*9,
              width:2, height:2, borderRadius:'50%',
              background:`rgba(74,120,255,${0.2+((r+c)%2)*0.08})`,
            }}/>
          )))}
        </div>

        {/* ── EDGE LINE MARKERS ─────────────────────────────────────── */}
        <div style={{
          position:'absolute', top:48, right:20,
          width:18, height:1, background:'rgba(74,120,255,.35)',
          zIndex:2, pointerEvents:'none',
        }}/>
        <div style={{
          position:'absolute', top:52, right:20,
          width:10, height:1, background:'rgba(74,120,255,.2)',
          zIndex:2, pointerEvents:'none',
        }}/>

        {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
        <div style={{
          position:'relative', zIndex:10,
          minHeight:'100vh',
          display:'flex', flexDirection:'column',
        }}>

          {/* Logo top-left */}
          <div style={{ padding:'24px 32px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:32, height:1, background:'rgba(180,200,255,.35)' }}/>
            <div>
              <div style={{ fontSize:14, fontWeight:800, letterSpacing:4, color:'#e8eeff', lineHeight:1 }}>
                IELTSSHOKH
              </div>
              <div style={{ fontSize:8.5, letterSpacing:3.5, color:'rgba(120,160,255,.6)', fontWeight:600, marginTop:3 }}>
                MASTER YOUR SPEAKING
              </div>
            </div>
          </div>

          {/* Left vertical text */}
          <div style={{
            position:'absolute', left:20, top:'50%',
            transform:'translateY(-50%)',
            display:'flex', flexDirection:'column', alignItems:'center', gap:0,
            zIndex:10,
          }}>
            {['FOCUS','PRACTICE','ACHIEVE'].map((w,i) => (
              <div key={w} style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                {i > 0 && <div style={{ width:1, height:18, background:'rgba(74,120,255,.25)', margin:'4px 0' }}/>}
                <span style={{
                  fontSize:8.5, fontWeight:700, letterSpacing:3.5,
                  color:'rgba(150,180,255,.35)',
                  writingMode:'vertical-rl', textOrientation:'mixed',
                }}>{w}</span>
              </div>
            ))}
          </div>

          {/* Center content */}
          <div style={{
            flex:1, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            padding:'0 20px 20px',
          }}>

            {/* Headline */}
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{
                fontSize:10, letterSpacing:5.5, fontWeight:600, marginBottom:16,
                color:'rgba(120,160,255,.7)',
              }}>
                WELCOME BACK
              </div>
              <h1 style={{
                margin:'0 0 12px', fontWeight:800, lineHeight:1.16,
                fontSize:'clamp(24px,3.5vw,44px)',
                color:'#e8eeff', letterSpacing:-0.5,
              }}>
                Every step you take<br/>
                builds your{' '}
                <span style={{ color:'#4a90ff' }}>future.</span>
              </h1>
              <p style={{
                margin:0, fontSize:11.5, letterSpacing:2.5,
                color:'rgba(160,190,255,.32)', fontWeight:500,
              }}>
                Discipline today, success tomorrow.
              </p>
            </div>

            {/* Login card */}
            <div style={{
              width:'100%', maxWidth:452,
              background:'rgba(5,10,30,.90)',
              backdropFilter:'blur(24px)',
              WebkitBackdropFilter:'blur(24px)',
              border:'1px solid rgba(60,100,220,.20)',
              borderRadius:18,
              padding:'34px 36px 28px',
              boxShadow:'0 8px 60px rgba(0,0,8,.70), 0 0 60px rgba(40,80,200,.06)',
            }}>
              <form onSubmit={submit}>

                {/* USERNAME */}
                <div style={{ marginBottom:18 }}>
                  <label style={{
                    display:'block', fontSize:10.5, letterSpacing:2.5,
                    color:'rgba(180,200,255,.38)', fontWeight:700, marginBottom:10,
                  }}>USERNAME</label>
                  <div style={{ position:'relative' }}>
                    <span style={{
                      position:'absolute', left:14, top:'50%',
                      transform:'translateY(-50%)',
                      display:'flex', alignItems:'center', pointerEvents:'none',
                    }}><IconUser/></span>
                    <input
                      type="text"
                      placeholder="Enter your username"
                      value={form.username}
                      onChange={e => setForm(p=>({...p,username:e.target.value}))}
                      autoComplete="username"
                      className="li"
                      style={{
                        width:'100%', padding:'13px 14px 13px 44px',
                        borderRadius:10,
                        background:'rgba(8,18,50,.75)',
                        border:'1px solid rgba(60,100,220,.22)',
                        color:'#e0e8ff', fontSize:14,
                        boxSizing:'border-box',
                        transition:'border-color .15s,box-shadow .15s',
                      }}
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div style={{ marginBottom:28 }}>
                  <label style={{
                    display:'block', fontSize:10.5, letterSpacing:2.5,
                    color:'rgba(180,200,255,.38)', fontWeight:700, marginBottom:10,
                  }}>PASSWORD</label>
                  <div style={{ position:'relative' }}>
                    <span style={{
                      position:'absolute', left:14, top:'50%',
                      transform:'translateY(-50%)',
                      display:'flex', alignItems:'center', pointerEvents:'none',
                    }}><IconLock/></span>
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={e => setForm(p=>({...p,password:e.target.value}))}
                      autoComplete="current-password"
                      className="li"
                      style={{
                        width:'100%', padding:'13px 46px 13px 44px',
                        borderRadius:10,
                        background:'rgba(8,18,50,.75)',
                        border:'1px solid rgba(60,100,220,.22)',
                        color:'#e0e8ff', fontSize:14,
                        boxSizing:'border-box',
                        transition:'border-color .15s,box-shadow .15s',
                      }}
                    />
                    <button
                      type="button"
                      onClick={()=>setShowPw(p=>!p)}
                      style={{
                        position:'absolute', right:12, top:'50%',
                        transform:'translateY(-50%)',
                        background:'none', border:'none', cursor:'pointer',
                        padding:4, display:'flex', alignItems:'center',
                      }}
                    >
                      {showPw ? <IconEyeOff/> : <IconEye/>}
                    </button>
                  </div>
                </div>

                {/* ACCESS DASHBOARD button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="abtn"
                  style={{
                    width:'100%', padding:'14px 20px',
                    borderRadius:11,
                    background:'linear-gradient(135deg,#2a6fff 0%,#1a4fd6 60%,#1240b8 100%)',
                    border:'none', cursor:'pointer',
                    color:'#fff', fontSize:11.5, fontWeight:800,
                    letterSpacing:3.5,
                    display:'flex', alignItems:'center', justifyContent:'center', gap:12,
                    boxShadow:'0 4px 24px rgba(30,80,255,.45)',
                    position:'relative', overflow:'hidden',
                  }}
                >
                  <div style={{
                    width:32, height:32, borderRadius:'50%',
                    border:'2px solid rgba(255,255,255,.35)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    flexShrink:0,
                  }}>
                    <IconArrow/>
                  </div>
                  {loading ? 'KIRISH...' : 'ACCESS DASHBOARD'}
                </button>

                {/* or / register */}
                <div style={{ textAlign:'center', marginTop:20 }}>
                  <span style={{ fontSize:12, color:'rgba(140,170,255,.25)', fontWeight:500 }}>or</span>
                </div>
                <div style={{ textAlign:'center', marginTop:10, fontSize:12, color:'rgba(140,170,255,.35)' }}>
                  Don't have an account?{' '}
                  <a href="/register" style={{ color:'#5090ff', fontWeight:600, textDecoration:'none' }}>
                    Create one
                  </a>
                </div>

              </form>
            </div>
          </div>

          {/* ── BOTTOM ROW ──────────────────────────────────────────── */}
          <div style={{
            display:'flex', alignItems:'flex-end',
            justifyContent:'space-between',
            padding:'0 28px 24px',
            position:'relative', zIndex:5,
          }}>

            {/* SECURE ACCESS card */}
            <div className="fcard" style={{
              background:'rgba(5,10,30,.72)',
              backdropFilter:'blur(16px)',
              WebkitBackdropFilter:'blur(16px)',
              border:'1px solid rgba(60,100,220,.18)',
              borderRadius:14, padding:'16px 20px',
              display:'flex', alignItems:'center', gap:14,
              maxWidth:215,
            }}>
              <div style={{
                width:46, height:46, borderRadius:11, flexShrink:0,
                background:'rgba(40,90,200,.14)',
                border:'1px solid rgba(60,110,220,.18)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <IconFingerprint/>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:800, color:'#c8d8ff', letterSpacing:1, marginBottom:5 }}>
                  SECURE ACCESS
                </div>
                <div style={{ fontSize:11.5, color:'rgba(140,170,255,.38)', lineHeight:1.45 }}>
                  Your data is 100%<br/>protected
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign:'center', paddingBottom:2 }}>
              <p style={{ margin:0, fontSize:10.5, color:'rgba(140,170,255,.18)', letterSpacing:1 }}>
                © 2026{' '}
                <span style={{ color:'#4a90ff', fontWeight:700 }}>IELTSSHOKH</span>
                {'. ALL RIGHTS RESERVED.'}
              </p>
            </div>

            {/* PREMIUM CONTENT card */}
            <div className="fcard" style={{
              background:'rgba(5,10,30,.72)',
              backdropFilter:'blur(16px)',
              WebkitBackdropFilter:'blur(16px)',
              border:'1px solid rgba(60,100,220,.18)',
              borderRadius:14, padding:'16px 20px',
              display:'flex', alignItems:'center', gap:14,
              maxWidth:215,
            }}>
              <div style={{
                width:46, height:46, borderRadius:11, flexShrink:0,
                background:'rgba(40,90,200,.14)',
                border:'1px solid rgba(60,110,220,.18)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <IconDiamond/>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:800, color:'#c8d8ff', letterSpacing:1, marginBottom:5 }}>
                  PREMIUM CONTENT
                </div>
                <div style={{ fontSize:11.5, color:'rgba(140,170,255,.38)', lineHeight:1.45 }}>
                  Top-quality IELTS<br/>materials
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
