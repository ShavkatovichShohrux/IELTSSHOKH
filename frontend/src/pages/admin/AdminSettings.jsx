import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Settings, CreditCard, Tag, Send, FileText, Save, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../api/client'

export default function AdminSettings() {
  const qc = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => api.getSettings().then(r => r.data),
  })

  useEffect(() => {
    if (data && !form) setForm(data)
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form) return
    setSaving(true)
    try {
      await api.updateSettings(form)
      qc.invalidateQueries({ queryKey: ['siteSettings'] })
      toast.success('Sozlamalar saqlandi')
    } catch {
      toast.error('Xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !form) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded w-64" />
        <div className="card p-6 space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Settings size={22} className="text-brand" /> Tizim sozlamalari
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          To'lov ma'lumotlari va tarif narxlari
        </p>
      </div>

      {/* To'lov kartasi */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard size={17} className="text-violet-500" />
          <h2 className="font-bold text-gray-900 dark:text-gray-100">To'lov kartasi</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="label text-xs">Karta raqami</label>
            <input
              className="input font-mono text-lg tracking-widest"
              value={form.card_number}
              onChange={e => set('card_number', e.target.value)}
              placeholder="8600 0000 0000 0000"
              maxLength={19}
            />
            <p className="text-xs text-gray-400 mt-1">Foydalanuvchiga ko'rsatiladigan karta raqami</p>
          </div>

          <div>
            <label className="label text-xs">Karta egasi</label>
            <input
              className="input"
              value={form.card_holder}
              onChange={e => set('card_holder', e.target.value)}
              placeholder="SHOHRUX SHAVKATOV"
            />
          </div>
        </div>
      </div>

      {/* Tarif nomlari va narxlari */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Tag size={17} className="text-blue-500" />
          <h2 className="font-bold text-gray-900 dark:text-gray-100">Tarif nomlari va narxlari</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-900/10">
            <div className="text-xs font-bold text-blue-500 uppercase tracking-wider">⚡ 1-chi tarif</div>
            <div>
              <label className="label text-xs">Nomi</label>
              <input
                className="input"
                value={form.basic_name}
                onChange={e => set('basic_name', e.target.value)}
                placeholder="Basic"
              />
            </div>
            <div>
              <label className="label text-xs">Narxi</label>
              <input
                className="input"
                value={form.basic_price}
                onChange={e => set('basic_price', e.target.value)}
                placeholder="50,000 so'm / oy"
              />
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-xl border border-violet-100 dark:border-violet-900/40 bg-violet-50/50 dark:bg-violet-900/10">
            <div className="text-xs font-bold text-violet-500 uppercase tracking-wider">👑 2-chi tarif</div>
            <div>
              <label className="label text-xs">Nomi</label>
              <input
                className="input"
                value={form.elite_name}
                onChange={e => set('elite_name', e.target.value)}
                placeholder="Elite"
              />
            </div>
            <div>
              <label className="label text-xs">Narxi</label>
              <input
                className="input"
                value={form.elite_price}
                onChange={e => set('elite_price', e.target.value)}
                placeholder="100,000 so'm / oy"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Telegram va yo'riqnoma */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Send size={17} className="text-sky-500" />
          <h2 className="font-bold text-gray-900 dark:text-gray-100">Telegram</h2>
        </div>

        <div>
          <label className="label text-xs">Telegram username</label>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-bold text-sm">@</span>
            <input
              className="input flex-1"
              value={form.telegram_username}
              onChange={e => set('telegram_username', e.target.value.replace('@', ''))}
              placeholder="shokh_shavkatovich"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            To'lov qilinganidan keyin foydalanuvchi shu username ga yo'naltiriladi
          </p>
        </div>

        <div>
          <label className="label text-xs flex items-center gap-2">
            <FileText size={13} /> Qo'shimcha yo'riqnoma (ixtiyoriy)
          </label>
          <textarea
            className="input min-h-[80px] resize-none"
            value={form.payment_note}
            onChange={e => set('payment_note', e.target.value)}
            placeholder="To'lov qilgandan so'ng chekni Telegramga yuboring..."
          />
        </div>
      </div>

      {/* Preview */}
      <div className="card p-5 border-dashed border-violet-300 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-900/10">
        <p className="text-xs font-bold text-violet-500 mb-3 uppercase tracking-wider">Ko'rinish (Preview)</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Karta:</span>
            <span className="font-mono font-bold text-gray-900 dark:text-gray-100 text-base tracking-widest">
              {form.card_number || '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Egasi:</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">{form.card_holder || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">⚡ {form.basic_name || 'Basic'}:</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">{form.basic_price || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">👑 {form.elite_name || 'Elite'}:</span>
            <span className="text-violet-600 dark:text-violet-400 font-bold">{form.elite_price || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Telegram:</span>
            <span className="text-sky-500 font-medium">@{form.telegram_username || '—'}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-6"
        >
          {saving
            ? <RefreshCw size={16} className="animate-spin" />
            : <Save size={16} />
          }
          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </div>
    </div>
  )
}
