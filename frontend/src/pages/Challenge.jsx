import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Flame, CheckCircle2, Play, Pause, RotateCcw, RefreshCw } from 'lucide-react'
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

const REGULAR_TIPS = [
  'Describe it in detail — what, where, when, who',
  'Use rich adjectives and varied vocabulary',
  'Share your personal feelings or opinions',
  'Aim for 2 full minutes without stopping',
]

const REVIEW_TIPS = [
  'You have studied this topic before — speak from memory',
  'Try to use new words or phrases this time',
  'Speak more fluently than the first time',
  'Challenge yourself to go the full 2 minutes!',
]

/* ─── Timer ─────────────────────────────────────────────────────── */
function Timer({ onDone, dayKey }) {
  const [secs, setSecs]       = useState(120)
  const [running, setRunning] = useState(false)
  const [done, setDone]       = useState(false)
  const iv = useRef(null)

  // reset when day changes
  useEffect(() => { clearInterval(iv.current); setSecs(120); setRunning(false); setDone(false) }, [dayKey])

  useEffect(() => {
    if (running && secs > 0) {
      iv.current = setInterval(() => setSecs(s => s - 1), 1000)
    } else if (running && secs === 0) {
      clearInterval(iv.current)
      setRunning(false)
      setDone(true)
      onDone?.()
    }
    return () => clearInterval(iv.current)
  }, [running, secs])

  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  const pct = ((120 - secs) / 120) * 100
  const R = 46, circ = 2 * Math.PI * R

  const reset = () => { clearInterval(iv.current); setSecs(120); setRunning(false); setDone(false) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ position: 'relative', width: 110, height: 110 }}>
        <svg width={110} height={110} viewBox="0 0 110 110">
          <circle cx={55} cy={55} r={R} fill="none" stroke="rgba(124,58,237,0.1)" strokeWidth={7} />
          <circle cx={55} cy={55} r={R} fill="none"
            stroke={done ? '#22c55e' : '#7c3aed'} strokeWidth={7}
            strokeDasharray={`${circ * pct / 100} ${circ * (1 - pct / 100)}`}
            strokeLinecap="round" transform="rotate(-90 55 55)"
            style={{ transition: 'stroke-dasharray 1s linear, stroke 0.3s' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: done ? '#22c55e' : '#fafafa', fontVariantNumeric: 'tabular-nums' }}>
            {done ? '✓' : `${mm}:${ss}`}
          </span>
          <span style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>{done ? 'Done!' : 'mins'}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => { if (!done) setRunning(r => !r) }} disabled={done} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10,
          background: running ? 'rgba(239,68,68,0.15)' : 'rgba(124,58,237,0.18)',
          border: `1px solid ${running ? 'rgba(239,68,68,0.3)' : 'rgba(124,58,237,0.35)'}`,
          color: running ? '#ef4444' : '#a78bfa', fontSize: 13, fontWeight: 700,
          cursor: done ? 'not-allowed' : 'pointer', opacity: done ? 0.5 : 1,
        }}>
          {running ? <Pause size={14} /> : <Play size={14} />}
          {running ? 'Pause' : 'Start'}
        </button>
        <button onClick={reset} style={{
          padding: '9px 12px', borderRadius: 10,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#6b7280', cursor: 'pointer',
        }}>
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  )
}

/* ─── Start Screen ───────────────────────────────────────────────── */
function StartScreen({ topics, topicsLoading, onStart, c }) {
  const ready = !topicsLoading && topics.length > 0

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎯</div>
      <h1 style={{ fontSize: 30, fontWeight: 900, color: c.text, margin: '0 0 10px', lineHeight: 1.1 }}>
        30-Day Speaking<br />
        <span style={{ background: 'linear-gradient(135deg,#a78bfa,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Challenge
        </span>
      </h1>
      <p style={{ fontSize: 13, color: c.textMuted, margin: '0 0 28px', lineHeight: 1.65 }}>
        Practice speaking every day for 30 days using real IELTS speaking topics. Every 5th day is a surprise review!
      </p>

      {/* Feature grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
        {[
          { emoji: '🗣️', title: `${topics.length} Topics`, sub: 'Real speaking dossiers' },
          { emoji: '🔄', title: 'Review Days', sub: 'Every 5th day surprise' },
          { emoji: '⏱️', title: '2 Min/Day', sub: 'Timed speaking practice' },
        ].map((f, i) => (
          <div key={i} style={{ background: c.cardBg, border: `1px solid ${c.cardBdr}`, borderRadius: 12, padding: '14px 10px' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{f.emoji}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: c.text, marginBottom: 2 }}>{f.title}</div>
            <div style={{ fontSize: 11, color: c.textFaint, lineHeight: 1.4 }}>{f.sub}</div>
          </div>
        ))}
      </div>

      {/* Milestones */}
      <div style={{ marginBottom: 24, padding: '14px 18px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12 }}>
        {MILESTONES.map((m, i) => (
          <div key={m.day} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <span style={{ fontSize: 17 }}>{m.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: m.color, minWidth: 54 }}>Day {m.day}</span>
            <span style={{ fontSize: 12, color: c.textMuted }}>{m.label} milestone</span>
          </div>
        ))}
      </div>

      {topicsLoading ? (
        <div style={{ padding: 16, color: c.textMuted, fontSize: 13 }}>Loading topics…</div>
      ) : topics.length === 0 ? (
        <div style={{ padding: 16, color: '#ef4444', fontSize: 13, background: 'rgba(239,68,68,0.08)', borderRadius: 10 }}>
          Speaking topics are not added yet. Add topics in the admin panel first.
        </div>
      ) : (
        <button onClick={onStart} style={{
          width: '100%', padding: '15px', borderRadius: 14,
          background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
          border: 'none', color: '#fff', fontSize: 15, fontWeight: 900,
          cursor: 'pointer', boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
        }}>
          Start 30-Day Challenge →
        </button>
      )}
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function Challenge() {
  const { theme } = useAuthStore()
  const isDark = theme === 'dark'
  const ch = useChallenge()
  const [timerDone, setTimerDone] = useState(false)

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

  const handleStart = () => {
    if (!topics.length) return
    ch.start(buildSchedule(topics))
  }

  // Reset timerDone when day changes
  useEffect(() => { setTimerDone(false) }, [ch.currentDay])

  const { currentDay, checkedDays, todayChecked, streak, totalCompleted, schedule } = ch
  const pct = Math.round((totalCompleted / 30) * 100)

  const todayEntry = currentDay && schedule[currentDay - 1]

  const dayStatus = (d) => {
    if (checkedDays.includes(d)) return 'done'
    if (d === currentDay) return 'today'
    if (currentDay && d < currentDay) return 'missed'
    return 'future'
  }

  const isReviewDay = todayEntry?.isReview

  return (
    <div style={{ minHeight: '100vh', background: c.pageBg, color: c.text, fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: c.headerBg, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${c.divider}`,
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 999, background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}>
            <Flame size={14} color="#f97316" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#f97316' }}>{streak}</span>
          </div>
        )}
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 48px' }}>

        {!ch.isStarted ? (
          <StartScreen topics={topics} topicsLoading={topicsLoading} onStart={handleStart} c={c} isDark={isDark} />
        ) : (
          <>
            {/* Progress bar */}
            <div style={{ marginBottom: 16, background: c.cardBg, border: `1px solid ${c.cardBdr}`, borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: c.textSub }}>Overall Progress</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#7c3aed' }}>{pct}%</span>
              </div>
              <div style={{ height: 7, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#7c3aed,#3b82f6)', borderRadius: 99, transition: 'width 0.6s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, fontSize: 11, color: c.textFaint }}>
                <span>{totalCompleted} days done</span>
                <span>{30 - totalCompleted} days left</span>
              </div>
            </div>

            {/* Today's Task */}
            {todayEntry && (
              <div style={{ marginBottom: 16, background: c.cardBg, border: `1px solid ${isReviewDay ? 'rgba(249,115,22,0.3)' : c.cardBdr}`, borderRadius: 16, overflow: 'hidden' }}>

                {/* Task header */}
                <div style={{ padding: '18px 22px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    {isReviewDay ? (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
                        🔄 Review Day
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: 'rgba(124,58,237,0.12)', color: '#a78bfa' }}>
                        Speaking Part 2 / 3
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: c.textFaint }}>Day {currentDay} of 30</span>
                    {todayChecked && <CheckCircle2 size={16} color="#22c55e" />}
                  </div>

                  {isReviewDay ? (
                    <>
                      <p style={{ fontSize: 13, color: '#f97316', fontWeight: 700, margin: '0 0 6px' }}>
                        Surprise! Speak about this topic again — from memory this time.
                      </p>
                      <p style={{ fontSize: 19, fontWeight: 900, color: c.text, margin: 0, lineHeight: 1.3 }}>
                        {todayEntry.topicName}
                        {todayEntry.topicNameUz && (
                          <span style={{ fontSize: 14, fontWeight: 500, color: c.textMuted, marginLeft: 8 }}>· {todayEntry.topicNameUz}</span>
                        )}
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: 13, color: c.textMuted, margin: '0 0 6px' }}>
                        Describe and discuss this IELTS speaking topic for 2 minutes.
                      </p>
                      <p style={{ fontSize: 19, fontWeight: 900, color: c.text, margin: 0, lineHeight: 1.3 }}>
                        {todayEntry.topicName}
                        {todayEntry.topicNameUz && (
                          <span style={{ fontSize: 14, fontWeight: 500, color: c.textMuted, marginLeft: 8 }}>· {todayEntry.topicNameUz}</span>
                        )}
                      </p>
                    </>
                  )}
                </div>

                {/* Tips */}
                <div style={{ padding: '0 22px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.textFaint, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    {isReviewDay ? 'Review tips' : 'Speaking tips'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                    {(isReviewDay ? REVIEW_TIPS : REGULAR_TIPS).map((tip, i) => (
                      <div key={i} style={{ display: 'flex', gap: 6, fontSize: 12, color: c.textMuted }}>
                        <span style={{ color: isReviewDay ? '#f97316' : '#7c3aed', fontWeight: 900, flexShrink: 0 }}>·</span>
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timer + CTA */}
                <div style={{ borderTop: `1px solid ${c.divider}`, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                  <Timer dayKey={currentDay} onDone={() => setTimerDone(true)} />
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
                      {todayChecked
                        ? "Today's task is complete! Come back tomorrow for the next one."
                        : timerDone
                          ? 'Great job! Now mark today as complete to keep your streak.'
                          : 'Start the 2-minute timer, speak aloud, then mark as complete.'}
                    </div>
                    {todayChecked ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 15px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e', fontSize: 13, fontWeight: 700 }}>
                        <CheckCircle2 size={15} /> Done for today!
                      </div>
                    ) : (
                      <button onClick={ch.checkIn} style={{
                        padding: '11px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 800,
                        background: timerDone ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'rgba(124,58,237,0.15)',
                        border: `1px solid ${timerDone ? 'rgba(34,197,94,0.4)' : 'rgba(124,58,237,0.3)'}`,
                        color: timerDone ? '#fff' : '#a78bfa',
                        boxShadow: timerDone ? '0 4px 14px rgba(34,197,94,0.3)' : 'none',
                        transition: 'all 0.2s',
                      }}>
                        {timerDone ? '✓ Mark as Complete' : 'Mark as Done'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 30-Day Grid */}
            <div style={{ marginBottom: 16, background: c.cardBg, border: `1px solid ${c.cardBdr}`, borderRadius: 16, padding: '16px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: c.textSub, marginBottom: 12 }}>30-Day Map</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
                {Array.from({ length: 30 }, (_, i) => i + 1).map(d => {
                  const status = dayStatus(d)
                  const entry = schedule[d - 1]
                  const isRev = entry?.isReview
                  return (
                    <div key={d}
                      title={entry ? `Day ${d}${isRev ? ' 🔄 Review' : ''}: ${entry.topicName}` : `Day ${d}`}
                      style={{
                        aspectRatio: '1', borderRadius: 7, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 10, fontWeight: 800, cursor: 'default',
                        position: 'relative',
                        ...(status === 'done'   && { background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: '#fff' }),
                        ...(status === 'today'  && { background: 'rgba(124,58,237,0.15)', border: '2px solid #7c3aed', color: '#a78bfa' }),
                        ...(status === 'missed' && { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }),
                        ...(status === 'future' && { background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)', border: `1px solid ${c.cardBdr}`, color: c.textFaint }),
                      }}>
                      {status === 'done' ? '✓' : d}
                      {/* Review day indicator */}
                      {isRev && status !== 'done' && (
                        <span style={{ position: 'absolute', top: -3, right: -3, fontSize: 8, lineHeight: 1 }}>🔄</span>
                      )}
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
                  { label: '🔄 Review day', emoji: true },
                ].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: c.textFaint }}>
                    {l.emoji
                      ? <span style={{ fontSize: 10 }}>🔄</span>
                      : <div style={{ width: 9, height: 9, borderRadius: 3, background: l.border ? 'transparent' : l.color, border: l.border ? `2px solid ${l.color}` : 'none' }} />
                    }
                    {l.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones */}
            <div style={{ marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {MILESTONES.map(m => {
                const unlocked = totalCompleted >= m.day
                return (
                  <div key={m.day} style={{
                    background: unlocked ? m.bg : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${unlocked ? m.color + '40' : c.cardBdr}`,
                    borderRadius: 12, padding: '12px 8px', textAlign: 'center',
                    opacity: unlocked ? 1 : 0.45,
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 4, filter: unlocked ? 'none' : 'grayscale(1)' }}>{m.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: unlocked ? m.color : c.textFaint }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: c.textFaint, marginTop: 2 }}>Day {m.day}</div>
                  </div>
                )
              })}
            </div>

            {/* Reset */}
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => { if (confirm('Challengeni qaytadan boshlaysizmi? Barcha progress o\'chadi.')) ch.reset() }} style={{
                background: 'transparent', border: 'none', color: c.textFaint,
                fontSize: 12, cursor: 'pointer', textDecoration: 'underline',
              }}>
                Reset Challenge
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
