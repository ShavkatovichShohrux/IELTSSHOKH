import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'

/* ── inline SVG icons ─────────────────────────────────────────────────── */
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,255,0.7)" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,255,0.7)" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const IconEyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)
const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
)
const IconFingerprint = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,255,0.9)" strokeWidth="1.5">
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
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,255,0.9)" strokeWidth="1.5">
    <polygon points="6 3 18 3 22 9 12 22 2 9"/>
    <line x1="2" y1="9" x2="22" y2="9"/>
    <line x1="12" y1="3" x2="6" y2="9"/>
    <line x1="12" y1="3" x2="18" y2="9"/>
  </svg>
)

/* ── Globe dot grid (simplified world map texture) ────────────────────── */
const DOTS = Array.from({ length: 90 }, (_, i) => {
  const t = (i / 90) * Math.PI * 2
  const rings = [80, 120, 160, 195, 220, 245, 265]
  const r = rings[i % rings.length]
  const jitter = ((i * 7919) % 30) - 15
  return {
    cx: 300 + Math.cos(t + i * 0.4) * r + jitter,
    cy: 250 + Math.sin(t * 0.55 + i * 0.25) * (r * 0.52) + jitter * 0.5,
    r: 1.2 + (i % 3) * 0.6,
    o: 0.25 + (i % 5) * 0.09,
  }
})

export default function LoginPage() {
  const [form, setForm]   = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname

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
        @keyframes globePulse {
          0%,100% { box-shadow: 0 0 70px rgba(74,108,247,.55), 0 0 140px rgba(74,108,247,.18), inset 0 0 60px rgba(30,70,200,.12); }
          50%      { box-shadow: 0 0 100px rgba(74,108,247,.75), 0 0 200px rgba(74,108,247,.28), inset 0 0 80px rgba(30,70,200,.22); }
        }
        @keyframes flt1 { 0%,100%{transform:translateY(0) rotate(0deg)}   50%{transform:translateY(-12px) rotate(15deg)} }
        @keyframes flt2 { 0%,100%{transform:translateY(0) rotate(45deg)}  50%{transform:translateY(-8px)  rotate(60deg)} }
        @keyframes flt3 { 0%,100%{transform:translateY(0) rotate(0deg)}   50%{transform:translateY(-14px) rotate(-10deg)} }
        @keyframes ringP {
          0%,100%{opacity:.45;transform:translate(-50%,-50%) scaleX(1) scaleY(1)}
          50%    {opacity:.7; transform:translate(-50%,-50%) scaleX(1.04) scaleY(1.04)}
        }
        .li { user-select:text!important;-webkit-user-select:text!important; }
        .li:focus { outline:none!important; border-color:rgba(74,108,247,.75)!important; box-shadow:0 0 0 3px rgba(74,108,247,.12)!important; }
        .abtn { transition:background .18s,transform .18s,box-shadow .18s; }
        .abtn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 32px rgba(74,108,247,.55)!important; }
        .fcard { transition:border-color .2s; }
        .fcard:hover { border-color:rgba(74,108,247,.4)!important; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#05091a',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter','Segoe UI',sans-serif",
      }}>

        {/* ── Globe ─────────────────────────────────────────────────────── */}
        <div style={{
          position: 'absolute',
          top: -110, left: '50%',
          transform: 'translateX(-50%)',
          width: 500, height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 58% 38%, #0c3068 0%, #051730 35%, #020c24 65%, #010810 100%)',
          border: '1.5px solid rgba(90,150,255,.38)',
          animation: 'globePulse 4.5s ease-in-out infinite',
          zIndex: 1,
        }}>
          {/* latitude shimmer */}
          <div style={{
            position:'absolute', inset:0, borderRadius:'50%',
            background:'radial-gradient(ellipse 85% 22% at 50% 42%, rgba(74,108,247,.14) 0%, transparent 70%)',
          }}/>
          {/* dot world-map texture */}
          <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',borderRadius:'50%',opacity:.38 }}
            viewBox="0 0 600 500">
            {DOTS.map((d,i) => (
              <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={`rgba(100,180,255,${d.o})`}/>
            ))}
          </svg>
          {/* bottom atmosphere glow */}
          <div style={{
            position:'absolute',
            bottom:0, left:'15%', right:'15%', height:'28%',
            background:'radial-gradient(ellipse, rgba(74,108,247,.45) 0%, transparent 70%)',
            borderRadius:'0 0 50% 50%',
          }}/>
        </div>


        {/* ── Floating geometric shapes ──────────────────────────────────── */}
        {[
          { top:62,  right:82,  w:12, s:'flt1 6s',   style:{ border:'1.5px solid rgba(74,108,247,.5)',borderRadius:2 }},
          { top:118, right:188, w:8,  s:'flt2 8s',   style:{ border:'1px solid rgba(74,108,247,.3)',transform:'rotate(45deg)' }},
          { top:200, right:62,  w:6,  s:'',           style:{ background:'rgba(74,108,247,.3)',borderRadius:'50%' }},
          { top:148, left:185,  w:10, s:'flt3 7s',   style:{ border:'1.5px solid rgba(74,108,247,.4)',borderRadius:2 }},
          { top:78,  left:305,  w:6,  s:'flt1 9s 1s',style:{ border:'1px solid rgba(74,108,247,.25)',transform:'rotate(45deg)' }},
          { top:'38%',right:42, w:10, s:'flt2 5s 2s',style:{ border:'1.5px solid rgba(74,108,247,.35)',borderRadius:2 }},
          { top:'32%',left:58,  w:8,  s:'flt3 6s .5s',style:{ border:'1px solid rgba(74,108,247,.3)',transform:'rotate(45deg)' }},
          { top:'55%',right:120,w:5,  s:'',           style:{ background:'rgba(74,108,247,.25)',borderRadius:'50%' }},
        ].map((sh,i) => (
          <div key={i} style={{
            position:'absolute',
            top: sh.top, right: sh.right, left: sh.left,
            width: sh.w, height: sh.w,
            zIndex:3,
            animation: sh.s || undefined,
            ...sh.style,
          }}/>
        ))}

        {/* ── Holographic rings (bottom center) ─────────────────────────── */}
        <div style={{ position:'absolute',bottom:-55,left:'50%',zIndex:3,pointerEvents:'none' }}>
          {[340,262,188,116,62].map((w,i) => (
            <div key={i} style={{
              position:'absolute',
              left:'50%', top:'50%',
              width: w, height: w * 0.27,
              border:`1px solid rgba(74,108,247,${.52 - i*.08})`,
              borderRadius:'50%',
              animation:`ringP ${2.2+i*.45}s ease-in-out infinite ${i*.28}s`,
              boxShadow:`0 0 ${8+i*6}px rgba(74,108,247,${.28-i*.04}), inset 0 0 ${4+i*3}px rgba(74,108,247,.08)`,
            }}/>
          ))}
          <div style={{
            position:'absolute', left:'50%', top:'50%',
            transform:'translate(-50%,-50%)',
            width:10, height:10, borderRadius:'50%',
            background:'radial-gradient(circle, #4a90ff 0%, rgba(74,144,255,.2) 100%)',
            boxShadow:'0 0 18px rgba(74,144,255,.9)',
          }}/>
        </div>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <div style={{
          position:'relative', zIndex:10,
          minHeight:'100vh',
          display:'flex', flexDirection:'column',
        }}>

          {/* Top-left logo */}
          <div style={{ padding:'14px 22px' }}>
            <div style={{ fontSize:15,fontWeight:700,letterSpacing:4,color:'#fff',marginBottom:5 }}>
              IELTSSHOKH
            </div>
            <div style={{ fontSize:9,letterSpacing:3.5,color:'rgba(74,144,255,.75)',fontWeight:600 }}>
              MASTER YOUR SPEAKING
            </div>
          </div>

          {/* Left vertical text */}
          <div style={{
            position:'absolute', left:28, top:'50%', transform:'translateY(-50%)',
            display:'flex', flexDirection:'column', alignItems:'center', gap:8,
            zIndex:11,
          }}>
            <div style={{ width:1,height:56,background:'rgba(74,108,247,.28)' }}/>
            {['FOCUS','PRACTICE','ACHIEVE'].map((w,i) => (
              <div key={i} style={{
                writingMode:'vertical-rl', textOrientation:'mixed',
                fontSize:8.5, letterSpacing:3.5,
                color:'rgba(255,255,255,.3)', fontWeight:600,
                padding:'5px 0',
              }}>{w}</div>
            ))}
            <div style={{ width:1,height:56,background:'rgba(74,108,247,.28)' }}/>
          </div>

          {/* Center: headline + card */}
          <div style={{
            flex:1, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            padding:'0 16px 12px',
            overflowY:'auto',
          }}>

            {/* Headline */}
            <div style={{ textAlign:'center', marginBottom:12 }}>
              {/* Logo */}
              <img
                src="/logo.png"
                alt="IELTSSHOKH"
                style={{
                  width:82, height:82, objectFit:'contain', display:'block', margin:'0 auto 10px',
                  filter:'brightness(0) invert(1) sepia(1) saturate(4) hue-rotate(195deg) brightness(1.15) drop-shadow(0 0 24px rgba(74,144,255,.85))',
                }}
              />
              <div style={{
                fontSize:10, letterSpacing:5.5,
                color:'rgba(74,144,255,.75)', fontWeight:600, marginBottom:7,
              }}>
                WELCOME BACK
              </div>
              <h1 style={{
                margin:'0 0 6px',
                fontSize:'clamp(18px,2.6vw,32px)',
                fontWeight:800, lineHeight:1.18,
                color:'#fff', letterSpacing:-0.8,
              }}>
                Every step you take<br/>
                builds your{' '}
                <span style={{ color:'#4a90ff' }}>future.</span>
              </h1>
              <p style={{
                margin:0, fontSize:11, letterSpacing:3,
                color:'rgba(255,255,255,.35)', fontWeight:500,
              }}>
                Discipline today, success tomorrow.
              </p>
            </div>

            {/* Login card */}
            <div style={{
              width:'100%', maxWidth:420,
              background:'rgba(7,13,38,.88)',
              backdropFilter:'blur(22px)',
              WebkitBackdropFilter:'blur(22px)',
              border:'1px solid rgba(74,108,247,.22)',
              borderRadius:14,
              padding:'20px 24px',
              boxShadow:'0 8px 64px rgba(0,0,0,.65), 0 0 48px rgba(74,108,247,.07)',
            }}>
              <form onSubmit={submit}>

                {/* USERNAME */}
                <div style={{ marginBottom:10 }}>
                  <label style={{
                    display:'block', fontSize:10, letterSpacing:2,
                    color:'rgba(255,255,255,.42)', fontWeight:700, marginBottom:6,
                  }}>USERNAME</label>
                  <div style={{ position:'relative' }}>
                    <span style={{
                      position:'absolute', left:14, top:'50%',
                      transform:'translateY(-50%)',
                      display:'flex', alignItems:'center',
                    }}><IconUser/></span>
                    <input
                      type="text"
                      placeholder="Enter your username"
                      value={form.username}
                      onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                      autoComplete="username"
                      className="li"
                      style={{
                        width:'100%', padding:'8px 14px 8px 42px',
                        borderRadius:10,
                        background:'rgba(4,10,30,.82)',
                        border:'1px solid rgba(74,108,247,.18)',
                        color:'#fff', fontSize:14,
                        boxSizing:'border-box',
                        transition:'border-color .15s,box-shadow .15s',
                      }}
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div style={{ marginBottom:14 }}>
                  <label style={{
                    display:'block', fontSize:10, letterSpacing:2,
                    color:'rgba(255,255,255,.42)', fontWeight:700, marginBottom:6,
                  }}>PASSWORD</label>
                  <div style={{ position:'relative' }}>
                    <span style={{
                      position:'absolute', left:14, top:'50%',
                      transform:'translateY(-50%)',
                      display:'flex', alignItems:'center',
                    }}><IconLock/></span>
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      autoComplete="current-password"
                      className="li"
                      style={{
                        width:'100%', padding:'8px 44px 8px 42px',
                        borderRadius:10,
                        background:'rgba(4,10,30,.82)',
                        border:'1px solid rgba(74,108,247,.18)',
                        color:'#fff', fontSize:14,
                        boxSizing:'border-box',
                        transition:'border-color .15s,box-shadow .15s',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      style={{
                        position:'absolute', right:12, top:'50%',
                        transform:'translateY(-50%)',
                        background:'none', border:'none', cursor:'pointer',
                        color:'rgba(74,108,247,.6)', padding:0,
                        display:'flex', alignItems:'center',
                      }}>
                      {showPw ? <IconEyeOff/> : <IconEye/>}
                    </button>
                  </div>
                </div>

                {/* ACCESS DASHBOARD */}
                <button
                  type="submit"
                  disabled={loading}
                  className="abtn"
                  style={{
                    width:'100%', padding:'14px 20px',
                    borderRadius:12, border:'none',
                    background: loading
                      ? 'rgba(74,108,247,.35)'
                      : 'linear-gradient(135deg, #4a80ff 0%, #1a40cf 100%)',
                    color:'#fff',
                    fontSize:11.5, fontWeight:700, letterSpacing:3,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    gap:0, position:'relative',
                    boxShadow: loading ? 'none' : '0 4px 24px rgba(74,108,247,.4)',
                  }}>
                  <div style={{
                    position:'absolute', left:14,
                    width:36, height:36, borderRadius:'50%',
                    background:'rgba(255,255,255,.14)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <IconArrow/>
                  </div>
                  {loading ? 'LOADING...' : 'ACCESS DASHBOARD'}
                </button>
              </form>

              {/* OR divider */}
              <div style={{ display:'flex',alignItems:'center',gap:12,margin:'12px 0' }}>
                <div style={{ flex:1,height:1,background:'rgba(255,255,255,.07)' }}/>
                <span style={{ fontSize:12,color:'rgba(255,255,255,.28)',fontWeight:500 }}>or</span>
                <div style={{ flex:1,height:1,background:'rgba(255,255,255,.07)' }}/>
              </div>

              {/* Create account link */}
              <div style={{ textAlign:'center' }}>
                <span style={{ fontSize:13,color:'rgba(255,255,255,.38)' }}>
                  Don't have an account?{' '}
                </span>
                <Link to="/register" style={{ fontSize:13,color:'#4a90ff',fontWeight:600,textDecoration:'none' }}>
                  Create one
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom row: feature cards + footer */}
          <div style={{
            padding:'0 20px 14px',
            display:'flex', alignItems:'flex-end', justifyContent:'space-between',
            gap:12,
          }}>

            {/* SECURE ACCESS */}
            <div className="fcard" style={{
              background:'rgba(7,13,38,.72)',
              backdropFilter:'blur(14px)',
              WebkitBackdropFilter:'blur(14px)',
              border:'1px solid rgba(74,108,247,.18)',
              borderRadius:13, padding:'15px 18px',
              display:'flex', alignItems:'center', gap:14, maxWidth:210,
            }}>
              <div style={{
                width:44, height:44, borderRadius:10, flexShrink:0,
                background:'rgba(74,108,247,.13)',
                border:'1px solid rgba(74,108,247,.28)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <IconFingerprint/>
              </div>
              <div>
                <div style={{ fontSize:10.5,fontWeight:800,color:'#fff',letterSpacing:1,marginBottom:4 }}>
                  SECURE ACCESS
                </div>
                <div style={{ fontSize:11,color:'rgba(255,255,255,.38)',lineHeight:1.45 }}>
                  Your data is 100%<br/>protected
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign:'center', paddingBottom:4 }}>
              <p style={{ margin:0,fontSize:10.5,color:'rgba(255,255,255,.18)',letterSpacing:1 }}>
                © 2026{' '}
                <span style={{ fontWeight:700 }}>IELTSSHOKH</span>
                {'. ALL RIGHTS RESERVED.'}
              </p>
            </div>

            {/* PREMIUM CONTENT */}
            <div className="fcard" style={{
              background:'rgba(7,13,38,.72)',
              backdropFilter:'blur(14px)',
              WebkitBackdropFilter:'blur(14px)',
              border:'1px solid rgba(74,108,247,.18)',
              borderRadius:13, padding:'15px 18px',
              display:'flex', alignItems:'center', gap:14, maxWidth:210,
            }}>
              <div style={{
                width:44, height:44, borderRadius:10, flexShrink:0,
                background:'rgba(74,108,247,.13)',
                border:'1px solid rgba(74,108,247,.28)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <IconDiamond/>
              </div>
              <div>
                <div style={{ fontSize:10.5,fontWeight:800,color:'#fff',letterSpacing:1,marginBottom:4 }}>
                  PREMIUM CONTENT
                </div>
                <div style={{ fontSize:11,color:'rgba(255,255,255,.38)',lineHeight:1.45 }}>
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
