import { useQuery } from '@tanstack/react-query'
import { BarChart2, Clock, Award } from 'lucide-react'
import { api } from '../api/client'

const bandColor = b => b >= 8 ? 'text-green-500' : b >= 7 ? 'text-blue-500' : b >= 6 ? 'text-yellow-500' : b >= 5 ? 'text-orange-500' : 'text-red-500'

export default function MyResults() {
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['myResults'],
    queryFn: async () => (await api.myResults()).data,
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <BarChart2 size={24} className="text-brand" />
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Mening natijalarim</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({length:4}).map((_,i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <Award size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Hali natija yo'q</p>
          <p className="text-sm mt-1">Birinchi testni boshlang!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map(r => (
            <div key={r.id} className="card p-4 flex items-center gap-4">
              <div className={`text-4xl font-black ${bandColor(r.band_score)} w-16 text-center flex-shrink-0`}>
                {r.band_score.toFixed(1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 dark:text-gray-100 truncate">{r.test_title || `Test #${r.test_id}`}</div>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <span>{r.score}/{r.total} to'g'ri</span>
                  {r.time_taken && (
                    <span className="flex items-center gap-1">
                      <Clock size={13} />{Math.floor(r.time_taken/60)}m {r.time_taken%60}s
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-600 flex-shrink-0">
                {new Date(r.created_at).toLocaleDateString('uz-UZ')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
