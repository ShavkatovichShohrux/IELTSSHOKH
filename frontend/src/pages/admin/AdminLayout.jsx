import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Users, BarChart2, Music, Sun, Moon, LogOut, Tag, Mic, Library } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const nav = [
  { to: '/admin', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/speaking', icon: Mic, label: 'Speaking' },
  { to: '/admin/vocabulary', icon: Library, label: 'Vocabulary' },
  { to: '/admin/tests', icon: BookOpen, label: 'Testlar' },
  { to: '/admin/topics', icon: Tag, label: 'Topiclar' },
  { to: '/admin/users', icon: Users, label: 'Foydalanuvchilar' },
  { to: '/admin/stats', icon: BarChart2, label: 'Statistika' },
  { to: '/admin/audio', icon: Music, label: 'Audio fayllar' },
]

export default function AdminLayout() {
  const { user, theme, toggleTheme, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Chiqildi')
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className="bg-brand text-white px-2 py-0.5 rounded text-sm font-black tracking-widest">IELTS</span>
            <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">SHOKH Admin</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">{user?.username}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map(({ to, end, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-brand text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                }`
              }>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex gap-2">
          <button onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 text-xs">
            {theme === 'dark' ? <Sun size={15} className="text-yellow-400" /> : <Moon size={15} />}
          </button>
          <button onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-brand transition-colors text-xs">
            <LogOut size={15} />Chiqish
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
