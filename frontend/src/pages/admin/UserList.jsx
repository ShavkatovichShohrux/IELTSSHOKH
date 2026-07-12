import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, Shield, Trash2, ToggleLeft, ToggleRight, Search, Users, Plus, X, Eye, EyeOff, Crown, Zap, Ban, Monitor, Wifi, WifiOff, Smartphone } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../api/client'
import { useAuthStore } from '../../store/authStore'

function parseUA(ua) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', icon: '💻' }
  const mobile = /mobile|android|iphone/i.test(ua)
  let browser = 'Unknown'
  if (/edg\//i.test(ua)) browser = 'Edge'
  else if (/opr\/|opera/i.test(ua)) browser = 'Opera'
  else if (/chrome/i.test(ua)) browser = 'Chrome'
  else if (/safari/i.test(ua)) browser = 'Safari'
  else if (/firefox/i.test(ua)) browser = 'Firefox'
  let os = 'Unknown'
  if (/iphone/i.test(ua)) os = 'iPhone'
  else if (/ipad/i.test(ua)) os = 'iPad'
  else if (/android/i.test(ua)) os = 'Android'
  else if (/windows/i.test(ua)) os = 'Windows'
  else if (/mac os/i.test(ua)) os = 'macOS'
  else if (/linux/i.test(ua)) os = 'Linux'
  return { browser, os, icon: mobile ? '📱' : '💻' }
}

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'Hozirgina'
  if (diff < 3600) return `${Math.floor(diff / 60)} daq oldin`
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`
  if (diff < 604800) return `${Math.floor(diff / 86400)} kun oldin`
  return new Date(dateStr).toLocaleDateString('uz-UZ')
}

function DevicesModal({ userId, username, onClose }) {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['userSessions', userId],
    queryFn: () => api.userSessions(userId).then(r => r.data),
    staleTime: 30000,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center">
              <Monitor size={17} className="text-brand" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 dark:text-gray-100">Ulangan qurilmalar</h2>
              <p className="text-xs text-gray-400 mt-0.5">@{username}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Monitor size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Qurilma tarixi mavjud emas</p>
              <p className="text-xs mt-1">Bu foydalanuvchi hali kirmagan</p>
            </div>
          ) : (
            sessions.map(s => {
              const { browser, os, icon } = parseUA(s.user_agent)
              return (
                <div key={s.id} className={`flex items-center justify-between p-3.5 rounded-xl transition-colors ${
                  s.is_active
                    ? 'bg-violet-50 dark:bg-violet-900/15 border border-violet-200 dark:border-violet-800/50'
                    : 'bg-gray-50 dark:bg-gray-800/50 border border-transparent'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {browser} · {os}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                        <span>{s.ip_address || '—'}</span>
                        <span>·</span>
                        <span>{timeAgo(s.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  {s.is_active ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-2.5 py-1 rounded-full">
                      <Wifi size={11} /> Faol
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
                      <WifiOff size={11} /> Tugagan
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>

        {sessions.length > 0 && (
          <div className="px-5 pb-4 pt-0">
            <p className="text-xs text-gray-400 text-center">
              So'nggi {sessions.length} ta sessiya ko'rsatilmoqda
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

const ROLE_FILTERS   = ['Barchasi', 'admin', 'user']
const STATUS_FILTERS = ['Barchasi', 'faol', 'bloklangan']
const PLAN_FILTERS   = ['Barchasi', 'none', 'basic', 'elite']

const PLAN_META = {
  none:  { label: 'Free',  color: '#6b7280', bg: 'rgba(107,114,128,0.1)',  border: 'rgba(107,114,128,0.25)', Icon: Ban },
  basic: { label: 'Basic', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.25)',  Icon: Zap },
  elite: { label: 'Elite', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)',   border: 'rgba(124,58,237,0.25)',  Icon: Crown },
}

function PlanBadge({ plan }) {
  const m = PLAN_META[plan] || PLAN_META.none
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999,
      background: m.bg, border: `1px solid ${m.border}`,
      color: m.color, fontSize: 11, fontWeight: 700,
    }}>
      <m.Icon size={11} />
      {m.label}
    </span>
  )
}

function PlanSelector({ userId, currentPlan, onUpdate }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const select = async (plan) => {
    if (plan === currentPlan) { setOpen(false); return }
    setSaving(true)
    try {
      await api.updateUserPlan(userId, plan)
      onUpdate()
      toast.success(`Tarif yangilandi: ${PLAN_META[plan].label}`)
    } catch {
      toast.error('Xatolik')
    } finally {
      setSaving(false)
      setOpen(false)
    }
  }

  const m = PLAN_META[currentPlan] || PLAN_META.none

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={saving}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 9px', borderRadius: 999, cursor: 'pointer',
          background: m.bg, border: `1px solid ${m.border}`,
          color: m.color, fontSize: 11, fontWeight: 700,
          opacity: saving ? 0.6 : 1,
        }}
        title="Tarifni o'zgartirish"
      >
        <m.Icon size={11} />
        {m.label}
        <span style={{ fontSize: 9, marginLeft: 2 }}>▾</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 50,
            background: 'var(--bg-card, #fff)', border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: 10, padding: 4, minWidth: 110,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
            className="dark:bg-gray-900 dark:border-gray-700"
          >
            {Object.entries(PLAN_META).map(([val, meta]) => (
              <button
                key={val}
                onClick={() => select(val)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '7px 10px', borderRadius: 7,
                  background: val === currentPlan ? meta.bg : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  color: val === currentPlan ? meta.color : 'inherit',
                  fontSize: 12, fontWeight: val === currentPlan ? 700 : 500,
                }}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <meta.Icon size={13} style={{ color: meta.color }} />
                {meta.label}
                {val === currentPlan && <span style={{ marginLeft: 'auto', fontSize: 10 }}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function CreateUserModal({ onClose, onCreated }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('user')
  const [plan, setPlan] = useState('none')
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!username.trim()) { toast.error('Username majburiy'); return }
    if (!password.trim()) { toast.error('Parol majburiy'); return }
    setSaving(true)
    try {
      const res = await api.adminCreateUser({ username: username.trim(), password, role })
      if (plan !== 'none') {
        await api.updateUserPlan(res.data.id, plan)
      }
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

          <div>
            <label className="label text-xs">Tarif</label>
            <div className="flex gap-2">
              {Object.entries(PLAN_META).map(([val, meta]) => (
                <button key={val} type="button"
                  onClick={() => setPlan(val)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 12,
                    fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                    border: `2px solid ${plan === val ? meta.color : 'rgba(0,0,0,0.1)'}`,
                    background: plan === val ? meta.bg : 'transparent',
                    color: plan === val ? meta.color : '#6b7280',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}
                  className="dark:border-gray-700"
                >
                  <meta.Icon size={12} />
                  {meta.label}
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
  const [planFilter, setPlanFilter] = useState('Barchasi')
  const [showCreate, setShowCreate] = useState(false)
  const [devicesModal, setDevicesModal] = useState(null) // { userId, username }

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
    const matchPlan   = planFilter === 'Barchasi' || u.plan === planFilter
    return matchSearch && matchRole && matchStatus && matchPlan
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

  const adminCount  = users.filter(u => u.role === 'admin').length
  const activeCount = users.filter(u => u.is_active).length
  const basicCount  = users.filter(u => u.plan === 'basic').length
  const eliteCount  = users.filter(u => u.plan === 'elite').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Foydalanuvchilar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-3 flex-wrap">
            <span>{users.length} ta jami · {adminCount} admin · {activeCount} faol</span>
            <span style={{ display: 'flex', gap: 6 }}>
              <span style={{ color: '#3b82f6', fontWeight: 700 }}>{basicCount} Basic</span>
              <span style={{ color: '#7c3aed', fontWeight: 700 }}>{eliteCount} Elite</span>
            </span>
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

      {devicesModal && (
        <DevicesModal
          userId={devicesModal.userId}
          username={devicesModal.username}
          onClose={() => setDevicesModal(null)}
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

        {/* Plan filter */}
        <div className="flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-1 gap-1">
          {PLAN_FILTERS.map(f => (
            <button key={f} onClick={() => setPlanFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors`}
              style={planFilter === f
                ? { background: f === 'Barchasi' ? '#7c3aed' : PLAN_META[f]?.color, color: '#fff' }
                : {}
              }>
              {f === 'Barchasi' ? 'Barcha tarif' : PLAN_META[f]?.label}
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
                <th className="text-left px-4 py-3 font-semibold">Tarif</th>
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
                        ${u.role === 'admin' ? 'bg-brand' : u.plan === 'elite' ? 'bg-purple-500' : u.plan === 'basic' ? 'bg-blue-500' : 'bg-gray-400'}`}>
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
                  <td className="px-4 py-3">
                    {u.id !== me?.id ? (
                      <PlanSelector
                        userId={u.id}
                        currentPlan={u.plan || 'none'}
                        onUpdate={() => qc.invalidateQueries({ queryKey: ['adminUsers'] })}
                      />
                    ) : (
                      <PlanBadge plan={u.plan || 'none'} />
                    )}
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
                          onClick={() => setDevicesModal({ userId: u.id, username: u.username })}
                          className="p-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
                          title="Qurilmalar tarixi">
                          <Monitor size={15} className="text-violet-400" />
                        </button>
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
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => setDevicesModal({ userId: u.id, username: u.username })}
                          className="p-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
                          title="Qurilmalar tarixi">
                          <Monitor size={15} className="text-violet-400" />
                        </button>
                      </div>
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
