import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Headphones, BookOpen, Clock, ChevronRight, Search, Mic, Lock, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'

const TypeBadge = ({ type }) =>
  type === 'listening'
    ? <span className="badge-listening"><Headphones size={11} className="mr-1" />Listening</span>
    : <span className="badge-reading"><BookOpen size={11} className="mr-1" />Reading</span>

export default function Home() {
  const { user, token } = useAuthStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: () => api.getTopics().then(r => r.data),
  })

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['tests'],
    queryFn: () => api.getTests().then(r => r.data),
  })

  const filtered = tests.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || t.type === filter
    return matchSearch && matchFilter
  })

  const openTopic = (id) => {
    window.open(`/api/topics/${id}/content?t=${token}`, '_blank')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/tests" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-brand">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Mic size={22} className="text-brand" /> Speaking <span className="text-brand">Part 2 / 3</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Dossierlar va namunalar</p>
        </div>
      </div>

      {/* Speaking Topics */}
      {(filter === 'all' || filter === 'speaking') && topics.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-black text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <Mic size={18} className="text-brand" /> Speaking Dossierlar
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map(topic => (
              <div key={topic.id}
                onClick={() => topic.html_file ? openTopic(topic.id) : null}
                className={`card p-5 transition-all group ${
                  topic.html_file
                    ? 'hover:shadow-md hover:border-brand/30 cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                }`}>
                <div className="flex items-start justify-between mb-3">
                  <span className="badge-speaking flex items-center gap-1">
                    <Mic size={11} className="mr-1" />Speaking
                  </span>
                  {topic.html_file
                    ? <ChevronRight size={18} className="text-gray-400 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                    : <Lock size={16} className="text-gray-400" />
                  }
                </div>
                <h3 className={`font-bold mb-1 transition-colors ${
                  topic.html_file ? 'text-gray-900 dark:text-gray-100 group-hover:text-brand' : 'text-gray-500 dark:text-gray-500'
                }`}>
                  {topic.name}
                  {topic.name_uz && <span className="font-normal text-sm text-gray-400 ml-1">· {topic.name_uz}</span>}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">Part 2 & 3 · Band 6/7/8/9</span>
                </div>
                {!topic.html_file && (
                  <p className="text-xs text-orange-500 mt-2 font-medium">Tez kunda qo'shiladi</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Test qidirish..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 text-sm" style={{ userSelect: 'text' }}
          />
        </div>
        <div className="flex gap-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-1">
          {['all', 'listening', 'reading', 'speaking'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize
                ${filter === f ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              {f === 'all' ? 'Barchasi' : f === 'listening' ? 'Listening' : f === 'reading' ? 'Reading' : 'Speaking'}
            </button>
          ))}
        </div>
      </div>

      {/* Tests grid */}
      {(filter === 'all' || filter === 'listening' || filter === 'reading') && (
        isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600">
            <p className="text-lg font-medium">Test topilmadi</p>
            <p className="text-sm mt-1">Qidiruv so'zini o'zgartiring</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(test => (
              <Link key={test.id} to={`/${test.type}/${test.id}`}
                className="card p-5 hover:shadow-md hover:border-brand/30 transition-all group block">
                <div className="flex items-start justify-between mb-3">
                  <TypeBadge type={test.type} />
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-brand transition-colors">
                  {test.title}
                </h3>
                {test.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{test.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />{test.questions_count} savol
                  </span>
                  <span>{test.difficulty}</span>
                  {!test.is_published && <span className="text-yellow-500">Draft</span>}
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  )
}
