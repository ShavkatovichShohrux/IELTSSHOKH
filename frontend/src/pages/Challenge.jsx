import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Flame, CheckCircle2, Play, Pause, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { api } from '../api/client'
import { useChallenge, buildSchedule } from '../hooks/useChallenge'

const MILESTONES = [
  { day: 7,  emoji: '🌱', label: 'First Week',  color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  { day: 14, emoji: '🔥', label: 'On Fire',      color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  { day: 21, emoji: '⚡', label: 'Power Streak', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  { day: 30, emoji: '🏆', label: 'Champion',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
]

function CueCard({ topicId, token, topicName, c, isDark }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['cuecard', topicId],
    queryFn: async () => {
      const res = await fetch(`/api/topics/${topicId}/content?t=${token}`)
      if (!res.ok) throw new Error(res.status)
      const html = await res.text()

      // Data JS orqali dinamik yuklanadi — TOPIC_DATA.cueCard dan regex bilan olamiz
      const cueStart = html.indexOf('cueCard:')
      let title = topicName
      let items = []

      if (cueStart !== -1) {
        const slice = html.slice(cueStart)
        const titleM = slice.match(/title\s*:\s*"([^"]+)"/)
        if (titleM) title = titleM[1]

        const pStart = slice.indexOf('points:')
        if (pStart !== -1) {
          const pSlice = slice.slice(pStart)
          const bOpen = pSlice.indexOf('[')
          const bClose = pSlice.indexOf(']')
          if (bOpen !== -1 && bClose !== -1) {
            const block = pSlice.slice(bOpen + 1, bClose)
            const re = /"((?:[^"\\]|\\.)*)"/g
            let m
            while ((m = re.exec(block)) !== null) {
              const text = m[1].replace(/<[^>]+>/g, '').trim()
              if (text) items.push(text)
            }
          }
        }
      }

      // Timer statik HTML da bor — DOMParser bilan olamiz
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const timer = doc.querySelector('.cuecard-timer')?.textContent?.trim() || '⏱ 1 min prep · 1-2 min talk'

      return { title, items, timer }
    },
    enabled: !!topicId && !!token,
    retry: 1,
    staleTime: 10 * 60 * 1000,
  })

  if (isLoading) return (
    <div style={{ padding: '20px 22px', color: c.textFaint, fontSize: 13 }}>
      Loading cue card...
    </div>
  )

  if (isError || !data) return (
    <div style={{ padding: '20px 22px', color: c.textFaint, fontSize: 12 }}>
      ⚠️ Backend ishlamoqda ekanligini tekshiring (port 8000)
    </div>
  )

  return (
    <div style={{
      background: isDark ? '#181a27' : '#ffffff',
      border: '1.5px dashed #7c5cff',
      borderRadius: 18,
      padding: '22px 24px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <span style={{
          background: 'linear-gradient(135deg,#8a6bff,#4a6cf7)',
          color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
          padding: '5px 13px', borderRadius: 999,
        }}>
          CUE CARD
        </span>
        <span style={{ fontSize: 11, color: c.textMuted, fontWeight: 600 }}>
          ⏱ {data.timer}
        </span>
      </div>

      <h3 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 700, lineHeight: 1.4, color: c.text }}>
        {data.title}
      </h3>

      {data.items.length > 0 && (
        <>
          <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 12, color: c.textMuted }}>
            You should say:
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {data.items.map((item, i) => (
              <li key={i} style={{ paddingLeft: 22, position: 'relative', fontSize: 14, color: c.text, lineHeight: 1.5 }}>
                <span style={{ position: 'absolute', left: 2, color: '#7c5cff', fontWeight: 900 }}>—</span>
                {item}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function Ring({ secs, total, color, size = 112 }) {
  const r = size / 2 - 9
  const circ = 2 * Math.PI * r
  const pct = 1 - secs / total
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`${color}22`} strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={8}
          strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dasharray 1s linear' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.195, fontWeight: 900, color: '#f1f5f9', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {`${mm}:${ss}`}
        </span>
        <span style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>min</span>
      </div>
    </div>
  )
}

function Notes({ dayKey, c, isDark, readonly }) {
  const key = `challenge_notes_day_${dayKey}`
  const [text, setText] = useState(() => localStorage.getItem(key) || '')
  useEffect(() => { setText(localStorage.getItem(key) || '') }, [key])

  const onChange = (e) => {
    if (readonly) return
    setText(e.target.value)
    localStorage.setItem(key, e.target.value)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: readonly ? '#f97316' : c.textFaint }}>
          {readonly ? 'Notes — qulflandi' : 'Notes'}
        </span>
        <span style={{ fontSize: 10, color: c.textFaint }}>
          {readonly ? '🔒 faqat o\'qish' : `${text.length} chars · saqlandi`}
        </span>
      </div>
      <textarea
        value={text}
        onChange={onChange}
        readOnly={readonly}
        placeholder={readonly ? '' : "Yozuvlaringiz...\n\n— Muhim so'zlar\n— Ideyalar\n— Eslatmalar"}
        style={{
          flex: 1, minHeight: 240,
          background: readonly
            ? (isDark ? 'rgba(249,115,22,0.04)' : 'rgba(249,115,22,0.03)')
            : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'),
          border: `1px solid ${readonly ? 'rgba(249,115,22,0.2)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
          borderRadius: 12, padding: '14px 16px',
          color: readonly ? c.textMuted : c.text,
          fontSize: 13, lineHeight: 1.75,
          resize: 'vertical', fontFamily: "'Inter',system-ui,sans-serif",
          outline: 'none', cursor: readonly ? 'default' : 'text',
          transition: 'border-color 0.2s, background 0.3s',
        }}
        onFocus={e => { if (!readonly) e.target.style.borderColor = 'rgba(124,58,237,0.4)' }}
        onBlur={e => { if (!readonly) e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
      />
      {readonly && (
        <p style={{ margin: 0, fontSize: 11, color: '#f97316', opacity: 0.75 }}>
          Tayyorlanish tugadi — notlar qulflandi. Speaking boshlang!
        </p>
      )}
    </div>
  )
}

function StartScreen({ topics, topicsLoading, onStart, c }) {
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🎯</div>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: c.text, margin: '0 0 10px', lineHeight: 1.15 }}>
        30-Day Speaking<br />
        <span style={{ background: 'linear-gradient(135deg,#a78bfa,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Challenge
        </span>
      </h1>
      <p style={{ fontSize: 13, color: c.textMuted, margin: '0 0 28px', lineHeight: 1.65 }}>
        Practice speaking every day for 30 days using real IELTS topics.
        Every 5th day is a surprise review session!
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: 24 }}>
        {[
          { emoji: '📋', title: `${topics.length} Topics`, sub: 'Real IELTS dossiers' },
          { emoji: '🔄', title: 'Review Days', sub: 'Every 5th day' },
          { emoji: '⏱️', title: '1 + 2 min', sub: 'Prep + speaking' },
        ].map((f, i) => (
          <div key={i} style={{ background: c.cardBg, border: `1px solid ${c.cardBdr}`, borderRadius: 12, padding: '14px 10px' }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{f.emoji}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: c.text, marginBottom: 2 }}>{f.title}</div>
            <div style={{ fontSize: 11, color: c.textFaint, lineHeight: 1.4 }}>{f.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 24, padding: '14px 18px', background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.18)', borderRadius: 12 }}>
        {MILESTONES.map((m, i) => (
          <div key={m.day} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <span style={{ fontSize: 16 }}>{m.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: m.color, minWidth: 54 }}>Day {m.day}</span>
            <span style={{ fontSize: 12, color: c.textMuted }}>{m.label}</span>
          </div>
        ))}
      </div>
      {topicsLoading ? (
        <div style={{ padding: 16, color: c.textMuted, fontSize: 13 }}>Loading topics…</div>
      ) : topics.length === 0 ? (
        <div style={{ padding: 16, color: '#ef4444', fontSize: 13, background: 'rgba(239,68,68,0.08)', borderRadius: 10 }}>
          Speaking topics not added yet. Add in admin panel first.
        </div>
      ) : (
        <button onClick={onStart} style={{
          width: '100%', padding: '15px', borderRadius: 14,
          background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
          border: 'none', color: '#fff', fontSize: 15, fontWeight: 900,
          cursor: 'pointer', boxShadow: '0 8px 24px rgba(124,58,237,0.3)',
        }}>
          Start 30-Day Challenge →
        </button>
      )}
    </div>
  )
}

export default function Challenge() {
  const { theme, token } = useAuthStore()
  const isDark = theme === 'dark'
  const ch = useChallenge()
  const [showQuestions, setShowQuestions] = useState(true)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h, { passive: true })
    return () => window.removeEventListener('resize', h)
  }, [])

  // phase: 'idle' | 'prep' | 'countdown' | 'speak' | 'speakDone'
  const [phase, setPhase] = useState('idle')
  const [prepSecs, setPrepSecs] = useState(60)
  const [speakSecs, setSpeakSecs] = useState(120)
  const [cntSecs, setCntSecs] = useState(5)
  const [prepRunning, setPrepRunning] = useState(false)
  const [speakRunning, setSpeakRunning] = useState(false)

  // Recording state
  const [audioUrl, setAudioUrl]       = useState(null)
  const [transcript, setTranscript]   = useState('')
  const [liveText, setLiveText]       = useState('')
  const [micError, setMicError]       = useState('')
  const mediaRecRef  = useRef(null)
  const chunksRef    = useRef([])
  const recogRef     = useRef(null)
  const finalRef     = useRef('')

  const notesVisible = phase !== 'idle'
  const notesReadonly = phase === 'countdown' || phase === 'speak' || phase === 'speakDone'

  const c = isDark ? {
    pageBg: '#0a0a0f', cardBg: '#111115', cardBdr: 'rgba(255,255,255,0.05)',
    text: '#fafafa', textSub: '#e4e4e7', textMuted: '#6b7280', textFaint: '#52525b',
    divider: 'rgba(255,255,255,0.07)', headerBg: 'rgba(10,10,15,0.95)',
  } : {
    pageBg: '#f1f5f9', cardBg: '#ffffff', cardBdr: 'rgba(0,0,0,0.07)',
    text: '#0f172a', textSub: '#1e293b', textMuted: '#64748b', textFaint: '#94a3b8',
    divider: 'rgba(0,0,0,0.08)', headerBg: 'rgba(248,250,252,0.95)',
  }

  const { data: topics = [], isLoading: topicsLoading } = useQuery({
    queryKey: ['topics'],
    queryFn: () => api.getTopics().then(r => {
      const getNum = s => parseInt((s || '').match(/\d+/)?.[0] ?? '9999', 10)
      return [...r.data].sort((a, b) => getNum(a.name) - getNum(b.name))
    }),
  })

  // Reset all timer + recording state when day changes
  useEffect(() => {
    setPhase('idle')
    setPrepSecs(60); setSpeakSecs(120); setCntSecs(5)
    setPrepRunning(false); setSpeakRunning(false)
    setShowQuestions(true)
    setAudioUrl(null); setTranscript(''); setLiveText(''); setMicError('')
    finalRef.current = ''
    stopRecording()
  }, [ch.currentDay])

  // Prep interval
  useEffect(() => {
    if (!prepRunning) return
    const id = setInterval(() => setPrepSecs(s => {
      if (s <= 1) { setPrepRunning(false); setPhase('countdown'); return 0 }
      return s - 1
    }), 1000)
    return () => clearInterval(id)
  }, [prepRunning])

  // 5-second countdown (fires when phase becomes 'countdown')
  useEffect(() => {
    if (phase !== 'countdown') return
    setCntSecs(5)
    const id = setInterval(() => setCntSecs(s => {
      if (s <= 1) { setPhase('speak'); return 0 }
      return s - 1
    }), 1000)
    return () => clearInterval(id)
  }, [phase])

  // Auto-start speak when phase becomes 'speak'
  useEffect(() => {
    if (phase === 'speak') { setSpeakRunning(true); startRecording() }
    if (phase === 'speakDone') stopRecording()
  }, [phase])

  const startRecording = async () => {
    setAudioUrl(null); setTranscript(''); setLiveText(''); setMicError('')
    finalRef.current = ''
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      mediaRecRef.current = rec
      chunksRef.current = []
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
      }
      rec.start(250)
    } catch (e) {
      setMicError('Mikrofon ruxsati berilmadi. Brauzer sozlamalarida ruxsat bering.')
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const r = new SR()
    r.lang = 'en-US'
    r.continuous = true
    r.interimResults = true
    r.onresult = ev => {
      let interim = ''
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) finalRef.current += ev.results[i][0].transcript + ' '
        else interim += ev.results[i][0].transcript
      }
      setLiveText(finalRef.current + interim)
    }
    r.onend = () => { setTranscript(finalRef.current.trim()) }
    r.onerror = () => {}
    r.start()
    recogRef.current = r
  }

  const stopRecording = () => {
    try { mediaRecRef.current?.state !== 'inactive' && mediaRecRef.current.stop() } catch (_) {}
    try { recogRef.current?.stop() } catch (_) {}
    recogRef.current = null
  }

  // Speak interval
  useEffect(() => {
    if (!speakRunning) return
    const id = setInterval(() => setSpeakSecs(s => {
      if (s <= 1) { setSpeakRunning(false); setPhase('speakDone'); return 0 }
      return s - 1
    }), 1000)
    return () => clearInterval(id)
  }, [speakRunning])

  const { currentDay, checkedDays, todayChecked, streak, totalCompleted, schedule } = ch
  const pct = Math.round((totalCompleted / 30) * 100)
  const todayEntry = currentDay && schedule[currentDay - 1]
  const isReviewDay = todayEntry?.isReview
  const accentBdr = isReviewDay ? 'rgba(249,115,22,0.3)' : 'rgba(124,58,237,0.2)'

  const dayStatus = d => {
    if (checkedDays.includes(d)) return 'done'
    if (d === currentDay) return 'today'
    if (currentDay && d < currentDay) return 'missed'
    return 'future'
  }

  // Timer panel content based on phase
  let timerNode
  if (phase === 'idle' || phase === 'prep') {
    timerNode = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ padding: '3px 12px', borderRadius: 999, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', fontSize: 10, fontWeight: 800, color: '#a78bfa', letterSpacing: 0.8 }}>
          PREPARATION — 1:00
        </div>
        <Ring secs={prepSecs} total={60} color="#a78bfa" />
        <div style={{ display: 'flex', gap: 7 }}>
          <button
            onClick={() => {
              if (phase === 'idle') { setPhase('prep'); setPrepRunning(true) }
              else setPrepRunning(r => !r)
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 9,
              background: prepRunning ? 'rgba(239,68,68,0.12)' : 'rgba(167,139,250,0.12)',
              border: `1px solid ${prepRunning ? 'rgba(239,68,68,0.28)' : 'rgba(167,139,250,0.28)'}`,
              color: prepRunning ? '#ef4444' : '#a78bfa', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {prepRunning ? <Pause size={12} /> : <Play size={12} />}
            {phase === 'idle' ? 'Start Prep' : prepRunning ? 'Pause' : 'Resume'}
          </button>
          {phase === 'prep' && (
            <button
              onClick={() => { setPhase('idle'); setPrepSecs(60); setPrepRunning(false) }}
              style={{ padding: '8px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#6b7280', cursor: 'pointer' }}
            >
              <RotateCcw size={11} />
            </button>
          )}
        </div>
        {phase === 'idle' && (
          <p style={{ margin: 0, fontSize: 11, color: c.textFaint, textAlign: 'center', maxWidth: 170, lineHeight: 1.5 }}>
            Prep boshlanganda notes bo'limi ochiladi
          </p>
        )}
      </div>
    )
  } else if (phase === 'countdown') {
    timerNode = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 12px', borderRadius: 999, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.22)', fontSize: 10, fontWeight: 800, color: '#22c55e' }}>
          <CheckCircle2 size={12} /> Prep tugadi!
        </div>
        <div style={{ fontSize: 80, fontWeight: 900, color: '#f1f5f9', lineHeight: 1, fontVariantNumeric: 'tabular-nums', textShadow: '0 0 40px rgba(124,58,237,0.5)' }}>
          {cntSecs}
        </div>
        <p style={{ margin: 0, fontSize: 12, color: '#a78bfa', fontWeight: 600, textAlign: 'center' }}>
          Speech boshlanmoqda...
        </p>
      </div>
    )
  } else if (phase === 'speak' || phase === 'speakDone') {
    timerNode = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{
          padding: '3px 12px', borderRadius: 999,
          background: phase === 'speakDone' ? 'rgba(34,197,94,0.1)' : 'rgba(124,58,237,0.1)',
          border: `1px solid ${phase === 'speakDone' ? 'rgba(34,197,94,0.25)' : 'rgba(124,58,237,0.25)'}`,
          fontSize: 10, fontWeight: 800, letterSpacing: 0.8,
          color: phase === 'speakDone' ? '#22c55e' : '#7c3aed',
        }}>
          {phase === 'speakDone' ? '✓ SPEAKING DONE' : 'SPEAKING — 2:00'}
        </div>
        <Ring secs={speakSecs} total={120} color={phase === 'speakDone' ? '#22c55e' : '#7c3aed'} />
        {phase === 'speak' && (
          <button
            onClick={() => setSpeakRunning(r => !r)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 9,
              background: speakRunning ? 'rgba(239,68,68,0.12)' : 'rgba(124,58,237,0.12)',
              border: `1px solid ${speakRunning ? 'rgba(239,68,68,0.28)' : 'rgba(124,58,237,0.28)'}`,
              color: speakRunning ? '#ef4444' : '#7c3aed', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {speakRunning ? <Pause size={12} /> : <Play size={12} />}
            {speakRunning ? 'Pause' : 'Resume'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: c.pageBg, color: c.text, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`@keyframes recPulse{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>

      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: c.headerBg, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${c.divider}`,
        padding: isMobile ? '12px 16px' : '12px 24px', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <Link to="/tests" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)',
          color: '#a78bfa', textDecoration: 'none',
        }}>
          <ArrowLeft size={17} />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: c.text }}>30-Day Speaking Challenge</div>
          {ch.isStarted && (
            <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>
              Day {currentDay} of 30 · {totalCompleted} completed
            </div>
          )}
        </div>
        {ch.isStarted && streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 999, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.22)' }}>
            <Flame size={13} color="#f97316" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#f97316' }}>{streak}</span>
          </div>
        )}
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 56px' }}>
        {!ch.isStarted ? (
          <StartScreen
            topics={topics} topicsLoading={topicsLoading}
            onStart={() => topics.length && ch.start(buildSchedule(topics))}
            c={c}
          />
        ) : (
          <>
            {/* Progress */}
            <div style={{ marginBottom: 14, background: c.cardBg, border: `1px solid ${c.cardBdr}`, borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: c.textSub }}>Overall Progress</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#7c3aed' }}>{pct}%</span>
              </div>
              <div style={{ height: 6, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#7c3aed,#3b82f6)', borderRadius: 99, transition: 'width 0.6s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: c.textFaint }}>
                <span>{totalCompleted} days done</span>
                <span>{30 - totalCompleted} days left</span>
              </div>
            </div>

            {/* Today's Task */}
            {todayEntry && (
              <div style={{ marginBottom: 14, borderRadius: 16, border: `1px solid ${accentBdr}`, overflow: 'hidden' }}>

                {/* Topic header */}
                <div style={{ background: c.cardBg, padding: '18px 22px 16px', borderBottom: `1px solid ${c.divider}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9, flexWrap: 'wrap' }}>
                    {isReviewDay
                      ? <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: 'rgba(249,115,22,0.14)', color: '#f97316' }}>🔄 Review Day</span>
                      : <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: 'rgba(124,58,237,0.12)', color: '#a78bfa' }}>Speaking Part 2 / 3</span>
                    }
                    <span style={{ fontSize: 11, color: c.textFaint }}>Day {currentDay} of 30</span>
                    {phase === 'speak' && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#ef4444', fontWeight: 700 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'recPulse 1.2s ease-in-out infinite' }} />
                        REC
                      </span>
                    )}
                    {todayChecked && <CheckCircle2 size={15} color="#22c55e" />}
                  </div>
                  <p style={{ fontSize: 20, fontWeight: 900, color: c.text, margin: 0, lineHeight: 1.3 }}>
                    {todayEntry.topicName}
                    {todayEntry.topicNameUz && (
                      <span style={{ fontSize: 14, fontWeight: 500, color: c.textMuted, marginLeft: 8 }}>· {todayEntry.topicNameUz}</span>
                    )}
                  </p>
                </div>

                {/* Cue Card */}
                {todayEntry.topicId && token && (
                  <>
                    <button onClick={() => setShowQuestions(v => !v)} style={{
                      width: '100%', padding: '10px 22px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: isDark ? 'rgba(124,58,237,0.06)' : 'rgba(124,58,237,0.04)',
                      border: 'none', borderBottom: `1px solid ${c.divider}`,
                      color: '#a78bfa', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}>
                      <span>📋 Cue Card</span>
                      {showQuestions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {showQuestions && (
                      <div style={{ padding: '18px 22px', borderBottom: `1px solid ${c.divider}`, background: isDark ? '#0f0f14' : '#f8fafc' }}>
                        <CueCard
                          topicId={todayEntry.topicId}
                          token={token}
                          topicName={todayEntry.topicName}
                          c={c}
                          isDark={isDark}
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Timer (top/left) + Notes (bottom/right) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: notesVisible && !isMobile ? '230px 1fr' : '1fr',
                  background: c.cardBg,
                }}>
                  {/* Left: timer */}
                  <div style={{
                    borderRight: notesVisible && !isMobile ? `1px solid ${c.divider}` : 'none',
                    borderBottom: notesVisible && isMobile ? `1px solid ${c.divider}` : 'none',
                    padding: '28px 20px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 16, minHeight: isMobile ? 240 : 290,
                  }}>
                    {todayChecked ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <CheckCircle2 size={36} color="#22c55e" />
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#22c55e' }}>Done for today!</p>
                        <p style={{ margin: 0, fontSize: 11, color: c.textFaint, textAlign: 'center' }}>Come back tomorrow.</p>
                      </div>
                    ) : (
                      <>
                        {timerNode}
                        {(phase === 'speakDone') && (
                          <button onClick={ch.checkIn} style={{
                            width: '100%', padding: '11px 14px', borderRadius: 10,
                            cursor: 'pointer', fontSize: 12, fontWeight: 800,
                            background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                            border: '1px solid rgba(34,197,94,0.35)', color: '#fff',
                            boxShadow: '0 4px 16px rgba(34,197,94,0.25)', transition: 'all 0.2s',
                          }}>
                            ✓ Mark as Complete
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Right: notes (only when visible) */}
                  {notesVisible && (
                    <div style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column' }}>
                      <Notes dayKey={currentDay} c={c} isDark={isDark} readonly={notesReadonly} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recording Results */}
            {phase === 'speakDone' && (audioUrl || transcript || liveText || micError) && (
              <div style={{ marginBottom: 14, background: c.cardBg, border: `1px solid ${c.cardBdr}`, borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${c.divider}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: c.textSub }}>Speech Results</span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', fontWeight: 700 }}>Done</span>
                </div>

                {micError && (
                  <div style={{ padding: '14px 20px', color: '#f97316', fontSize: 12 }}>⚠️ {micError}</div>
                )}

                {/* Audio player */}
                {audioUrl && (
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${c.divider}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: c.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                      Yozib olingan ovoz
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <audio controls src={audioUrl} style={{ flex: 1, minWidth: 220, height: 38 }} />
                      <a
                        href={audioUrl}
                        download={`speech-day${ch.currentDay}.webm`}
                        style={{
                          padding: '8px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                          background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.22)',
                          color: '#a78bfa', textDecoration: 'none', whiteSpace: 'nowrap',
                        }}
                      >
                        ↓ Yuklab olish
                      </a>
                    </div>
                  </div>
                )}

                {/* Transcript */}
                {(transcript || liveText) && (
                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: c.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                      Transcript
                    </div>
                    <p style={{
                      margin: 0, fontSize: 14, lineHeight: 1.8, color: c.textSub,
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                      border: `1px solid ${c.cardBdr}`, borderRadius: 12,
                      padding: '14px 16px',
                    }}>
                      {transcript || liveText || '...'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 30-Day Map */}
            <div style={{ marginBottom: 14, background: c.cardBg, border: `1px solid ${c.cardBdr}`, borderRadius: 16, padding: '16px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: c.textSub, marginBottom: 12 }}>30-Day Map</div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(6, 1fr)' : 'repeat(10, 1fr)', gap: 6 }}>
                {Array.from({ length: 30 }, (_, i) => i + 1).map(d => {
                  const status = dayStatus(d)
                  const entry = schedule[d - 1]
                  const isRev = entry?.isReview
                  return (
                    <div key={d}
                      title={entry ? `Day ${d}${isRev ? ' — Review' : ''}: ${entry.topicName}` : `Day ${d}`}
                      style={{
                        aspectRatio: '1', borderRadius: 7, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 10, fontWeight: 800, position: 'relative',
                        ...(status === 'done'   && { background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: '#fff' }),
                        ...(status === 'today'  && { background: 'rgba(124,58,237,0.14)', border: '2px solid #7c3aed', color: '#a78bfa' }),
                        ...(status === 'missed' && { background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }),
                        ...(status === 'future' && { background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)', border: `1px solid ${c.cardBdr}`, color: c.textFaint }),
                      }}
                    >
                      {status === 'done' ? '✓' : d}
                      {isRev && status !== 'done' && <span style={{ position: 'absolute', top: -3, right: -3, fontSize: 8 }}>🔄</span>}
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
                {[
                  { color: '#7c3aed', label: 'Completed' },
                  { color: '#a78bfa', label: 'Today', border: true },
                  { color: '#ef4444', label: 'Missed' },
                  { color: c.textFaint, label: 'Upcoming' },
                  { emoji: '🔄', label: 'Review' },
                ].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: c.textFaint }}>
                    {l.emoji
                      ? <span style={{ fontSize: 10 }}>{l.emoji}</span>
                      : <div style={{ width: 9, height: 9, borderRadius: 3, background: l.border ? 'transparent' : l.color, border: l.border ? `2px solid ${l.color}` : 'none' }} />
                    }
                    {l.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones */}
            <div style={{ marginBottom: 20, display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 8 }}>
              {MILESTONES.map(m => {
                const unlocked = totalCompleted >= m.day
                return (
                  <div key={m.day} style={{
                    background: unlocked ? m.bg : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${unlocked ? m.color + '40' : c.cardBdr}`,
                    borderRadius: 12, padding: '12px 8px', textAlign: 'center',
                    opacity: unlocked ? 1 : 0.4,
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 4, filter: unlocked ? 'none' : 'grayscale(1)' }}>{m.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: unlocked ? m.color : c.textFaint }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: c.textFaint, marginTop: 2 }}>Day {m.day}</div>
                  </div>
                )
              })}
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => { if (confirm("Challengeni qaytadan boshlaysizmi? Barcha progress o'chadi.")) ch.reset() }}
                style={{ background: 'transparent', border: 'none', color: c.textFaint, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Reset Challenge
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
