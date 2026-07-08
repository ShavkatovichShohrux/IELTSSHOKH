import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Flag, CheckSquare, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'
import { useCopyProtection } from '../hooks/useCopyProtection'
import AudioPlayer from '../components/AudioPlayer'
import QuestionBlock from '../components/QuestionBlock'
import ResultModal from '../components/ResultModal'

const BAND_MAP = [
  [39, 9.0],[37, 8.5],[35, 8.0],[32, 7.5],[30, 7.0],
  [26, 6.5],[23, 6.0],[18, 5.5],[16, 5.0],[13, 4.5],
  [11, 4.0],[9, 3.5],[7, 3.0],[5, 2.5],[0, 2.0],
]
const calcBand = (score, total = 40) => {
  const n = total !== 40 ? Math.round(score * 40 / total) : score
  for (const [t, b] of BAND_MAP) if (n >= t) return b
  return 2.0
}

export default function ListeningTest() {
  useCopyProtection()
  const { id } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const startRef = useRef(Date.now())
  const [activePart, setActivePart] = useState(0)
  const [answers, setAnswers] = useState({})
  const [flagged, setFlagged] = useState(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)

  const { data: test, isLoading, error } = useQuery({
    queryKey: ['test', id],
    queryFn: async () => (await api.getTest(id)).data,
  })

  const setAnswer = (qNum, val) => {
    if (submitted) return
    setAnswers(p => ({ ...p, [`q${qNum}`]: val }))
  }

  const toggleFlag = qNum => setFlagged(p => {
    const n = new Set(p)
    n.has(qNum) ? n.delete(qNum) : n.add(qNum)
    return n
  })

  const submit = async () => {
    if (submitted) return
    const parts = test?.parts || []
    const allQs = parts.flatMap(p => p.questions || [])
    const total = allQs.length
    if (total === 0) return toast.error('Savollar topilmadi')

    const score = allQs.filter(q => {
      const ua = answers[`q${q.question_number}`]
      return normalize(ua) === normalize(q.correct_answer)
    }).length

    const band = calcBand(score, total)
    const elapsed = Math.round((Date.now() - startRef.current) / 1000)

    const res = {
      test_id: parseInt(id),
      score, total, band_score: band,
      answers, time_taken: elapsed,
    }
    try {
      const response = await api.submitResult(res)
      setResult({ ...response.data, answers })
      setSubmitted(true)
      toast.success(`Natija: ${band.toFixed(1)} Band`)
    } catch {
      // Save locally if API fails
      setResult({ ...res, id: 0, created_at: new Date().toISOString() })
      setSubmitted(true)
    }
  }

  const retry = () => {
    setAnswers({})
    setFlagged(new Set())
    setSubmitted(false)
    setResult(null)
    setActivePart(0)
    startRef.current = Date.now()
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
      <div className="text-gray-500 animate-pulse">Yuklanmoqda...</div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
      <div className="text-center">
        <p className="text-red-500 mb-4">Test yuklanmadi</p>
        <button onClick={() => navigate('/')} className="btn-secondary">Orqaga</button>
      </div>
    </div>
  )

  const parts = test?.parts || []
  const currentPart = parts[activePart]

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Audio player */}
      <AudioPlayer src={test?.audio_url} title={test?.title} />

      {/* Content — offset for audio player height */}
      <div className="pt-24 pb-32 max-w-3xl mx-auto px-4">
        {/* Back + title */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="font-black text-gray-900 dark:text-gray-100">{test?.title}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Listening Test · {parts.flatMap(p => p.questions || []).length} savol</p>
          </div>
        </div>

        {/* Part tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {parts.map((part, i) => {
            const qs = part.questions || []
            const answered = qs.filter(q => answers[`q${q.question_number}`] !== undefined && answers[`q${q.question_number}`] !== '').length
            return (
              <button key={part.id} onClick={() => setActivePart(i)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors border
                  ${activePart === i
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand/50'
                  }`}>
                Part {part.part_number}
                <span className={`ml-1.5 text-xs ${activePart === i ? 'text-red-200' : 'text-gray-400'}`}>
                  {answered}/{qs.length}
                </span>
              </button>
            )
          })}
        </div>

        {/* Part card */}
        {currentPart && (
          <div className="card p-5 mb-4">
            <div className="border-b border-gray-200 dark:border-gray-800 pb-3 mb-4">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-gray-900 dark:text-gray-100 text-lg">
                  PART {currentPart.part_number}
                </h2>
                {currentPart.title && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">{currentPart.title}</span>
                )}
              </div>
              {currentPart.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1"
                  dangerouslySetInnerHTML={{ __html: currentPart.description }} />
              )}
            </div>

            <div className="space-y-1 divide-y divide-gray-100 dark:divide-gray-800">
              {(currentPart.questions || []).map(q => (
                <div key={q.id} className="relative">
                  <div className="absolute right-0 top-2">
                    <button onClick={() => toggleFlag(q.question_number)}
                      className={`p-1 rounded transition-colors ${flagged.has(q.question_number) ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-700 hover:text-yellow-400'}`}
                      title="Belgilash">
                      <Flag size={14} />
                    </button>
                  </div>
                  <QuestionBlock
                    question={q}
                    value={answers[`q${q.question_number}`]}
                    onChange={val => setAnswer(q.question_number, val)}
                    showResult={submitted}
                    disabled={submitted}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button onClick={() => setActivePart(p => Math.max(0, p - 1))}
            disabled={activePart === 0}
            className="btn-secondary disabled:opacity-40">
            ← Oldingi Part
          </button>

          {activePart < parts.length - 1 ? (
            <button onClick={() => setActivePart(p => p + 1)} className="btn-primary">
              Keyingi Part →
            </button>
          ) : !submitted ? (
            <button onClick={submit} className="btn-primary flex items-center gap-2">
              <CheckSquare size={18} />Javoblarni tekshirish
            </button>
          ) : null}
        </div>

        {/* All questions answered indicator */}
        {!submitted && (
          <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Jami: {Object.values(answers).filter(v => v !== '' && v !== undefined && (Array.isArray(v) ? v.length > 0 : true)).length} / {parts.flatMap(p => p.questions || []).length} javob berildi
            </p>
          </div>
        )}
      </div>

      {/* Result modal */}
      {result && (
        <ResultModal
          result={result}
          test={test}
          onClose={() => navigate('/')}
          onRetry={retry}
        />
      )}
    </div>
  )
}

function normalize(v) {
  if (v === null || v === undefined) return ''
  return String(v).trim().toLowerCase()
}
