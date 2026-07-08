import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, Shield, Trash2, ToggleLeft, ToggleRight, Search, Users, Plus, X, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../api/client'
import { useAuthStore } from '../../store/authStore'

const ROLE_FILTERS   = ['Barchasi', 'admin', 'user']
const STATUS_FILTERS = ['Barchasi', 'faol', 'bloklangan']

function CreateUserModal({ onClose, onCreated }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('user')
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!username.trim()) { toast.error('Username majburiy'); return }
    if (!password.trim()) { toast.error('Parol majburiy'); return }
    setSaving(true)
    try {
      await api.adminCreateUser({ username: username.trim(), password, role })
      toast.success('Foydalanuvchi yaratildi')
      onCreated()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Xatolik')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">Yangi foydalanuvchi</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label text-xs">Username *</label>
            <input
              className="input text-sm"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="student123"
              autoFocus
              style={{ userSelect: 'text' }}
              onKeyDown={e => e.key === 'Enter' && save()}
            />
          </div>

          <div>
            <label className="label text-xs">Parol *</label>
            <div className="relative">
              <input
                className="input text-sm pr-10"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Kuchli parol kiriting"
                style={{ userSelect: 'text' }}
                onKeyDown={e => e.key === 'Enter' && save()}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="label text-xs">Rol</label>
            <div className="flex gap-2">
              {[['user', 'Student'], ['admin', 'Admin']].map(([val, lbl]) => (
                <button key={val} type="button"
                  onClick={() => setRole(val)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${
                    role === val
                      ? val === 'admin' ? 'border-brand bg-brand/10 text-brand' : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                  }`}>
                  {val === 'admin' && <ShieldCheck size={13} className="inline mr-1" />}
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={save} disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : <Plus size={16} />}
            {saving ? 'Yaratilmoqda...' : 'Yaratish'}
          </button>
          <button onClick={onClose} className="btn-secondary px-4">Bekor</button>
        </div>
      </div>
    </div>
  )
}

export default function UserList() {
  const qc = useQueryClient()
  const { user: me } = useAuthStore()
  const [loading, setLoading] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('Barchasi')
  const [statusFilter, setStatusFilter] = useState('Barchasi')
  const [showCreate, setShowCreate] = useState(false)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => (await api.getUsers()).data,
  })

  const visible = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchRole   = roleFilter === 'Barchasi' || u.role === roleFilter
    const matchStatus = statusFilter === 'Barchasi'
      || (statusFilter === 'faol' && u.is_active)
      || (statusFilter === 'bloklangan' && !u.is_active)
    return matchSearch && matchRole && matchStatus
  })

  const update = async (id, data, msg) => {
    setLoading(id)
    try {
      await api.updateUser(id, data)
      qc.invalidateQueries({ queryKey: ['adminUsers'] })
      toast.success(msg)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Xatolik')
    } finally {
      setLoading(null)
    }
  }

  const del = async (id, name) => {
    if (!confirm(`"${name}" ni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`)) return
    setLoading(id)
    try {
      await api.deleteUser(id)
      qc.invalidateQueries({ queryKey: ['adminUsers'] })
      toast.success("Foydalanuvchi o'chirildi")
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Xatolik')
    } finally {
      setLoading(null)
    }
  }

  const adminCount = users.filter(u => u.role === 'admin').length
  const activeCount = users.filter(u => u.is_active).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Foydalanuvchilar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {users.length} ta jami · {adminCount} admin · {activeCount} faol
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />Yangi foydalanuvchi
        </button>
      </div>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ['adminUsers'] })}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9 text-sm"
            placeholder="Username yoki email bo'yicha qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ userSelect: 'text' }}
          />
        </div>

        {/* Role filter */}
        <div className="flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-1 gap-1">
          {ROLE_FILTERS.map(f => (
            <button key={f} onClick={() => setRoleFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors
                ${roleFilter === f ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              {f === 'Barchasi' ? 'Hammasi' : f === 'admin' ? 'Admin' : 'User'}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-1 gap-1">
          {STATUS_FILTERS.map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors
                ${statusFilter === f ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              {f === 'Barchasi' ? 'Hammasi' : f === 'faol' ? 'Faol' : 'Bloklangan'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            {users.length === 0
              ? <p className="font-medium">Hali foydalanuvchi yo'q</p>
              : <p className="font-medium">Hech narsa topilmadi — filterni o'zgartiring</p>
            }
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-semibold">Foydalanuvchi</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Rol</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Holat</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Ro'yxatdan</th>
                <th className="text-right px-4 py-3 font-semibold">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {visible.map(u => (
                <tr key={u.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors ${!u.is_active ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0
                        ${u.role === 'admin' ? 'bg-brand' : 'bg-blue-500'}`}>
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{u.username}</p>
                        {u.id === me?.id && <span className="text-xs text-brand font-medium">(siz)</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.role === 'admin'
                      ? <span className="flex items-center gap-1 text-xs font-bold text-brand"><ShieldCheck size={13} />Admin</span>
                      : <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"><Shield size={13} />User</span>
                    }
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {u.is_active
                      ? <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">Faol</span>
                      : <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">Bloklangan</span>
                    }
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">
                    {new Date(u.created_at).toLocaleDateString('uz-UZ')}
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== me?.id ? (
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => update(u.id, { role: u.role === 'admin' ? 'user' : 'admin' },
                            u.role === 'admin' ? 'Admin roli olib tashlandi' : "Admin qilindi")}
                          disabled={loading === u.id}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title={u.role === 'admin' ? "Admin rolini olib tashlash" : "Admin qilish"}>
                          <ShieldCheck size={15} className={u.role === 'admin' ? 'text-brand' : 'text-gray-400'} />
                        </button>
                        <button
                          onClick={() => update(u.id, { is_active: !u.is_active },
                            u.is_active ? 'Foydalanuvchi bloklandi' : 'Foydalanuvchi faollashtirildi')}
                          disabled={loading === u.id}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title={u.is_active ? 'Bloklash' : 'Faollashtirish'}>
                          {u.is_active
                            ? <ToggleRight size={18} className="text-green-500" />
                            : <ToggleLeft size={18} className="text-gray-400" />}
                        </button>
                        <button
                          onClick={() => del(u.id, u.username)}
                          disabled={loading === u.id}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 size={15} className="text-red-400" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-right pr-2 text-xs text-gray-400">—</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {visible.length > 0 && visible.length !== users.length && (
        <p className="text-xs text-center text-gray-400">{visible.length} ta ko'rsatilmoqda · jami {users.length} ta</p>
      )}
    </div>
  )
}
