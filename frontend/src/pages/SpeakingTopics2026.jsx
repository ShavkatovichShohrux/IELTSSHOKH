import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Crown, FileText, ChevronRight, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { api, API_ORIGIN } from '../api/client'
import { useAuthStore } from '../store/authStore'

const isNative = Capacitor?.isNativePlatform?.() === true

function PlanGate() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '96px 16px', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Lock size={32} color="#a78bfa" />
      </div>
      <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 900, color: '#fafafa' }}>Elite tarif kerak</h2>
      <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280', maxWidth: 280 }}>
        September &amp; December 2026 exam topiclariga kirish uchun <strong style={{ color: '#a78bfa' }}>Elite</strong> tarifga ega bo'lishingiz kerak.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
        <Crown size={15} color="#a78bfa" />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>Elite</span>
      </div>
      <p style={{ marginTop: 16, fontSize: 12, color: '#3f3f46' }}>Admin bilan bog'laning yoki platformadan tarif sotib oling.</p>
    </div>
  )
}

export default function SpeakingTopics2026() {
  const { token, user } = useAuthStore()
  const navigate = useNavigate()
  const [topicUrl, setTopicUrl] = useState(null)
  const [topicLoading, setTopicLoading] = useState(false)

  const isElite = user?.role === 'admin' || user?.plan === 'elite'

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ['exam-topics'],
    queryFn: () => api.getExamTopics().then(r => r.data),
    enabled: isElite,
  })

  const openTopic = async (id) => {
    const url = `${API_ORIGIN}/api/exam-topics/${id}/content?t=${token}`
    if (isNative) {
      history.pushState({ topicOverlay: true }, '', location.href)
      setTopicLoading(true)
      try {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error(res.status)
        const html = await res.text()
        const blob = new Blob([html], { type: 'text/html' })
        setTopicUrl(URL.createObjectURL(blob))
      } catch {
        setTopicUrl(null)
      } finally {
        setTopicLoading(false)
      }
    } else {
      window.open(url, '_blank', 'noopener')
    }
  }

  const closeOverlay = () => {
    if (topicUrl) URL.revokeObjectURL(topicUrl)
    setTopicUrl(null)
    history.back()
  }

  const BG    = '#0a0a0f'
  const CARD  = '#111115'
  const BDR   = 'rgba(255,255,255,0.06)'
  const PURP  = '#7c3aed'
  const PURPL = '#a78bfa'
  const TEXT  = '#fafafa'
  const MUTED = '#6b7280'

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter',system-ui,sans-serif", color: TEXT }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${BDR}`, padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => navigate('/tests')} style={{
          padding: 8, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,0.05)', color: TEXT,
          display: 'flex', alignItems: 'center',
        }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <Crown size={14} color={PURPL} />
            <span style={{ fontSize: 10, fontWeight: 700, color: PURPL, letterSpacing: 2, textTransform: 'uppercase' }}>Elite</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: TEXT, letterSpacing: -0.3 }}>
            Part 2/3 · Sep &amp; Dec 2026
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
        {!isElite ? (
          <PlanGate />
        ) : isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ width: 32, height: 32, border: `2px solid ${PURP}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : topics.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(124,58,237,0.15)', border: `1px solid rgba(124,58,237,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FileText size={26} color={PURPL} />
            </div>
            <p style={{ color: MUTED, fontWeight: 600, margin: '0 0 4px' }}>Topiclar tez orada qo'shiladi</p>
            <p style={{ color: '#3f3f46', fontSize: 12, margin: 0 }}>Admin yangi materiallar yuklashini kuting</p>
          </div>
        ) : (
          <>
            {/* Info banner */}
            <div style={{
              marginBottom: 20, padding: '14px 16px', borderRadius: 16,
              background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)',
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <Crown size={18} color={PURPL} style={{ marginTop: 1, flexShrink: 0 }} />
              <div>
                <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 800, color: PURPL }}>September &amp; December 2026</p>
                <p style={{ margin: 0, fontSize: 12, color: '#8b5cf6' }}>
                  Real exam topiklari. Har bir mavzuni o'qib, o'zingizning javobingizni tayyorlang.
                </p>
              </div>
            </div>

            {/* Topic list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topics.map((topic, i) => (
                <button
                  key={topic.id}
                  onClick={() => topic.html_file ? openTopic(topic.id) : null}
                  disabled={!topic.html_file}
                  style={{
                    width: '100%', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 16,
                    background: CARD, border: `1px solid ${BDR}`,
                    cursor: topic.html_file ? 'pointer' : 'not-allowed',
                    opacity: topic.html_file ? 1 : 0.5,
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    outline: 'none',
                  }}
                  onMouseEnter={e => { if (topic.html_file) { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.12)' }}}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BDR; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: PURPL }}>{i + 1}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14, color: TEXT }}>{topic.title}</p>
                    {topic.description && (
                      <p style={{ margin: 0, fontSize: 12, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic.description}</p>
                    )}
                    {!topic.html_file && (
                      <p style={{ margin: 0, fontSize: 11, color: '#f59e0b' }}>Tez orada</p>
                    )}
                  </div>
                  {topic.html_file && <ChevronRight size={18} color={MUTED} style={{ flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Native overlay */}
      {topicUrl && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
            <button onClick={closeOverlay} className="flex items-center gap-2 text-white/70 hover:text-white">
              <ArrowLeft size={18} /> <span className="text-sm">Orqaga</span>
            </button>
          </div>
          <iframe src={topicUrl} className="flex-1 w-full border-0" title="Exam Topic" />
        </div>
      )}

      {topicLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-10 h-10 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
