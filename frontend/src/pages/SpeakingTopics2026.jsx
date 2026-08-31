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
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-5">
        <Lock size={32} className="text-purple-500" />
      </div>
      <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">Elite tarif kerak</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-5">
        September & December 2026 exam topiclariga kirish uchun <strong className="text-purple-600 dark:text-purple-400">Elite</strong> tarifga ega bo'lishingiz kerak.
      </p>
      <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
        <Crown size={15} className="text-purple-500" />
        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">Elite</span>
      </div>
      <p className="text-xs text-gray-400 mt-4">Admin bilan bog'laning yoki platformadan tarif sotib oling.</p>
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/tests')} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-purple-500 flex-shrink-0" />
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Elite</span>
          </div>
          <h1 className="text-base font-black text-gray-900 dark:text-gray-100 leading-tight truncate">
            Part 2/3 · Sep & Dec 2026
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {!isElite ? (
          <PlanGate />
        ) : isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
              <FileText size={26} className="text-purple-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Topiclar tez orada qo'shiladi</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Admin yangi materiallar yuklashini kuting</p>
          </div>
        ) : (
          <>
            {/* Info banner */}
            <div className="mb-5 p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 flex items-start gap-3">
              <Crown size={18} className="text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-purple-800 dark:text-purple-200">September & December 2026</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                  Real exam topiklari. Har bir mavzuni o'qib, o'zingizning javobingizni tayyorlang.
                </p>
              </div>
            </div>

            {/* Topic list */}
            <div className="flex flex-col gap-3">
              {topics.map((topic, i) => (
                <button
                  key={topic.id}
                  onClick={() => topic.html_file ? openTopic(topic.id) : null}
                  disabled={!topic.html_file}
                  className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border transition-all
                    ${topic.html_file
                      ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md active:scale-[0.99]'
                      : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800/50 opacity-60 cursor-not-allowed'
                    }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-black text-purple-600 dark:text-purple-400">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-snug">{topic.title}</p>
                    {topic.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{topic.description}</p>
                    )}
                    {!topic.html_file && (
                      <p className="text-xs text-amber-500 mt-0.5">Tez orada</p>
                    )}
                  </div>
                  {topic.html_file && (
                    <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                  )}
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
