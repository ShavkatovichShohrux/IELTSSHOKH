import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Eye, EyeOff, Search, Copy, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../api/client'

const TOPIC_DOT = { blue:'bg-blue-500', green:'bg-green-500', purple:'bg-purple-500', orange:'bg-orange-500', red:'bg-red-500', teal:'bg-teal-500', pink:'bg-pink-500', gray:'bg-gray-500' }
const TYPE_FILTERS = ['Barchasi', 'listening', 'reading']
const STATUS_FILTERS = ['Barchasi', 'nashr', 'draft']
const SORT_OPTS = [
  { label: 'Eng yangi', key: 'created_at', dir: 'desc' },
  { label: 'Eng eski', key: 'created_at', dir: 'asc' },
  { label: 'A → Z', key: 'title', dir: 'asc' },
  { label: 'Z → A', key: 'title', dir: 'desc' },
]

function sortTests(tests, opt) {
  return [...tests].sort((a, b) => {
    let va = a[opt.key], vb = b[opt.key]
    if (opt.key === 'created_at') { va = new Date(va); vb = new Date(vb) }
    if (opt.key === 'title') { va = va?.toLowerCase(); vb = vb?.toLowerCase() }
    if (va < vb) return opt.dir === 'asc' ? -1 : 1
    if (va > vb) return opt.dir === 'asc' ? 1 : -1
    return 0
  })
}

export default function TestList() {
  const qc = useQueryClient()
  const [deleting, setDeleting] = useState(null)
  const [duplicating, setDuplicating] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('Barchasi')
  const [statusFilter, setStatusFilter] = useState('Barchasi')
  const [topicFilter, setTopicFilter] = useState('')
  const [sortIdx, setSortIdx] = useState(0)

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['adminTests'],
    queryFn: async () => (await api.getTests()).data,
  })
  const { data: testStats = [] } = useQuery({
    queryKey: ['testStats'],
    queryFn: async () => (await api.testStats()).data,
  })
  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: async () => (await api.getTopics()).data,
  })

  const statsMap = Object.fromEntries(testStats.map(s => [s.test_id, s]))

  const visible = sortTests(
    tests.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === 'Barchasi' || t.type === typeFilter
      const matchStatus = statusFilter === 'Barchasi'
        || (statusFilter === 'nashr' && t.is_published)
        || (statusFilter === 'draft' && !t.is_published)
      const matchTopic = !topicFilter || String(t.topic_id) === topicFilter
      return matchSearch && matchType && matchStatus && matchTopic
    }),
    SORT_OPTS[sortIdx]
  )

  const togglePublish = async test => {
    try {
      await api.updateTest(test.id, { is_published: !test.is_published })
      qc.invalidateQueries({ queryKey: ['adminTests'] })
      toast.success(test.is_published ? 'Test yashirildi' : 'Test nashr qilindi')
    } catch {
      toast.error('Xatolik')
    }
  }

  const deleteTest = async id => {
    if (!confirm("Rostdan ham bu testni o'chirmoqchimisiz?")) return
    setDeleting(id)
    try {
      await api.deleteTest(id)
      qc.invalidateQueries({ queryKey: ['adminTests'] })
      toast.success("Test o'chirildi")
    } catch {
      toast.error('Xatolik')
    } finally {
      setDeleting(null)
    }
  }

  const duplicate = async test => {
    setDuplicating(test.id)
    try {
      const { data: full } = await api.getTest(test.id)
      await api.createTest({
        title: `${full.title} (nusxa)`,
        type: full.type,
        description: full.description || '',
        audio_url: full.audio_url || '',
        difficulty: full.difficulty || 'Academic',
        is_published: false,
        parts: full.parts.map(p => ({
          part_number: p.part_number,
          title: p.title || '',
          description: p.description || '',
          passage_text: p.passage_text || '',
          questions: p.questions.map(q => ({
            question_number: q.question_number,
            question_type: q.question_type,
            question_text: q.question_text || '',
            options: q.options || null,
            correct_answer: q.correct_answer !== null && q.correct_answer !== undefined ? q.correct_answer : '',
            feedback: q.feedback || '',
          })),
        })),
      })
      qc.invalidateQueries({ queryKey: ['adminTests'] })
      toast.success('Test nusxalandi')
    } catch {
      toast.error('Nusxalash xatosi')
    } finally {
      setDuplicating(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Testlar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {tests.length} ta test {visible.length !== tests.length && `· ${visible.length} ta topildi`}
          </p>
        </div>
        <Link to="/admin/tests/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} />Yangi test
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9 text-sm"
            placeholder="Test nomi bo'yicha qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ userSelect: 'text' }}
          />
        </div>

        {/* Type filter */}
        <div className="flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-1 gap-1">
          {TYPE_FILTERS.map(f => (
            <button key={f} onClick={() => setTypeFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize
                ${typeFilter === f ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              {f === 'Barchasi' ? 'Hammasi' : f}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-1 gap-1">
          {STATUS_FILTERS.map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize
                ${statusFilter === f ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              {f === 'Barchasi' ? 'Hammasi' : f === 'nashr' ? 'Nashr' : 'Draft'}
            </button>
          ))}
        </div>

        {/* Topic filter */}
        {topics.length > 0 && (
          <select value={topicFilter} onChange={e => setTopicFilter(e.target.value)}
            className="input text-sm py-2 w-auto" style={{ userSelect: 'text' }}>
            <option value="">Barcha mavzular</option>
            {topics.map(t => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
          </select>
        )}

        {/* Sort */}
        <select
          value={sortIdx}
          onChange={e => setSortIdx(Number(e.target.value))}
          className="input text-sm py-2 w-auto"
          style={{ userSelect: 'text' }}>
          {SORT_OPTS.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            {tests.length === 0
              ? <><p className="font-medium mb-2">Hali test yo'q</p><Link to="/admin/tests/new" className="text-brand text-sm hover:underline">Birinchi testni yarating</Link></>
              : <p className="font-medium">Hech narsa topilmadi — filterni o'zgartiring</p>
            }
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-semibold">Test nomi</th>
                <th className="text-left px-4 py-3 font-semibold">Tur</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Savollar</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Urinishlar</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Holat</th>
                <th className="text-right px-4 py-3 font-semibold">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {visible.map(test => {
                const stat = statsMap[test.id]
                return (
                  <tr key={test.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{test.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{new Date(test.created_at).toLocaleDateString()}</span>
                        {test.topic_name && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className={`w-1.5 h-1.5 rounded-full ${TOPIC_DOT[test.topic_color] || TOPIC_DOT.blue}`} />
                            {test.topic_name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={test.type === 'listening' ? 'badge-listening' : 'badge-reading'}>{test.type}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600 dark:text-gray-400">
                      {test.questions_count} savol · {test.parts_count} part
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-600 dark:text-gray-400">
                      {stat ? (
                        <span>{stat.attempts} ta
                          {stat.avg_band_score > 0 && (
                            <span className={`ml-1.5 font-semibold ${stat.avg_band_score >= 7 ? 'text-green-500' : stat.avg_band_score >= 6 ? 'text-yellow-500' : 'text-red-500'}`}>
                              Band {stat.avg_band_score.toFixed(1)}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {test.is_published
                        ? <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">Nashr</span>
                        : <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded-full">Draft</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <button onClick={() => togglePublish(test)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title={test.is_published ? 'Yashirish' : 'Nashr qilish'}>
                          {test.is_published
                            ? <EyeOff size={15} className="text-gray-400" />
                            : <Eye size={15} className="text-green-500" />}
                        </button>
                        <button onClick={() => duplicate(test)} disabled={duplicating === test.id}
                          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Nusxalash">
                          <Copy size={15} className={duplicating === test.id ? 'text-blue-400 animate-pulse' : 'text-gray-400'} />
                        </button>
                        <Link to={`/admin/tests/${test.id}/edit`}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                          <Pencil size={15} className="text-gray-400" />
                        </Link>
                        <button onClick={() => deleteTest(test.id)} disabled={deleting === test.id}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 size={15} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
