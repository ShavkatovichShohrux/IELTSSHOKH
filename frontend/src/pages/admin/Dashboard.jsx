import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, BookOpen, BarChart2, Headphones, BookMarked, TrendingUp, Plus, RefreshCw, Clock } from 'lucide-react'
import { api } from '../../api/client'

const COLOR_MAP = {
  brand: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-brand' },
  blue:  { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-500' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-500' },
  purple:{ bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-500' },
}

const StatCard = ({ icon: Icon, label, value, sub, color = 'brand' }) => {
  const c = COLOR_MAP[color] || COLOR_MAP.brand
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <div className="text-3xl font-black text-gray-900 dark:text-gray-100">{value}</div>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
      </div>
      <div className={`p-3 rounded-xl ${c.bg}`}>
        <Icon size={22} className={c.text} />
      </div>
    </div>
  )
}

const BAND_COLOR = b => b >= 7 ? 'text-green-500' : b >= 6 ? 'text-yellow-500' : b >= 5 ? 'text-orange-500' : 'text-red-500'

export default function Dashboard() {
  const qc = useQueryClient()

  const { data: stats, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['globalStats'],
    queryFn: async () => (await api.globalStats()).data,
  })
  const { data: testStats = [], isLoading: loadingTests } = useQuery({
    queryKey: ['testStats'],
    queryFn: async () => (await api.testStats()).data,
  })
  const { data: recentResults = [], isLoading: loadingRecent } = useQuery({
    queryKey: ['recentResults'],
    queryFn: async () => {
      const res = await api.allResults({ limit: 8 })
      return res.data
    },
  })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['globalStats'] })
    qc.invalidateQueries({ queryKey: ['testStats'] })
    qc.invalidateQueries({ queryKey: ['recentResults'] })
  }

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Umumiy ko'rsatkichlar
            {lastUpdated && <span className="ml-2 text-xs text-gray-400">· {lastUpdated}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={refresh}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Yangilash</span>
          </button>
          <Link to="/admin/tests/new" className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={16} /><span className="hidden sm:inline">Yangi test</span><span className="sm:hidden">Yangi</span>
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="card p-5 h-24 animate-pulse bg-gray-100 dark:bg-gray-800" />)
        ) : (
          <>
            <StatCard icon={Users}      label="Foydalanuvchilar"  value={stats?.total_users ?? 0}        color="blue" />
            <StatCard icon={BookOpen}   label="Jami testlar"       value={stats?.total_tests ?? 0}
              sub={`${stats?.listening_tests ?? 0} listening · ${stats?.reading_tests ?? 0} reading`}    color="green" />
            <StatCard icon={BarChart2}  label="Jami urinishlar"    value={stats?.total_results ?? 0}     color="purple" />
            <StatCard icon={TrendingUp} label="O'rtacha Band"       value={stats?.avg_band_score?.toFixed(1) ?? '—'} color="brand" />
            <StatCard icon={Headphones} label="Listening testlar"   value={stats?.listening_tests ?? 0}  color="blue" />
            <StatCard icon={BookMarked} label="Reading testlar"     value={stats?.reading_tests ?? 0}    color="green" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Top tests */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Eng ko'p ishlangan testlar</h2>
          {loadingTests ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded" />)}
            </div>
          ) : testStats.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Hali ma'lumot yo'q</p>
          ) : (
            <div className="space-y-3">
              {testStats.slice(0, 7).map((t, i) => (
                <div key={t.test_id} className="flex items-center gap-3">
                  <span className="text-xs font-black text-gray-400 w-5 flex-shrink-0 text-center">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{t.test_title}</span>
                      <span className={t.test_type === 'listening' ? 'badge-listening' : 'badge-reading'}>{t.test_type}</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-brand rounded-full transition-all"
                        style={{ width: `${Math.min(100, (t.attempts / (testStats[0]?.attempts || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-sm font-bold ${BAND_COLOR(t.avg_band_score)}`}>{t.avg_band_score.toFixed(1)}</div>
                    <div className="text-xs text-gray-400">{t.attempts} ta</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-gray-400" /> So'nggi urinishlar
          </h2>
          {loadingRecent ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded" />)}
            </div>
          ) : recentResults.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Hali urinish yo'q</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentResults.slice(0, 8).map(r => (
                <div key={r.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{r.test_title || `Test #${r.test_id}`}</p>
                    <p className="text-xs text-gray-400">{r.username || `User #${r.user_id}`} · {new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0 text-right">
                    <span className={`font-bold text-sm ${BAND_COLOR(r.band_score)}`}>{r.band_score?.toFixed(1) ?? '—'}</span>
                    <p className="text-xs text-gray-400">{r.score}/{r.total}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Tezkor amallar</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/tests/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} />Yangi test yaratish
          </Link>
          <Link to="/admin/users" className="btn-secondary flex items-center gap-2 text-sm">
            <Users size={16} />Foydalanuvchilar
          </Link>
          <Link to="/admin/audio" className="btn-secondary flex items-center gap-2 text-sm">
            <Headphones size={16} />Audio yuklash
          </Link>
          <Link to="/admin/stats" className="btn-secondary flex items-center gap-2 text-sm">
            <BarChart2 size={16} />Statistika
          </Link>
        </div>
      </div>
    </div>
  )
}
