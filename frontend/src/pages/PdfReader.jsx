import { useEffect, useRef, useState, useCallback } from 'react'
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
  const [numPages, setNumPages] = useState(0)
  const [current, setCurrent] = useState(1)
  const [loading, setLoading] = useState(true)
  const [downloadPct, setDownloadPct] = useState(0)
  const [error, setError] = useState(null)
  const [aspect, setAspect] = useState(1 / 1.414) // width/height (A4 portrait default)

  const pdfRef = useRef(null)
  const containerRef = useRef(null)
  const holderRefs = useRef([])
  const rendered = useRef(new Map()) // pageNum -> { task }

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
      const line = window.scrollY + window.innerHeight / 3
      let cur = 1
      holderRefs.current.forEach((el, idx) => {
        if (el && el.offsetTop <= line) cur = idx + 1
      })
      setCurrent(cur)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [numPages])

  // Render one page into its placeholder. Scale is based on the on-screen width
  // (× devicePixelRatio, capped) so mobile renders a right-sized, memory-light
  // canvas instead of a fixed oversized one.
  const renderPage = useCallback(async (n) => {
    const pdf = pdfRef.current
    const holder = holderRefs.current[n - 1]
    if (!pdf || !holder || rendered.current.has(n)) return
    rendered.current.set(n, {}) // lock to avoid double render
    try {
      const page = await pdf.getPage(n)
      const cssW = (containerRef.current?.clientWidth) || holder.clientWidth || 700
      const base = page.getViewport({ scale: 1 })
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const viewport = page.getViewport({ scale: (cssW * dpr) / base.width })

      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block'
      canvas.setAttribute('draggable', 'false')

      const task = page.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport })
      rendered.current.set(n, { task })
      await task.promise

      holder.innerHTML = ''
      holder.appendChild(canvas)
      // Transparent overlay blocks right-click / drag / long-press save
      const ov = document.createElement('div')
      ov.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%'
      ov.addEventListener('contextmenu', e => e.preventDefault())
      ov.addEventListener('dragstart', e => e.preventDefault())
      holder.appendChild(ov)
      page.cleanup()
    } catch {
      rendered.current.delete(n) // allow retry on next scroll
    }
  }, [])

  // Free a far-off page's canvas to keep memory bounded on large PDFs
  const freePage = useCallback((n) => {
    const rec = rendered.current.get(n)
    if (!rec) return
    try { rec.task?.cancel() } catch {}
    rendered.current.delete(n)
    const holder = holderRefs.current[n - 1]
    if (holder) holder.innerHTML = ''
  }, [])

  // Load the PDF document
  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null); setNumPages(0); setCurrent(1); setDownloadPct(0)
    rendered.current = new Map()
    holderRefs.current = []
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
        if (cancelled) { try { pdf.destroy() } catch {} ; return }
        pdfRef.current = pdf
        try {
          const p1 = await pdf.getPage(1)
          const vp = p1.getViewport({ scale: 1 })
          if (!cancelled) setAspect(vp.width / vp.height)
          p1.cleanup()
        } catch {}
        if (cancelled) return
        setNumPages(pdf.numPages)
        setLoading(false)
      } catch {
        if (!cancelled) { setError('PDF yuklab bo\'lmadi. Qaytadan urinib ko\'ring.'); setLoading(false) }
      }
    }
    load()
    return () => {
      cancelled = true
      rendered.current.forEach(rec => { try { rec.task?.cancel() } catch {} })
      rendered.current.clear()
      try { pdfRef.current?.destroy() } catch {}
    }
  }, [id, apiPath, pathSuffix, token])

  // Lazily render pages near the viewport; free the ones that scroll far away.
  useEffect(() => {
    if (!numPages) return
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(en => {
          const n = Number(en.target.dataset.page)
          if (en.isIntersecting) renderPage(n)
          else freePage(n)
        })
      },
      { root: null, rootMargin: '1500px 0px', threshold: 0.01 }
    )
    holderRefs.current.forEach(el => el && io.observe(el))
    return () => io.disconnect()
  }, [numPages, renderPage, freePage])

  const scrollToPage = (n) => {
    const el = holderRefs.current[n - 1]
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
        {numPages > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => scrollToPage(Math.max(1, current - 1))}
              disabled={current <= 1}
              className="p-1 rounded text-gray-500 hover:text-white disabled:opacity-30 transition-colors">
              <ChevronUp size={16} />
            </button>
            <span className="text-xs text-gray-400 w-14 text-center">
              {current} / {numPages}
            </span>
            <button onClick={() => scrollToPage(Math.min(numPages, current + 1))}
              disabled={current >= numPages}
              className="p-1 rounded text-gray-500 hover:text-white disabled:opacity-30 transition-colors">
              <ChevronDown size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div ref={containerRef} className="max-w-3xl mx-auto px-3 py-5">

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

        {/* Page placeholders — each keeps its aspect-ratio height so scrolling is
            stable before/after its canvas is lazily rendered or freed. */}
        <div className="space-y-3">
          {Array.from({ length: numPages }).map((_, idx) => (
            <div
              key={idx}
              data-page={idx + 1}
              ref={el => { holderRefs.current[idx] = el }}
              className="relative rounded-xl overflow-hidden shadow-2xl bg-white"
              style={{ height: 0, paddingBottom: `${(1 / (aspect || 0.707)) * 100}%` }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @media print { body { display: none !important; } }
        canvas, img { -webkit-user-drag: none; user-drag: none; }
      `}</style>
    </div>
  )
}
