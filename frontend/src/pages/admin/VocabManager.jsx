import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Check, X, BookOpen, Upload, FileCheck, FileWarning } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../api/client'

function VocabForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [nameUz, setNameUz] = useState(initial?.name_uz || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim()) { toast.error('Nom majburiy'); return }
    setSaving(true)
    try {
      await onSave({ name: name.trim(), name_uz: nameUz.trim() })
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
      <div className="flex items-center gap-2 pt-1">
        <button onClick={save} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
          <Check size={15} />{saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
        <button onClick={onCancel} className="btn-secondary text-sm flex items-center gap-1.5">
          <X size={15} />Bekor
        </button>
      </div>
    </div>
  )
}

export default function VocabManager() {
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
    fd.append('pdf_file', file)
    try {
      await api.uploadVocabPdf(uploadingId, fd)
      toast.success('PDF yuklandi!')
      qc.invalidateQueries({ queryKey: ['vocabTopics'] })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Yuklashda xato')
    } finally {
      setUploadingId(null)
      e.target.value = ''
    }
  }

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['vocabTopics'],
    queryFn: async () => (await api.getVocabTopics()).data,
  })

  const create = async data => {
    try {
      await api.createVocabTopic(data)
      qc.invalidateQueries({ queryKey: ['vocabTopics'] })
      toast.success('Topic yaratildi')
      setShowCreate(false)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Xatolik')
    }
  }

  const update = async (id, data) => {
    try {
      await api.updateVocabTopic(id, data)
      qc.invalidateQueries({ queryKey: ['vocabTopics'] })
      toast.success('Yangilandi')
      setEditId(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Xatolik')
    }
  }

  const del = async (id, name) => {
    if (!confirm(`"${name}" ni o'chirmoqchimisiz?`)) return
    setDeleting(id)
    try {
      await api.deleteVocabTopic(id)
      qc.invalidateQueries({ queryKey: ['vocabTopics'] })
      toast.success("O'chirildi")
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
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Vocabulary Topiclar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {items.length} ta topic — har biriga PDF fayl yuklang
          </p>
        </div>
        {!showCreate && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} />Yangi topic
          </button>
        )}
      </div>

      {showCreate && (
        <VocabForm onSave={create} onCancel={() => setShowCreate(false)} />
      )}

      {/* Hidden PDF input */}
      <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChosen} />

      {/* List */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="font-medium text-gray-400 mb-1">Hali vocabulary topic yo'q</p>
            <p className="text-xs text-gray-400">Birinchi topicni yarating va PDF yuklang</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map(item => (
              <div key={item.id}>
                {editId === item.id ? (
                  <div className="p-4">
                    <VocabForm
                      initial={item}
                      onSave={data => update(item.id, data)}
                      onCancel={() => setEditId(null)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</span>
                        {item.name_uz && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">{item.name_uz}</span>
                        )}
                      </div>
                      <div className="mt-1">
                        {item.pdf_file ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                            <FileCheck size={11} />PDF yuklangan · {item.pdf_file}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                            <FileWarning size={11} />PDF yo'q
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => triggerUpload(item.id)}
                        disabled={uploadingId === item.id}
                        title={item.pdf_file ? 'PDF ni almashtirish' : 'PDF yuklash'}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-semibold border transition-colors ${
                          item.pdf_file
                            ? 'border-brand/30 text-brand hover:bg-brand/10'
                            : 'border-orange-400/40 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                        }`}>
                        {uploadingId === item.id
                          ? <span className="animate-spin text-xs">⟳</span>
                          : <Upload size={11} />}
                        <span>{item.pdf_file ? 'Almashtir' : 'PDF yuklash'}</span>
                      </button>
                      <button onClick={() => setEditId(item.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <Pencil size={15} className="text-gray-400" />
                      </button>
                      <button onClick={() => del(item.id, item.name)} disabled={deleting === item.id}
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
    </div>
  )
}
