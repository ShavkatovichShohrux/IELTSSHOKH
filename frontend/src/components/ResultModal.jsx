import { X, CheckCircle, XCircle, MinusCircle, RotateCcw } from 'lucide-react'

const BAND_COLOR = b => {
  if (b >= 8) return 'text-green-500'
  if (b >= 7) return 'text-blue-500'
  if (b >= 6) return 'text-yellow-500'
  if (b >= 5) return 'text-orange-500'
  return 'text-red-500'
}

export default function ResultModal({ result, test, onClose, onRetry }) {
  if (!result) return null
  const { score, total, band_score, answers } = result
  const wrong = total - score
  const pct = Math.round((score / total) * 100)

  // Per-part breakdown
  const parts = test?.parts || []

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">Natijangiz</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{test?.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Band score */}
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className={`text-7xl font-black ${BAND_COLOR(band_score)}`}>{band_score.toFixed(1)}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">IELTS Band</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-gray-800 dark:text-gray-100">{score}<span className="text-2xl text-gray-400">/{total}</span></div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pct}% to'g'ri</div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <CheckCircle size={20} className="text-green-500 mx-auto mb-1" />
              <div className="text-2xl font-black text-green-600 dark:text-green-400">{score}</div>
              <div className="text-xs text-gray-500">To'g'ri</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <XCircle size={20} className="text-red-500 mx-auto mb-1" />
              <div className="text-2xl font-black text-red-600 dark:text-red-400">{wrong}</div>
              <div className="text-xs text-gray-500">Noto'g'ri</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <MinusCircle size={20} className="text-gray-400 mx-auto mb-1" />
              <div className="text-2xl font-black text-gray-500">{result.time_taken ? `${Math.floor(result.time_taken / 60)}m` : '—'}</div>
              <div className="text-xs text-gray-500">Vaqt</div>
            </div>
          </div>

          {/* Per-part breakdown */}
          {parts.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Part bo'yicha natija</h3>
              <div className="space-y-2">
                {parts.map(part => {
                  const qs = part.questions || []
                  const partScore = qs.filter(q => {
                    const userAns = answers?.[`q${q.question_number}`]
                    return normalize(userAns) === normalize(q.correct_answer)
                  }).length
                  const pBar = qs.length ? (partScore / qs.length) * 100 : 0
                  return (
                    <div key={part.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Part {part.part_number}</span>
                        <span className="text-gray-500">{partScore}/{qs.length}</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${pBar >= 70 ? 'bg-green-500' : pBar >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${pBar}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Wrong answers list */}
          {parts.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Noto'g'ri javoblar</h3>
              <div className="space-y-2">
                {parts.flatMap(part =>
                  (part.questions || []).filter(q => {
                    const userAns = answers?.[`q${q.question_number}`]
                    return normalize(userAns) !== normalize(q.correct_answer)
                  }).map(q => (
                    <div key={q.id} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/30">
                      <span className="text-xs font-black text-red-500 w-6">Q{q.question_number}</span>
                      <div className="flex-1 min-w-0">
                        {q.question_text && <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 truncate" dangerouslySetInnerHTML={{ __html: q.question_text }} />}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-red-600 dark:text-red-400">
                            Sizniki: <strong>{String(answers?.[`q${q.question_number}`] || '—')}</strong>
                          </span>
                          <span className="text-xs text-green-600 dark:text-green-400">
                            To'g'ri: <strong>{String(q.correct_answer ?? '—')}</strong>
                          </span>
                        </div>
                        {q.feedback && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{q.feedback}</p>}
                      </div>
                    </div>
                  ))
                )}
                {parts.flatMap(p => p.questions || []).filter(q =>
                  normalize(answers?.[`q${q.question_number}`]) !== normalize(q.correct_answer)
                ).length === 0 && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">🎉 Barcha savollar to'g'ri!</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-800">
          {onRetry && (
            <button onClick={onRetry} className="btn-secondary flex items-center gap-2">
              <RotateCcw size={16} />Qayta urinish
            </button>
          )}
          <button onClick={onClose} className="btn-primary flex-1">Yopish</button>
        </div>
      </div>
    </div>
  )
}

function normalize(v) {
  if (v === null || v === undefined) return ''
  return String(v).trim().toLowerCase()
}
