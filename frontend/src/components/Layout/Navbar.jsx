import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sun, Moon, LogOut, User, BarChart2, ShieldCheck, Menu, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../api/client'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, theme, toggleTheme, logout } = useAuthStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    try { await api.logout() } catch (_) {}
    logout()
    toast.success('Chiqildi')
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/tests" className="flex items-center gap-2 font-black text-brand text-lg tracking-wide no-underline">
          <span className="text-white font-black text-sm tracking-widest">IELTS</span>
          <span className="text-white font-black text-sm tracking-widest">SHOKH</span>
        </Link>

        {/* Desktop Nav links */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/tests" className="btn-ghost text-sm">Bosh sahifa</Link>
          <Link to="/my-results" className="btn-ghost text-sm flex items-center gap-1">
            <BarChart2 size={15} />Natijalarim
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="btn-ghost text-sm flex items-center gap-1 text-brand">
              <ShieldCheck size={15} />Admin
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Mavzuni o'zgartir"
          >
            {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-gray-600" />}
          </button>
          {user && (
            <>
              <span className="hidden md:flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mx-1">
                <User size={14} />{user.username}
              </span>
              <button onClick={handleLogout} className="hidden md:flex p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-brand transition-colors" title="Chiqish">
                <LogOut size={18} />
              </button>
            </>
          )}
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {mobileOpen
              ? <X size={20} className="text-gray-700 dark:text-gray-300" />
              : <Menu size={20} className="text-gray-700 dark:text-gray-300" />
            }
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2">
          {user && (
            <div className="flex items-center gap-2 py-2 px-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 mb-2">
              <User size={14} />{user.username}
            </div>
          )}
          <Link to="/tests" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 py-3 px-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
            Bosh sahifa
          </Link>
          <Link to="/my-results" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 py-3 px-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
            <BarChart2 size={15} />Natijalarim
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 py-3 px-2 text-sm text-brand hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
              <ShieldCheck size={15} />Admin
            </Link>
          )}
          <button
            onClick={() => { setMobileOpen(false); handleLogout() }}
            className="w-full flex items-center gap-2 py-3 px-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mt-1 border-t border-gray-100 dark:border-gray-800 pt-3"
          >
            <LogOut size={15} />Chiqish
          </button>
        </div>
      )}
    </nav>
  )
}
