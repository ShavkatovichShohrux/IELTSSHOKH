import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'

// Reference render lives in public/ → served at site root
const bg = '/login-bg.jpg'

/*
 * Login page is a pixel-perfect overlay on the reference render (login-bg.png,
 * 1280×853). The image supplies ALL visuals (globe, mountains, rings, cards,
 * text). We overlay only the live, interactive pieces — the two input fields,
 * the submit button, the eye toggle and the "Create one" link — positioned by
 * percentage inside a fixed 1280:853 stage so they always line up with the
 * baked-in artwork regardless of viewport size.
 *
 * Coordinates below are measured from the 1280×853 source and expressed as %.
 */
const IMG_W = 1280, IMG_H = 853
const pctX = px => `${(px / IMG_W * 100).toFixed(3)}%`
const pctY = py => `${(py / IMG_H * 100).toFixed(3)}%`

// Field geometry in source pixels (measured from the 1280×853 render by
// column pixel-scan: field borders show as brighter bands)
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

  // Shared field-fill style — matches the reference field interior exactly
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
        .lpx-input::placeholder{ color:rgba(150,172,208,.72); font-weight:400; }
        .lpx-eye{ background:none;border:none;cursor:pointer;padding:0;display:flex;align-items:center; }
        .lpx-btn{ transition:filter .18s; }
        .lpx-btn:hover:not(:disabled){ filter:brightness(1.12); }
        .lpx-field:focus-within{ box-shadow:0 0 0 2px rgba(60,120,255,.22); border-radius:0.85cqw; }
      `}</style>

      <div style={{
        minHeight:'100vh', width:'100%',
        background:'#010103',
        display:'flex', alignItems:'center', justifyContent:'center',
        overflow:'hidden',
      }}>
        {/* Fixed-aspect stage carrying the reference image */}
        <div style={{
          position:'relative',
          width:'min(100vw, calc(100vh * 1280 / 853))',
          aspectRatio:'1280 / 853',
          backgroundImage:`url(${bg})`,
          backgroundSize:'100% 100%',
          backgroundRepeat:'no-repeat',
          containerType:'inline-size',
          userSelect:'none',
        }}>
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
    </>
  )
}
