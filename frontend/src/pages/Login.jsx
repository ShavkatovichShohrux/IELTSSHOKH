import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const submit = async e => {
    e.preventDefault()
    if (!form.username || !form.password) return toast.error("Barcha maydonlarni to'ldiring")
    setLoading(true)
    try {
      const res = await api.login(form)
      setAuth(res.data.user, res.data.access_token)
      toast.success(`Xush kelibsiz, ${res.data.user.username}!`)
      navigate(res.data.user.role === 'admin' ? '/admin' : from, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Kirish muvaffaqiyatsiz')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="bg-brand text-white px-3 py-1 rounded text-lg font-black tracking-widest">IELTS</span>
            <span className="text-gray-800 dark:text-gray-100 font-bold text-xl">SHOKH</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Kirish</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Hisobingizga kiring</p>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          <div>
            <label className="label">Username</label>
            <input
              type="text" className="input" placeholder="username"
              value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              style={{ userSelect: 'text' }} autoComplete="username"
            />
          </div>
          <div>
            <label className="label">Parol</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} className="input pr-10" placeholder="••••••••"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                style={{ userSelect: 'text' }} autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Kirilmoqda...' : 'Kirish'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          Hisob yo'qmi?{' '}
          <Link to="/register" className="text-brand font-semibold hover:underline">Ro'yxatdan o'tish</Link>
        </p>
      </div>
    </div>
  )
}
