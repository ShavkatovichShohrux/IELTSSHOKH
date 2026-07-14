import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { ArrowLeft, BookOpen, ChevronUp, ChevronDown } from 'lucide-react'
import client from '../api/client'
import { useAuthStore } from '../store/authStore'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

export default function PdfReader({
  apiPath = 'vocab',
  pathSuffix = 'pdf',
  backTo = '/vocabulary',
  backLabel = 'Topic Based Vocabulary',
}) {
  const { id } = useParams()
  const { token } = useAuthStore()
  const [pages, setPages] = useState([])
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingPage, setLoadingPage] = useState(0)
  const [downloadPct, setDownloadPct] = useState(0)
  const [error, setError] = useState(null)
  const pageRefs = useRef([])
  const pdfRef = useRef(null)

  // Block right-click, print, all devtools shortcuts
  useEffect(() => {
    const noCtx = e => e.preventDefault()
    const noKeys = e => {
      const k = (e.key || '').toLowerCase()
      const c = e.ctrlKey || e.metaKey
      if (c && ['s', 'p', 'u', 'a', 'c'].includes(k)) e.preventDefault()
      if (c && e.shiftKey && ['i', 'j', 'c', 's'].includes(k)) e.preventDefault()
      if (k === 'f12') e.preventDefault()
    }
    document.addEventListener('contextmenu', noCtx)
    document.addEventListener('keydown', noKeys)
    return () => {
      document.removeEventListener('contextmenu', noCtx)
      document.removeEventListener('keydown', noKeys)
    }
  }, [])

  // Track current visible page on scroll
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY + window.innerHeight / 3
      pageRefs.current.forEach((el, idx) => {
        if (el && el.offsetTop <= scrollY) setCurrent(idx + 1)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pages.length])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setPages([])
    setTotal(0)
    setCurrent(1)
    setDownloadPct(0)
    pdfRef.current = null

    const load = async () => {
      try {
        const res = await client.get(`/${apiPath}/${id}/${pathSuffix}?t=${token}`, {
          responseType: 'arraybuffer',
          timeout: 120000,
          onDownloadProgress: evt => {
            if (evt.total) setDownloadPct(Math.round((evt.loaded / evt.total) * 100))
          },
        })
        if (cancelled) return

        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(res.data) }).promise
        if (cancelled) return

        pdfRef.current = pdf
        setTotal(pdf.numPages)
        setLoading(false)

        // Render pages one by one, show as they come
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return
          setLoadingPage(i)
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 1.7 })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
          if (cancelled) return
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
          setPages(prev => [...prev, dataUrl])
        }
        setLoadingPage(0)
      } catch {
        if (!cancelled) {
          setError('PDF yuklab bo\'lmadi. Qaytadan urinib ko\'ring.')
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [id, apiPath, pathSuffix, token])

  const scrollToPage = (n) => {
    const el = pageRefs.current[n - 1]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div
      className="min-h-screen bg-[#1a1a2e]"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      onContextMenu={e => e.preventDefault()}
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur border-b border-white/5
        flex items-center justify-between px-4 h-12 gap-4">
        <Link to={backTo}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors flex-shrink-0">
          <ArrowLeft size={16} /> Orqaga
        </Link>

        <div className="flex items-center gap-2 text-gray-500 text-xs min-w-0 overflow-hidden">
          <BookOpen size={13} className="text-emerald-500 flex-shrink-0" />
          <span className="truncate">{backLabel}</span>
        </div>

        {/* Page counter + nav */}
        {total > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => scrollToPage(Math.max(1, current - 1))}
              disabled={current <= 1}
              className="p-1 rounded text-gray-500 hover:text-white disabled:opacity-30 transition-colors">
              <ChevronUp size={16} />
            </button>
            <span className="text-xs text-gray-400 w-14 text-center">
              {current} / {total}
            </span>
            <button onClick={() => scrollToPage(Math.min(total, current + 1))}
              disabled={current >= pages.length}
              className="p-1 rounded text-gray-500 hover:text-white disabled:opacity-30 transition-colors">
              <ChevronDown size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-3 py-5">

        {/* Initial loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            {downloadPct > 0 && downloadPct < 100
              ? <p className="text-gray-500 text-sm">Yuklanmoqda... {downloadPct}%</p>
              : <p className="text-gray-500 text-sm">PDF yuklanmoqda...</p>
            }
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center justify-center py-40 gap-3">
            <p className="text-red-400 text-sm">{error}</p>
            <Link to={backTo} className="text-emerald-400 text-sm hover:underline">← Orqaga qaytish</Link>
          </div>
        )}

        {/* Rendered pages */}
        <div className="space-y-3">
          {pages.map((src, idx) => (
            <div
              key={idx}
              ref={el => { pageRefs.current[idx] = el }}
              className="relative rounded-xl overflow-hidden shadow-2xl bg-white"
            >
              <img
                src={src}
                alt={`${idx + 1}-sahifa`}
                className="w-full block"
                draggable={false}
                style={{ pointerEvents: 'none', display: 'block' }}
              />
              {/* Transparent overlay — blocks right-click, drag, selection */}
              <div
                className="absolute inset-0"
                onContextMenu={e => e.preventDefault()}
                onDragStart={e => e.preventDefault()}
                onMouseDown={e => e.preventDefault()}
              />
            </div>
          ))}
        </div>

        {/* Rendering progress */}
        {loadingPage > 0 && pages.length < total && (
          <div className="flex items-center justify-center gap-3 py-6 text-gray-500 text-sm">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            {loadingPage}/{total} sahifa render bo'lmoqda...
          </div>
        )}
      </div>

      <style>{`
        @media print { body { display: none !important; } }
        img { -webkit-user-drag: none; user-drag: none; }
      `}</style>
    </div>
  )
}
