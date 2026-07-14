import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Lock, ArrowLeft, HelpCircle, Crown, Zap } from 'lucide-react'
import { api, API_ORIGIN } from '../api/client'
import { useAuthStore } from '../store/authStore'

function PlanGate() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-5">
        <Lock size={32} className="text-violet-500" />
      </div>
      <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">Bu bo'lim yopiq</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-5">
        Question Types bo'limiga kirish uchun <strong>Basic</strong> yoki <strong>Elite</strong> tarifga ega bo'lishingiz kerak.
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <Zap size={15} className="text-blue-500" />
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Basic</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <Crown size={15} className="text-purple-500" />
          <span className="text-sm font-bold text-purple-600 dark:text-purple-400">Elite</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-4">Admin bilan bog'laning yoki platformadan tarif sotib oling.</p>
    </div>
  )
}

export default function SpeakingQuestionTypes() {
  const { token, user } = useAuthStore()
  const navigate = useNavigate()
  const hasAccess = user?.plan === 'basic' || user?.plan === 'elite' || user?.role === 'admin'

  const getNum = s => parseInt((s || '').match(/\d+/)?.[0] ?? '9999', 10)

  const { data: raw = [], isLoading } = useQuery({
    queryKey: ['question-types'],
    queryFn: () => api.getQuestionTypes().then(r => r.data),
  })
  const topics = [...raw].sort((a, b) => getNum(a.name) - getNum(b.name))

  // PDF fayllar saytning ichida (yuklab olib bo'lmaydigan tarzda) ochiladi.
  // HTML dossierlar esa alohida oynada (o'z watermark/himoyasi bilan, popup-blockersiz) ochiladi.
  const isPdf = topic => (topic.html_file || '').toLowerCase().endsWith('.pdf')

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/tests" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-violet-500">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <HelpCircle size={22} className="text-violet-500" /> Speaking{' '}
            <span className="text-violet-500">Question Types</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Savol turlari va tahlil</p>
        </div>
      </div>

      {!hasAccess ? <PlanGate /> : isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : topics.length === 0 ? (
        <div className="text-center py-24 text-gray-400 dark:text-gray-600">
          <HelpCircle size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Hali question types qo'shilmagan</p>
          <p className="text-sm mt-1">Tez kunda qo'shiladi</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map(topic => {
            const cardContent = (
              <>
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                    <HelpCircle size={11} /> Question Type
                  </span>
                  {topic.html_file
                    ? <ChevronRight size={18} className="text-gray-400 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
                    : <Lock size={16} className="text-gray-400" />
                  }
                </div>
                <h3 className={`font-bold mb-1 transition-colors ${
                  topic.html_file
                    ? 'text-gray-900 dark:text-gray-100 group-hover:text-violet-500'
                    : 'text-gray-500 dark:text-gray-500'
                }`}>
                  {topic.name}
                  {topic.name_uz && <span className="font-normal text-sm text-gray-400 ml-1">· {topic.name_uz}</span>}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">Speaking · Band 6/7/8/9</span>
                </div>
                {!topic.html_file && (
                  <p className="text-xs text-orange-500 mt-2 font-medium">Tez kunda qo'shiladi</p>
                )}
              </>
            )

            if (!topic.html_file) {
              return (
                <div key={topic.id} className="card p-5 opacity-60 cursor-not-allowed group">
                  {cardContent}
                </div>
              )
            }

            if (isPdf(topic)) {
              return (
                <div
                  key={topic.id}
                  onClick={() => navigate(`/tests/question-types/${topic.id}`)}
                  className="card p-5 transition-all group hover:shadow-md hover:border-violet-500/30 cursor-pointer"
                >
                  {cardContent}
                </div>
              )
            }

            return (
              <a
                key={topic.id}
                href={`${API_ORIGIN}/api/question-types/${topic.id}/content?t=${token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="card p-5 transition-all group hover:shadow-md hover:border-violet-500/30 block"
              >
                {cardContent}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
