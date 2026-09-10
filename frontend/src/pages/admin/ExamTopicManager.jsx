import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Check, X, Upload, FileCheck, FileWarning, Eye, EyeOff, Crown, FileText, File } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../api/client'

export default function ExamTopicManager() {
  const qc = useQueryClient()
  const htmlInputRef = useRef({})
  const pdfInputRef = useRef({})
  const formFileRef = useRef(null)

  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', order: 0 })
  const [formFile, setFormFile] = useState(null)
  const [formSaving, setFormSaving] = useState(false)
  const [uploading, setUploading] = useState({})

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ['exam-topics-all'],
    queryFn: () => api.getExamTopicsAll().then(r => r.data),
  })

  const refetch = () => qc.invalidateQueries(['exam-topics-all'])
  const resetForm = () => {
    setForm({ title: '', description: '', order: 0 })
    setFormFile(null)
    if (formFileRef.current) formFileRef.current.value = ''
    setCreating(false)
    setEditingId(null)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Sarlavha kiritilmagan')
    setFormSaving(true)
    try {
      let id = editingId
      if (editingId) {
        await api.updateExamTopic(editingId, form)
        toast.success('Yangilandi')
      } else {
        const res = await api.createExamTopic(form)
        id = res.data.id
        toast.success('Qo\'shildi')
      }
      // Upload file if selected
      if (formFile && id) {
        const fd = new FormData()
        fd.append('file', formFile)
        fd.append('file_type', formFile.name.endsWith('.pdf') ? 'pdf' : 'html')
        await api.uploadExamTopicFile(id, fd)
        toast.success('Fayl yuklandi')
      }
      refetch(); resetForm()
    } catch { toast.error('Xatolik') }
    finally { setFormSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('O\'chirilsinmi?')) return
    try { await api.deleteExamTopic(id); refetch(); toast.success('O\'chirildi') }
    catch { toast.error('Xatolik') }
  }

  const handleTogglePublish = async (id) => {
    try { await api.toggleExamTopicPublish(id); refetch() }
    catch { toast.error('Xatolik') }
  }

  const handleUpload = async (id, file, type) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('file_type', type)
    setUploading(p => ({ ...p, [`${id}_${type}`]: true }))
    try {
      await api.uploadExamTopicFile(id, fd)
      refetch()
      toast.success(`${type.toUpperCase()} yuklandi`)
    } catch { toast.error('Yuklashda xatolik') }
    finally { setUploading(p => ({ ...p, [`${id}_${type}`]: false })) }
  }

  const startEdit = (t) => {
    setEditingId(t.id)
    setForm({ title: t.title, description: t.description || '', order: t.order || 0 })
    setCreating(false)
  }

  const fileExt = (path) => path?.split('.').pop()?.toLowerCase()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Crown size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-gray-100">Exam Topics</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sep & Dec 2026 · Elite only</p>
          </div>
        </div>
        {!creating && !editingId && (
          <button
            onClick={() => { setCreating(true); setEditingId(null); setForm({ title: '', description: '', order: 0 }) }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <Plus size={16} /> Yangi topic
          </button>
        )}
      </div>

      {/* Form */}
      {(creating || editingId) && (
        <div className="mb-5 p-4 rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10">
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
            {editingId ? 'Tahrirlash' : 'Yangi topic qo\'shish'}
          </h2>
          <div className="flex flex-col gap-3">
            <input
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-400"
              placeholder="Sarlavha (masalan: Describe a place you visited)"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            />
            <input
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-400"
              placeholder="Tavsif (ixtiyoriy)"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
            <input
              type="number"
              className="w-32 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-400"
              placeholder="Tartib (0, 1, 2...)"
              value={form.order}
              onChange={e => setForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))}
            />

            {/* File upload in form */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">
                Fayl yuklash (HTML yoki PDF) — ixtiyoriy
              </label>
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 cursor-pointer transition-colors">
                <Upload size={15} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {formFile ? formFile.name : 'HTML yoki PDF tanlang...'}
                </span>
                <input
                  type="file" accept=".html,.pdf" className="hidden"
                  ref={formFileRef}
                  onChange={e => setFormFile(e.target.files[0] || null)}
                />
              </label>
              {formFile && (
                <button onClick={() => { setFormFile(null); if (formFileRef.current) formFileRef.current.value = '' }}
                  className="mt-1 text-xs text-red-500 hover:text-red-600">
                  × Faylni olib tashlash
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button onClick={handleSave} disabled={formSaving} className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors">
              {formSaving
                ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Check size={15} />}
              Saqlash
            </button>
            <button onClick={resetForm} disabled={formSaving} className="flex items-center gap-1.5 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-xl transition-colors">
              <X size={15} /> Bekor
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : topics.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
          Hali topic qo'shilmagan
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {topics.map(t => {
            const ext = fileExt(t.html_file)
            const hasPdf = ext === 'pdf'
            const hasHtml = ext === 'html'
            return (
              <div key={t.id} className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="flex items-start gap-3">
                  {/* Order number */}
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-purple-600 dark:text-purple-400">{t.order}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{t.title}</p>
                    {t.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.description}</p>}

                    {/* File status badges */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {t.html_file ? (
                        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${hasPdf ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                          {hasPdf ? <File size={11} /> : <FileText size={11} />}
                          {hasPdf ? 'PDF yuklangan' : 'HTML yuklangan'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                          <FileWarning size={12} /> Fayl yo'q
                        </span>
                      )}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.is_published ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                        {t.is_published ? 'Aktiv' : 'Yashirin'}
                      </span>
                    </div>

                    {/* Upload buttons row */}
                    <div className="flex items-center gap-2 mt-3">
                      {/* HTML upload */}
                      <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors text-xs font-bold
                        ${hasHtml ? 'border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600'}`}
                        title="HTML fayl yuklash">
                        {uploading[`${t.id}_html`]
                          ? <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                          : <FileText size={13} />
                        }
                        HTML
                        <input type="file" accept=".html" className="hidden"
                          ref={el => htmlInputRef.current[t.id] = el}
                          onChange={e => e.target.files[0] && handleUpload(t.id, e.target.files[0], 'html')}
                        />
                      </label>

                      {/* PDF upload */}
                      <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors text-xs font-bold
                        ${hasPdf ? 'border-red-400 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-red-400 hover:text-red-600'}`}
                        title="PDF fayl yuklash">
                        {uploading[`${t.id}_pdf`]
                          ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                          : <File size={13} />
                        }
                        PDF
                        <input type="file" accept=".pdf" className="hidden"
                          ref={el => pdfInputRef.current[t.id] = el}
                          onChange={e => e.target.files[0] && handleUpload(t.id, e.target.files[0], 'pdf')}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleTogglePublish(t.id)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title={t.is_published ? 'Yashirish' : 'Ko\'rsatish'}>
                      {t.is_published ? <Eye size={16} className="text-green-500" /> : <EyeOff size={16} className="text-gray-400" />}
                    </button>
                    <button onClick={() => startEdit(t)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <Pencil size={16} className="text-blue-500" />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
