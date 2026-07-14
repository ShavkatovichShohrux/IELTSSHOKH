import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
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
      if (res.data.user.role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate(from && from !== '/' ? from : '/tests', { replace: true })
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login yoki parol noto\'g\'ri')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg, #0a0b18 0%, #111326 50%, #0d0f1f 100%)',
    }}>
      {/* Top bar */}
      <div style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ background: '#dc2626', color: '#fff', padding: '4px 12px', borderRadius: 7, fontSize: 14, fontWeight: 900, letterSpacing: 1.5 }}>IELTS</span>
          <span style={{ color: '#f1f2f8', fontWeight: 700, fontSize: 16 }}>SHOKH</span>
        </div>
        <a
          href={/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'tg://resolve?domain=ieltsshokh' : 'https://t.me/ieltsshokh'}
          target={/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? undefined : '_blank'}
          rel="noopener noreferrer"
          style={{ fontSize: 12, color: '#9aa0b4', textDecoration: 'none', fontWeight: 600 }}>
          @ieltsshokh ↗
        </a>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg,#dc2626,#991b1b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(220,38,38,0.3)',
            }}>
              <LogIn size={28} color="#fff" />
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#f1f2f8', letterSpacing: -0.5 }}>
              Platformaga kirish
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: '#6b7280' }}>
              IELTS mashq testlari va speaking dossierlar
            </p>
          </div>

          {/* Form card */}
          <div style={{
            background: '#13152a', border: '1px solid #1e2136',
            borderRadius: 20, padding: '32px 28px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}>
            <form onSubmit={submit}>
              {/* Username */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#c4c9d9', marginBottom: 6 }}>
                  Username
                </label>
                <input
                  type="text"
                  placeholder="username kiriting"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  autoComplete="username"
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: 10,
                    background: '#0d0f1f', border: '1.5px solid #2a2c40',
                    color: '#f1f2f8', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box', userSelect: 'text',
                    transition: 'border-color .15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#dc2626'}
                  onBlur={e => e.target.style.borderColor = '#2a2c40'}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#c4c9d9', marginBottom: 6 }}>
                  Parol
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    autoComplete="current-password"
                    style={{
                      width: '100%', padding: '11px 44px 11px 14px', borderRadius: 10,
                      background: '#0d0f1f', border: '1.5px solid #2a2c40',
                      color: '#f1f2f8', fontSize: 14, outline: 'none',
                      boxSizing: 'border-box', userSelect: 'text',
                      transition: 'border-color .15s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#dc2626'}
                    onBlur={e => e.target.style.borderColor = '#2a2c40'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#6b7280', padding: 0, display: 'flex', alignItems: 'center',
                    }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                  background: loading ? '#7f1d1d' : 'linear-gradient(135deg,#dc2626,#b91c1c)',
                  color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 20px rgba(220,38,38,0.3)',
                  transition: 'opacity .15s',
                }}>
                {loading ? 'Kirilmoqda...' : 'Kirish'}
              </button>
            </form>

            {/* Register link */}
            <div style={{ marginTop: 20, textAlign: 'center', borderTop: '1px solid #1e2136', paddingTop: 20 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                Hisob yo'qmi?{' '}
                <Link to="/register" style={{ color: '#dc2626', fontWeight: 700, textDecoration: 'none' }}>
                  Ro'yxatdan o'tish
                </Link>
              </p>
            </div>
          </div>

          {/* Speaking dossiers link */}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/speaking"
              style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none', fontWeight: 500 }}>
              🎤 Speaking dossierlarni ko'rish →
            </Link>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 28px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 12, color: '#3d4258' }}>
          © IELTSSHOKH — Band 9 target
        </p>
      </div>
    </div>
  )
}
