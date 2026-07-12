import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Eye, EyeOff, Copy, Ban, Check, Link, Upload, FileCheck, FileWarning } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../api/client'

const TABS = ['dossiers', 'tokens']
const TAB_LABELS = { dossiers: '📚 Dossierlar', tokens: '🔑 Tokenlar' }

export default function SpeakingManager() {
  const [tab, setTab] = useState('dossiers')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Speaking Manager</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Dossierlar va xaridor tokenlarini boshqaring</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-800">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-700 border-b-2 transition-colors ${tab === t ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'dossiers' ? <DossiersTab /> : <TokensTab />}
    </div>
  )
}

/* ─────────────────────────────────────── DOSSIERS TAB ─── */
function DossiersTab() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title_uz: '', title_en: '', title_ru: '',
    description_uz: '', description_en: '', description_ru: '',
    price: '', file: null,
  })
  const [uploadingId, setUploadingId] = useState(null)
  const fileInputRef = useRef(null)

  const getNum = s => parseInt((s || '').match(/\d+/)?.[0] ?? '9999', 10)

  const { data: dossiers = [], isLoading } = useQuery({
    queryKey: ['speaking-dossiers-all'],
    queryFn: () => api.getSpeakingDossiersAll().then(r => {
      return [...r.data].sort((a, b) => {
        const na = getNum(a.title_uz || a.title_en)
        const nb = getNum(b.title_uz || b.title_en)
        return na !== nb ? na - nb : a.id - b.id
      })
    }),
  })

  const createMut = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('title_uz', form.title_uz)
      fd.append('title_en', form.title_en)
      fd.append('title_ru', form.title_ru)
      fd.append('description_uz', form.description_uz)
      fd.append('description_en', form.description_en)
      fd.append('description_ru', form.description_ru)
      fd.append('price', form.price)
      if (form.file) fd.append('html_file', form.file)
      return api.createSpeakingDossier(fd)
    },
    onSuccess: () => {
      toast.success('Dossier qo\'shildi!')
      qc.invalidateQueries(['speaking-dossiers-all'])
      setShowForm(false)
      setForm({ title_uz: '', title_en: '', title_ru: '', description_uz: '', description_en: '', description_ru: '', price: '', file: null })
    },
    onError: e => toast.error(e.response?.data?.detail || 'Xato'),
  })

  const uploadMut = useMutation({
    mutationFn: ({ id, file }) => {
      const fd = new FormData()
      fd.append('html_file', file)
      return api.uploadSpeakingDossierFile(id, fd)
    },
    onSuccess: (_, vars) => {
      toast.success('HTML fayl yuklandi!')
      qc.invalidateQueries(['speaking-dossiers-all'])
      setUploadingId(null)
    },
    onError: e => toast.error(e.response?.data?.detail || 'Yuklashda xato'),
  })

  const toggleMut = useMutation({
    mutationFn: id => api.toggleSpeakingPublish(id),
    onSuccess: () => qc.invalidateQueries(['speaking-dossiers-all']),
    onError: () => toast.error('Xato'),
  })

  const deleteMut = useMutation({
    mutationFn: id => api.deleteSpeakingDossier(id),
    onSuccess: () => { toast.success('O\'chirildi'); qc.invalidateQueries(['speaking-dossiers-all']) },
    onError: e => toast.error(e.response?.data?.detail || 'Xato'),
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const triggerUpload = (id) => {
    setUploadingId(id)
    setTimeout(() => fileInputRef.current?.click(), 50)
  }

  const handleFileChosen = (e) => {
    const file = e.target.files?.[0]
    if (!file || !uploadingId) return
    uploadMut.mutate({ id: uploadingId, file })
    e.target.value = ''
  }

  return (
    <div>
      {/* Hidden file input for per-row upload */}
      <input ref={fileInputRef} type="file" accept=".html" className="hidden" onChange={handleFileChosen} />

      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">{dossiers.length} ta dossier</span>
        <button onClick={() => setShowForm(p => !p)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Yangi dossier
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card p-5 mb-5 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Yangi dossier qo'shish</h3>

          <div className="grid grid-cols-3 gap-3">
            {['uz', 'en', 'ru'].map(l => (
              <div key={l}>
                <label className="label">Sarlavha ({l.toUpperCase()})</label>
                <input className="input" style={{ userSelect: 'text' }} placeholder={`Sarlavha ${l}`}
                  value={form[`title_${l}`]} onChange={e => set(`title_${l}`, e.target.value)} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {['uz', 'en', 'ru'].map(l => (
              <div key={l}>
                <label className="label">Tavsif ({l.toUpperCase()})</label>
                <textarea className="input" style={{ userSelect: 'text', resize: 'none', height: 72 }} placeholder={`Tavsif ${l}`}
                  value={form[`description_${l}`]} onChange={e => set(`description_${l}`, e.target.value)} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Narxi (masalan: 50,000 so'm)</label>
              <input className="input" style={{ userSelect: 'text' }} placeholder="50,000 so'm"
                value={form.price} onChange={e => set('price', e.target.value)} />
            </div>
            <div>
              <label className="label">HTML fayl <span className="text-gray-400 font-normal">(ixtiyoriy — keyinchalik ham yuklash mumkin)</span></label>
              <input type="file" accept=".html"
                onChange={e => set('file', e.target.files[0])}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 cursor-pointer" />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => createMut.mutate()} disabled={!form.title_uz || createMut.isPending} className="btn-primary">
              {createMut.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Bekor qilish</button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <p className="text-center text-gray-400 py-8">Yuklanmoqda...</p>
      ) : dossiers.length === 0 ? (
        <p className="text-center text-gray-400 py-8">Hali dossier yo'q. Yangi qo'shing.</p>
      ) : (
        <div className="space-y-3">
          {dossiers.map(d => (
            <div key={d.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 dark:text-gray-100 truncate">{d.title_uz}</span>
                    {d.title_en && <span className="text-xs text-gray-400">/ {d.title_en}</span>}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${d.is_published ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                      {d.is_published ? 'Aktiv' : 'Yashirin'}
                    </span>
                  </div>
                  {d.description_uz && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{d.description_uz}</p>}
                  <div className="flex gap-3 mt-1.5 text-xs text-gray-400 flex-wrap items-center">
                    {/* HTML file status */}
                    {d.html_file ? (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                        <FileCheck size={12} /> {d.html_file}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-orange-500 font-semibold">
                        <FileWarning size={12} /> HTML fayl yo'q
                      </span>
                    )}
                    {d.price && <span>💰 {d.price}</span>}
                    <span>🔑 {d.token_count} token</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* HTML Upload button */}
                  <button
                    onClick={() => triggerUpload(d.id)}
                    disabled={uploadMut.isPending && uploadingId === d.id}
                    title={d.html_file ? 'HTML faylni almashtirish' : 'HTML fayl yuklash'}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors border ${
                      d.html_file
                        ? 'border-brand/30 text-brand hover:bg-brand/10'
                        : 'border-orange-400/40 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                    }`}
                  >
                    {uploadMut.isPending && uploadingId === d.id
                      ? <><span className="animate-spin">⟳</span> Yuklanmoqda</>
                      : <><Upload size={12} /> {d.html_file ? 'Almashtirish' : 'Fayl yuklash'}</>
                    }
                  </button>

                  <button onClick={() => toggleMut.mutate(d.id)} title={d.is_published ? 'Yashirish' : 'Chiqarish'}
                    className="tbtn-sm text-gray-400 hover:text-yellow-500">
                    {d.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button onClick={() => { if (confirm(`"${d.title_uz}" o'chirilsinmi?`)) deleteMut.mutate(d.id) }}
                    className="tbtn-sm text-gray-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────── TOKENS TAB ─── */
function TokensTab() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ buyer_name: '', telegram: '', dossier_id: '', max_views: 0 })
  const [newToken, setNewToken] = useState(null)
  const [copied, setCopied] = useState(false)

  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ['speaking-tokens'],
    queryFn: () => api.getSpeakingTokens().then(r => r.data),
  })

  const { data: dossiers = [] } = useQuery({
    queryKey: ['speaking-dossiers-all'],
    queryFn: () => api.getSpeakingDossiersAll().then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: () => api.createSpeakingToken({
      buyer_name: form.buyer_name,
      telegram: form.telegram,
      dossier_id: Number(form.dossier_id),
      max_views: Number(form.max_views),
    }),
    onSuccess: r => {
      toast.success('Token yaratildi!')
      setNewToken(r.data)
      qc.invalidateQueries(['speaking-tokens'])
      setForm({ buyer_name: '', telegram: '', dossier_id: '', max_views: 0 })
    },
    onError: e => toast.error(e.response?.data?.detail || 'Xato'),
  })

  const revokeMut = useMutation({
    mutationFn: token => api.revokeSpeakingToken(token),
    onSuccess: () => { toast.success('Bloklandi'); qc.invalidateQueries(['speaking-tokens']) },
    onError: () => toast.error('Xato'),
  })

  const fullUrl = tok => `${window.location.origin}/s/${tok}`

  const copyUrl = url => {
    navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
    toast.success('Link nusxalandi!')
  }

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">{tokens.length} ta token</span>
        <button onClick={() => { setShowForm(p => !p); setNewToken(null) }} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Yangi token
        </button>
      </div>

      {showForm && (
        <div className="card p-5 mb-5 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Xaridor uchun token yaratish</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Xaridor ismi *</label>
              <input className="input" style={{ userSelect: 'text' }} placeholder="Sardor Karimov"
                value={form.buyer_name} onChange={e => set('buyer_name', e.target.value)} />
            </div>
            <div>
              <label className="label">Telegram username</label>
              <input className="input" style={{ userSelect: 'text' }} placeholder="@sardor_uz"
                value={form.telegram} onChange={e => set('telegram', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Dossier *</label>
              <select className="input" value={form.dossier_id} onChange={e => set('dossier_id', e.target.value)}>
                <option value="">— tanlang —</option>
                {dossiers.map(d => (
                  <option key={d.id} value={d.id} disabled={!d.html_file}>
                    {d.title_uz}{!d.html_file ? ' ⚠ (HTML yo\'q)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Max ko'rish (0 = cheksiz)</label>
              <input type="number" min={0} className="input" style={{ userSelect: 'text' }}
                value={form.max_views} onChange={e => set('max_views', e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={() => createMut.mutate()} disabled={!form.buyer_name || !form.dossier_id || createMut.isPending} className="btn-primary">
              {createMut.isPending ? 'Yaratilmoqda...' : 'Token yaratish'}
            </button>
            <button onClick={() => { setShowForm(false); setNewToken(null) }} className="btn-secondary">Bekor</button>
          </div>

          {newToken && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check size={16} className="text-green-600 dark:text-green-400" />
                <span className="font-bold text-green-700 dark:text-green-400 text-sm">Token tayyor — xaridorga yuboring</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-nowrap" style={{ userSelect: 'text' }}>
                  {fullUrl(newToken.token)}
                </code>
                <button onClick={() => copyUrl(fullUrl(newToken.token))}
                  className="flex-shrink-0 btn-primary flex items-center gap-1.5 text-xs py-2">
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Nusxalandi' : 'Nusxalash'}
                </button>
              </div>
              <p className="text-xs text-green-600 dark:text-green-500 mt-2">
                Dossier: <b>{newToken.dossier}</b> · Xaridor: <b>{newToken.buyer_name}</b> {newToken.telegram}
              </p>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <p className="text-center text-gray-400 py-8">Yuklanmoqda...</p>
      ) : tokens.length === 0 ? (
        <p className="text-center text-gray-400 py-8">Hali token yo'q.</p>
      ) : (
        <div className="space-y-2">
          {tokens.map(tok => (
            <div key={tok.id} className={`card p-4 flex items-center gap-4 ${!tok.is_active ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{tok.buyer_name}</span>
                  {tok.telegram && <span className="text-xs text-brand">{tok.telegram}</span>}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tok.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                    {tok.is_active ? 'Aktiv' : 'Bloklangan'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  📚 {tok.dossier} · 👁 {tok.view_count}{tok.max_views > 0 ? `/${tok.max_views}` : ''} marta ko'rildi
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {tok.is_active && (
                  <>
                    <button onClick={() => copyUrl(fullUrl(tok.token))} title="Linkni nusxalash"
                      className="tbtn-sm text-gray-400 hover:text-brand">
                      <Link size={15} />
                    </button>
                    <button onClick={() => { if (confirm(`${tok.buyer_name} tokeni bloklansinmi?`)) revokeMut.mutate(tok.token) }}
                      title="Bloklash" className="tbtn-sm text-gray-400 hover:text-red-500">
                      <Ban size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
