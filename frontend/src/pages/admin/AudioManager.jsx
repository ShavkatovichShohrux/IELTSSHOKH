import { useState, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload, Trash2, Music, Copy, Check, Search, Play, Square, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../api/client'
import { useAuthStore } from '../../store/authStore'

const MAX_SIZE_MB = 80
const ACCEPT = '.mp3,.m4a,.ogg,.wav'

function fmtSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function AudioManager() {
  const qc = useQueryClient()
  const { token } = useAuthStore()
  const inputRef = useRef(null)

  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [deleting, setDeleting] = useState(null)
  const [copied, setCopied] = useState(null)
  const [playing, setPlaying] = useState(null)
  const [audioEl, setAudioEl] = useState(null)
  const [drag, setDrag] = useState(false)
  const [search, setSearch] = useState('')

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['audioFiles'],
    queryFn: async () => (await api.getAudio()).data,
  })

  const visible = files.filter(f =>
    !search || (f.original_name || f.filename).toLowerCase().includes(search.toLowerCase())
  )

  const doUpload = useCallback(file => {
    if (!file) return
    const sizeMB = file.size / 1024 / 1024
    if (sizeMB > MAX_SIZE_MB) {
      toast.error(`Fayl hajmi ${MAX_SIZE_MB}MB dan oshmasligi kerak (${sizeMB.toFixed(1)} MB)`)
      return
    }

    setUploading(true)
    setProgress(0)

    const fd = new FormData()
    fd.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        qc.invalidateQueries({ queryKey: ['audioFiles'] })
        toast.success('Audio muvaffaqiyatli yuklandi!')
      } else {
        try { toast.error(JSON.parse(xhr.responseText)?.detail || 'Yuklash xatosi') }
        catch { toast.error('Yuklash xatosi') }
      }
      setUploading(false)
      setProgress(0)
      if (inputRef.current) inputRef.current.value = ''
    })
    xhr.addEventListener('error', () => {
      toast.error('Tarmoq xatosi — qayta urinib ko\'ring')
      setUploading(false)
      setProgress(0)
    })
    xhr.open('POST', '/api/audio/upload')
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(fd)
  }, [qc, token])

  const onFileInput = e => { doUpload(e.target.files?.[0]) }

  const onDrop = e => {
    e.preventDefault(); setDrag(false)
    const file = e.dataTransfer.files?.[0]
    if (file) doUpload(file)
  }

  const del = async (id, name) => {
    if (!confirm(`"${name}" ni o'chirmoqchimisiz?`)) return
    setDeleting(id)
    try {
      await api.deleteAudio(id)
      qc.invalidateQueries({ queryKey: ['audioFiles'] })
      if (playing === id) { audioEl?.pause(); setPlaying(null); setAudioEl(null) }
      toast.success("O'chirildi")
    } catch {
      toast.error('Xatolik')
    } finally {
      setDeleting(null)
    }
  }

  const copyUrl = (url, id) => {
    const full = `${window.location.origin}${url}`
    navigator.clipboard.writeText(full).then(() => {
      setCopied(id); toast.success('URL nusxalandi')
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const togglePlay = (f) => {
    if (playing === f.id) {
      audioEl?.pause(); setPlaying(null); setAudioEl(null); return
    }
    if (audioEl) { audioEl.pause() }
    const url = `${window.location.origin}${f.url}`
    const el = new Audio(url)
    el.onended = () => { setPlaying(null); setAudioEl(null) }
    el.onerror = () => { toast.error("Audio yuklanmadi"); setPlaying(null); setAudioEl(null) }
    el.play().then(() => { setAudioEl(el); setPlaying(f.id) }).catch(() => toast.error("Ijro xatosi"))
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Audio fayllar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{files.length} ta fayl</p>
        </div>
        <div>
          <input ref={inputRef} type="file" accept={ACCEPT} onChange={onFileInput} className="hidden" />
          <button onClick={() => inputRef.current?.click()} disabled={uploading}
            className="btn-primary flex items-center gap-2">
            <Upload size={18} />{uploading ? `Yuklanmoqda ${progress}%` : 'Audio yuklash'}
          </button>
        </div>
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="card p-4 space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
            <span>Yuklanmoqda...</span>
            <span className="font-bold">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragEnter={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${uploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
          ${drag
            ? 'border-brand bg-red-50 dark:bg-red-900/10 scale-[1.01]'
            : 'border-gray-300 dark:border-gray-700 hover:border-brand/50 hover:bg-brand/5'}`}>
        <Music size={32} className={`mx-auto mb-2 ${drag ? 'text-brand' : 'text-gray-400'}`} />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {drag ? 'Tashlang!' : 'MP3, M4A, OGG, WAV fayllarini bu yerga tashlang yoki bosing'}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Maksimal hajm: {MAX_SIZE_MB} MB</p>
        {!drag && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400">
            <AlertTriangle size={12} />
            <span>Yuklangan URL'ni test yaratishda audio maydoniga nusxalang</span>
          </div>
        )}
      </div>

      {/* Search */}
      {files.length > 3 && (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9 text-sm" placeholder="Fayl nomi bo'yicha qidirish..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ userSelect: 'text' }} />
        </div>
      )}

      {/* Files list */}
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-16" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          {files.length === 0 ? 'Hali audio fayl yuklanmagan' : 'Hech narsa topilmadi'}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-semibold">Fayl</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Hajmi</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Sana</th>
                <th className="text-right px-4 py-3 font-semibold">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {visible.map(f => (
                <tr key={f.id} className={`transition-colors ${playing === f.id ? 'bg-red-50/40 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                        ${playing === f.id ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                        <Music size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                          {f.original_name || f.filename}
                        </div>
                        <div className="text-xs text-gray-400 font-mono truncate max-w-xs">{f.url}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">{fmtSize(f.file_size)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">
                    {new Date(f.uploaded_at).toLocaleDateString('uz-UZ')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <button onClick={() => togglePlay(f)}
                        className={`p-2 rounded-lg transition-colors ${playing === f.id ? 'bg-brand/10 text-brand' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'}`}
                        title={playing === f.id ? "To'xtatish" : "Tinglash"}>
                        {playing === f.id ? <Square size={15} /> : <Play size={15} />}
                      </button>
                      <button onClick={() => copyUrl(f.url, f.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="URL nusxalash">
                        {copied === f.id ? <Check size={15} className="text-green-500" /> : <Copy size={15} className="text-gray-400" />}
                      </button>
                      <button onClick={() => del(f.id, f.original_name || f.filename)} disabled={deleting === f.id}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 size={15} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
