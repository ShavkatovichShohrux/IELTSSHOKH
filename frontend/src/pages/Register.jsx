import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const submit = async e => {
    e.preventDefault()
    if (!form.username || !form.email || !form.password) return toast.error("Barcha maydonlarni to'ldiring")
    if (form.password !== form.confirm) return toast.error("Parollar mos kelmadi")
    if (form.password.length < 6) return toast.error("Parol kamida 6 ta belgi bo'lishi kerak")
    setLoading(true)
    try {
      const res = await api.register({ username: form.username, email: form.email, password: form.password })
      setAuth(res.data.user, res.data.access_token)
      toast.success("Ro'yxatdan o'tildi!")
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.detail || "Ro'yxatdan o'tish muvaffaqiyatsiz")
    } finally {
      setLoading(false)
    }
  }

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="bg-brand text-white px-3 py-1 rounded text-lg font-black tracking-widest">IELTS</span>
            <span className="text-gray-800 dark:text-gray-100 font-bold text-xl">SHOKH</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Ro'yxatdan o'tish</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Yangi hisob yarating</p>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          <div>
            <label className="label">Username</label>
            <input type="text" className="input" placeholder="username" value={form.username}
              onChange={set('username')} style={{ userSelect: 'text' }} autoComplete="username" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="email@example.com" value={form.email}
              onChange={set('email')} style={{ userSelect: 'text' }} autoComplete="email" />
          </div>
          <div>
            <label className="label">Parol</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} className="input pr-10" placeholder="••••••••"
                value={form.password} onChange={set('password')}
                style={{ userSelect: 'text' }} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Parolni tasdiqlang</label>
            <input type="password" className="input" placeholder="••••••••" value={form.confirm}
              onChange={set('confirm')} style={{ userSelect: 'text' }} autoComplete="new-password" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? "Ro'yxatdan o'tilmoqda..." : "Ro'yxatdan o'tish"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          Allaqachon hisobingiz bormi?{' '}
          <Link to="/login" className="text-brand font-semibold hover:underline">Kirish</Link>
        </p>
      </div>
    </div>
  )
}
