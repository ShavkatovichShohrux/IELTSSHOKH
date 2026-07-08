import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Check, X, Tag, Upload, FileCheck, FileWarning } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../api/client'

const COLORS = [
  { value: 'blue',   label: 'Ko\'k',    cls: 'bg-blue-500' },
  { value: 'green',  label: 'Yashil',   cls: 'bg-green-500' },
  { value: 'purple', label: 'Binafsha', cls: 'bg-purple-500' },
  { value: 'orange', label: 'To\'q sariq', cls: 'bg-orange-500' },
  { value: 'red',    label: 'Qizil',    cls: 'bg-red-500' },
  { value: 'teal',   label: 'Moviy',    cls: 'bg-teal-500' },
  { value: 'pink',   label: 'Pushti',   cls: 'bg-pink-500' },
  { value: 'gray',   label: 'Kulrang',  cls: 'bg-gray-500' },
]

const COLOR_MAP = Object.fromEntries(COLORS.map(c => [c.value, c]))

const DOT_CLASS = {
  blue:   'bg-blue-500',   green:  'bg-green-500',  purple: 'bg-purple-500',
  orange: 'bg-orange-500', red:    'bg-red-500',     teal:   'bg-teal-500',
  pink:   'bg-pink-500',   gray:   'bg-gray-500',
}

function TopicBadge({ name, color }) {
  const text_cls = {
    blue:'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40',
    green:'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40',
    purple:'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40',
    orange:'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/40',
    red:'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40',
    teal:'text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/40',
    pink:'text-pink-700 dark:text-pink-300 bg-pink-100 dark:bg-pink-900/40',
    gray:'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${text_cls[color] || text_cls.blue}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOT_CLASS[color] || DOT_CLASS.blue}`} />
      {name}
    </span>
  )
}

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {COLORS.map(c => (
        <button key={c.value} type="button"
          onClick={() => onChange(c.value)}
          title={c.label}
          className={`w-6 h-6 rounded-full ${c.cls} transition-all flex items-center justify-center
            ${value === c.value ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500 scale-110' : 'hover:scale-110'}`}>
          {value === c.value && <Check size={12} className="text-white" />}
        </button>
      ))}
    </div>
  )
}

function TopicForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [nameUz, setNameUz] = useState(initial?.name_uz || '')
  const [color, setColor] = useState(initial?.color || 'blue')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim()) { toast.error('Nom majburiy'); return }
    setSaving(true)
    try {
      await onSave({ name: name.trim(), name_uz: nameUz.trim() || null, color })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label text-xs">Topic nomi (inglizcha) *</label>
          <input className="input text-sm" value={name} onChange={e => setName(e.target.value)}
            placeholder="Environment" autoFocus style={{ userSelect: 'text' }} />
        </div>
        <div>
          <label className="label text-xs">O'zbekcha (ixtiyoriy)</label>
          <input className="input text-sm" value={nameUz} onChange={e => setNameUz(e.target.value)}
            placeholder="Atrof-muhit" style={{ userSelect: 'text' }} />
        </div>
      </div>
      <div>
        <label className="label text-xs mb-2">Rang</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button onClick={save} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
          <Check size={15} />{saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
        <button onClick={onCancel} className="btn-secondary text-sm flex items-center gap-1.5">
          <X size={15} />Bekor
        </button>
        <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">Ko'rinishi:</span>
        <TopicBadge name={name || 'Misol'} color={color} />
      </div>
    </div>
  )
}

export default function TopicManager() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [uploadingId, setUploadingId] = useState(null)
  const fileInputRef = useRef(null)

  const triggerUpload = (id) => {
    setUploadingId(id)
    setTimeout(() => fileInputRef.current?.click(), 50)
  }

  const handleFileChosen = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !uploadingId) return
    const fd = new FormData()
    fd.append('html_file', file)
    try {
      await api.uploadTopicFile(uploadingId, fd)
      toast.success('HTML fayl yuklandi!')
      qc.invalidateQueries({ queryKey: ['topics'] })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Yuklashda xato')
    } finally {
      setUploadingId(null)
      e.target.value = ''
    }
  }

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ['topics'],
    queryFn: async () => (await api.getTopics()).data,
  })

  const create = async data => {
    try {
      await api.createTopic(data)
      qc.invalidateQueries({ queryKey: ['topics'] })
      qc.invalidateQueries({ queryKey: ['adminTests'] })
      toast.success('Topic yaratildi')
      setShowCreate(false)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Xatolik')
    }
  }

  const update = async (id, data) => {
    try {
      await api.updateTopic(id, data)
      qc.invalidateQueries({ queryKey: ['topics'] })
      qc.invalidateQueries({ queryKey: ['adminTests'] })
      toast.success('Topic yangilandi')
      setEditId(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Xatolik')
    }
  }

  const del = async (id, name) => {
    if (!confirm(`"${name}" topicni o'chirmoqchimisiz? Testlar topicsiz qoladi.`)) return
    setDeleting(id)
    try {
      await api.deleteTopic(id)
      qc.invalidateQueries({ queryKey: ['topics'] })
      qc.invalidateQueries({ queryKey: ['adminTests'] })
      toast.success("Topic o'chirildi")
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Xatolik')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Topiclar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {topics.length} ta topic — testlarni mavzu bo'yicha guruhlash
          </p>
        </div>
        {!showCreate && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} />Yangi topic
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <TopicForm onSave={create} onCancel={() => setShowCreate(false)} />
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".html" className="hidden" onChange={handleFileChosen} />

      {/* Topics list */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded" />)}
          </div>
        ) : topics.length === 0 ? (
          <div className="p-12 text-center">
            <Tag size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="font-medium text-gray-400 mb-1">Hali topic yo'q</p>
            <p className="text-xs text-gray-400">Birinchi topicni yarating va testlarni guruhlang</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {topics.map(t => (
              <div key={t.id}>
                {editId === t.id ? (
                  <div className="p-4">
                    <TopicForm
                      initial={t}
                      onSave={data => update(t.id, data)}
                      onCancel={() => setEditId(null)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${DOT_CLASS[t.color] || DOT_CLASS.blue}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <TopicBadge name={t.name} color={t.color} />
                          {t.name_uz && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">{t.name_uz}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-gray-400">{t.tests_count} ta test</p>
                          {t.html_file ? (
                            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                              <FileCheck size={11} />{t.html_file}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                              <FileWarning size={11} />HTML yo'q
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => triggerUpload(t.id)}
                        disabled={uploadingId === t.id}
                        title={t.html_file ? 'HTML faylni almashtirish' : 'HTML fayl yuklash'}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-semibold border transition-colors ${
                          t.html_file
                            ? 'border-brand/30 text-brand hover:bg-brand/10'
                            : 'border-orange-400/40 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                        }`}>
                        {uploadingId === t.id
                          ? <span className="animate-spin text-xs">⟳</span>
                          : <Upload size={11} />}
                        <span>{t.html_file ? 'Almashtir' : 'Yuklash'}</span>
                      </button>
                      <button onClick={() => setEditId(t.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <Pencil size={15} className="text-gray-400" />
                      </button>
                      <button onClick={() => del(t.id, t.name)} disabled={deleting === t.id}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 size={15} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage hint */}
      <div className="card p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">Qanday ishlatiladi?</p>
        <p className="text-xs text-blue-600 dark:text-blue-400">
          Topic yaratgandan so'ng, "Yangi test" yoki "Testni tahrirlash" sahifasida
          har bir testga topic belgilashingiz mumkin. Foydalanuvchilar esa mavzu bo'yicha
          testlarni filtrlashi mumkin bo'ladi.
        </p>
      </div>
    </div>
  )
}
