import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Eye, EyeOff, Upload, FileCheck, FileWarning, Pencil, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../api/client'

export default function QuestionTypeManager() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', name_uz: '', order: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', name_uz: '', order: '' })
  const [uploadingId, setUploadingId] = useState(null)
  const fileInputRef = useRef(null)

  const getNum = s => parseInt((s || '').match(/\d+/)?.[0] ?? '9999', 10)

  const { data: raw = [], isLoading } = useQuery({
    queryKey: ['qt-all'],
    queryFn: () => api.getQuestionTypesAll().then(r => r.data),
  })
  const items = [...raw].sort((a, b) => getNum(a.name) - getNum(b.name))

  const createMut = useMutation({
    mutationFn: () => api.createQuestionType(form.name, form.name_uz, Number(form.order) || 0),
    onSuccess: () => {
      toast.success('Qo\'shildi!')
      qc.invalidateQueries(['qt-all'])
      setShowForm(false)
      setForm({ name: '', name_uz: '', order: '' })
    },
    onError: e => toast.error(e.response?.data?.detail || 'Xato'),
  })

  const updateMut = useMutation({
    mutationFn: (id) => api.updateQuestionType(id, {
      name: editForm.name,
      name_uz: editForm.name_uz,
      order: Number(editForm.order) || 0,
    }),
    onSuccess: () => {
      toast.success('Saqlandi!')
      qc.invalidateQueries(['qt-all'])
      setEditingId(null)
    },
    onError: e => toast.error(e.response?.data?.detail || 'Xato'),
  })

  const uploadMut = useMutation({
    mutationFn: ({ id, file }) => {
      const fd = new FormData()
      fd.append('html_file', file)
      return api.uploadQuestionTypeFile(id, fd)
    },
    onSuccess: () => {
      toast.success('HTML fayl yuklandi!')
      qc.invalidateQueries(['qt-all'])
      setUploadingId(null)
    },
    onError: e => toast.error(e.response?.data?.detail || 'Xato'),
  })

  const toggleMut = useMutation({
    mutationFn: id => api.toggleQuestionTypePublish(id),
    onSuccess: () => qc.invalidateQueries(['qt-all']),
  })

  const deleteMut = useMutation({
    mutationFn: id => api.deleteQuestionType(id),
    onSuccess: () => { toast.success('O\'chirildi'); qc.invalidateQueries(['qt-all']) },
    onError: e => toast.error(e.response?.data?.detail || 'Xato'),
  })

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditForm({ name: item.name, name_uz: item.name_uz || '', order: String(item.order || 0) })
  }

  const cancelEdit = () => setEditingId(null)

  const triggerUpload = (id) => {
    setUploadingId(id)
    setTimeout(() => fileInputRef.current?.click(), 50)
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file || !uploadingId) return
    uploadMut.mutate({ id: uploadingId, file })
    e.target.value = ''
  }

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const setEdit = (k, v) => setEditForm(p => ({ ...p, [k]: v }))

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <input ref={fileInputRef} type="file" accept=".html,.pdf" className="hidden" onChange={handleFile} />

      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Question Type Manager</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Speaking question turlarini boshqaring</p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">{items.length} ta question type</span>
        <button onClick={() => { setShowForm(p => !p); setEditingId(null) }} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Yangi qo'shish
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card p-5 mb-5 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Yangi question type</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Nomi (EN) *</label>
              <input className="input" style={{ userSelect: 'text' }} placeholder="Describe a place"
                value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="label">Nomi (UZ)</label>
              <input className="input" style={{ userSelect: 'text' }} placeholder="Joy tasvirla"
                value={form.name_uz} onChange={e => set('name_uz', e.target.value)} />
            </div>
            <div>
              <label className="label">Tartib raqami</label>
              <input type="number" className="input" style={{ userSelect: 'text' }} placeholder="1"
                value={form.order} onChange={e => set('order', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => createMut.mutate()} disabled={!form.name || createMut.isPending} className="btn-primary">
              {createMut.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Bekor</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-center text-gray-400 py-8">Yuklanmoqda...</p>
      ) : items.length === 0 ? (
        <p className="text-center text-gray-400 py-8">Hali question type yo'q.</p>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="card p-4">
              {editingId === item.id ? (
                /* ── Edit mode ── */
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="label">Nomi (EN) *</label>
                      <input className="input" style={{ userSelect: 'text' }}
                        value={editForm.name} onChange={e => setEdit('name', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Nomi (UZ)</label>
                      <input className="input" style={{ userSelect: 'text' }}
                        value={editForm.name_uz} onChange={e => setEdit('name_uz', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Tartib raqami</label>
                      <input type="number" className="input" style={{ userSelect: 'text' }}
                        value={editForm.order} onChange={e => setEdit('order', e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateMut.mutate(item.id)}
                      disabled={!editForm.name || updateMut.isPending}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold bg-brand text-white hover:bg-brand/90 transition-colors"
                    >
                      <Check size={13} /> {updateMut.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                    </button>
                    <button onClick={cancelEdit}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <X size={13} /> Bekor
                    </button>
                  </div>
                </div>
              ) : (
                /* ── View mode ── */
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-400 font-mono">#{item.order || item.id}</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">{item.name}</span>
                      {item.name_uz && <span className="text-xs text-gray-400">· {item.name_uz}</span>}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.is_published ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                        {item.is_published ? 'Aktiv' : 'Yashirin'}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      {item.html_file ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-semibold">
                          <FileCheck size={12} /> {item.html_file}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-orange-500 font-semibold">
                          <FileWarning size={12} /> HTML fayl yo'q
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => triggerUpload(item.id)}
                      disabled={uploadMut.isPending && uploadingId === item.id}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
                        item.html_file
                          ? 'border-brand/30 text-brand hover:bg-brand/10'
                          : 'border-orange-400/40 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                      }`}
                    >
                      {uploadMut.isPending && uploadingId === item.id
                        ? <><span className="animate-spin">⟳</span> Yuklanmoqda</>
                        : <><Upload size={12} /> {item.html_file ? 'Almashtirish' : 'Fayl yuklash'}</>
                      }
                    </button>
                    <button onClick={() => startEdit(item)}
                      className="tbtn-sm text-gray-400 hover:text-blue-500">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => toggleMut.mutate(item.id)}
                      className="tbtn-sm text-gray-400 hover:text-yellow-500">
                      {item.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={() => { if (confirm(`"${item.name}" o'chirilsinmi?`)) deleteMut.mutate(item.id) }}
                      className="tbtn-sm text-gray-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
