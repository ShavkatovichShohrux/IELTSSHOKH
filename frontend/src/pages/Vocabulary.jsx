import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowLeft, BookOpen, FileText, Lock, ChevronRight, Crown, Zap } from 'lucide-react'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'

function PlanGate() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-5">
        <Lock size={32} className="text-emerald-500" />
      </div>
      <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">Bu bo'lim yopiq</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-5">
        Vocabulary bo'limiga kirish uchun <strong>Basic</strong> yoki <strong>Elite</strong> tarifga ega bo'lishingiz kerak.
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

export default function Vocabulary() {
  const { user } = useAuthStore()
  const hasAccess = user?.plan === 'basic' || user?.plan === 'elite' || user?.role === 'admin'

  const { data: raw = [], isLoading } = useQuery({
    queryKey: ['vocabTopics'],
    queryFn: () => api.getVocabTopics().then(r => r.data),
  })

  const items = [...raw].sort((a, b) => {
    const num = s => { const m = s.name.match(/\d+/); return m ? parseInt(m[0]) : Infinity }
    return num(a) - num(b)
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/tests"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-brand">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-emerald-500" />
            <span className="font-black text-gray-900 dark:text-gray-100">
              Topic Based <span className="text-emerald-500">Vocabulary</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {!hasAccess ? <PlanGate /> : isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5">
              <BookOpen size={40} className="text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">
              Hali vocabulary qo'shilmagan
            </p>
            <p className="text-sm text-gray-400">Tez kunda qo'shiladi</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => {
              const content = (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                      ${item.pdf_file ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-gray-100 dark:bg-gray-800'}
                      transition-colors`}>
                      <FileText size={20} className={item.pdf_file ? 'text-emerald-500' : 'text-gray-400'} />
                    </div>
                    {item.pdf_file
                      ? <ChevronRight size={18} className="text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all mt-1" />
                      : <Lock size={16} className="text-gray-400 mt-1" />
                    }
                  </div>
                  <h3 className={`font-bold text-base mb-0.5 transition-colors ${
                    item.pdf_file
                      ? 'text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                      : 'text-gray-500 dark:text-gray-500'
                  }`}>
                    {item.name}
                  </h3>
                  {item.name_uz && <p className="text-sm text-gray-400 mb-2">{item.name_uz}</p>}
                  {item.pdf_file
                    ? <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">Ko'rish uchun bosing</p>
                    : <p className="text-xs text-orange-500 font-medium mt-2">Tez kunda qo'shiladi</p>
                  }
                </>
              )

              return item.pdf_file ? (
                <Link key={item.id} to={`/vocabulary/${item.id}`}
                  className="card p-5 transition-all group hover:shadow-md hover:border-emerald-500/30 block">
                  {content}
                </Link>
              ) : (
                <div key={item.id} className="card p-5 opacity-60 cursor-not-allowed group">
                  {content}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
