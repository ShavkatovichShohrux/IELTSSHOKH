import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckSquare, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { useCopyProtection } from '../hooks/useCopyProtection'
import QuestionBlock from '../components/QuestionBlock'
import ResultModal from '../components/ResultModal'

const BAND_MAP = [
  [39,9.0],[37,8.5],[35,8.0],[32,7.5],[30,7.0],
  [26,6.5],[23,6.0],[18,5.5],[16,5.0],[13,4.5],
  [11,4.0],[9,3.5],[7,3.0],[5,2.5],[0,2.0],
]
const calcBand = (score, total=40) => {
  const n = total!==40 ? Math.round(score*40/total) : score
  for (const [t,b] of BAND_MAP) if (n>=t) return b
  return 2.0
}

export default function ReadingTest() {
  useCopyProtection()
  const { id } = useParams()
  const navigate = useNavigate()
  const startRef = useRef(Date.now())
  const [activePassage, setActivePassage] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [mobileTab, setMobileTab] = useState('passage')

  const { data: test, isLoading, error } = useQuery({
    queryKey: ['test', id],
    queryFn: async () => (await api.getTest(id)).data,
  })

  const setAnswer = (qNum, val) => {
    if (submitted) return
    setAnswers(p => ({ ...p, [`q${qNum}`]: val }))
  }

  const submit = async () => {
    if (submitted) return
    const parts = test?.parts || []
    const allQs = parts.flatMap(p => p.questions || [])
    if (!allQs.length) return

    const score = allQs.filter(q => normalize(answers[`q${q.question_number}`]) === normalize(q.correct_answer)).length
    const total = allQs.length
    const band = calcBand(score, total)
    const elapsed = Math.round((Date.now() - startRef.current) / 1000)

    try {
      const res = await api.submitResult({ test_id: parseInt(id), score, total, band_score: band, answers, time_taken: elapsed })
      setResult({ ...res.data, answers })
    } catch {
      setResult({ test_id: parseInt(id), score, total, band_score: band, answers, time_taken: elapsed, id: 0, created_at: new Date().toISOString() })
    }
    setSubmitted(true)
    toast.success(`Band: ${band.toFixed(1)}`)
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
      <div className="text-gray-500 animate-pulse">Yuklanmoqda...</div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950">
      <p className="text-red-500 mb-4">Test yuklanmadi</p>
      <button onClick={() => navigate('/')} className="btn-secondary">Orqaga</button>
    </div>
  )

  const parts = test?.parts || []
  const currentPart = parts[activePassage]

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pt-4 pb-16">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{test?.title}</span>
              <span className="ml-2 badge-reading">Reading</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {parts.map((p, i) => (
              <button key={p.id} onClick={() => setActivePassage(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                  ${activePassage === i ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                Passage {p.part_number}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile tab switcher */}
      {currentPart && (
        <div className="lg:hidden flex gap-2 px-4 mt-3">
          <button
            onClick={() => setMobileTab('passage')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mobileTab === 'passage' ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
          >
            📖 Matn
          </button>
          <button
            onClick={() => setMobileTab('questions')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mobileTab === 'questions' ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
          >
            ❓ Savollar
          </button>
        </div>
      )}

      {/* Split view */}
      {currentPart && (
        <div className="max-w-6xl mx-auto px-4 mt-4 lg:grid lg:grid-cols-2 gap-4 lg:h-[calc(100vh-100px)] flex flex-col lg:flex-none">
          {/* Left: Passage */}
          <div className={`card p-6 overflow-y-auto scrollbar-thin ${mobileTab !== 'passage' ? 'hidden lg:block' : ''}`}>
            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">
              Passage {currentPart.part_number}
            </div>
            {currentPart.title && (
              <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-4">{currentPart.title}</h2>
            )}
            {currentPart.passage_text ? (
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: currentPart.passage_text }} />
            ) : (
              <p className="text-gray-400 italic">Matn yuklanmagan</p>
            )}
          </div>

          {/* Right: Questions */}
          <div className={`card p-5 overflow-y-auto scrollbar-thin flex flex-col ${mobileTab !== 'questions' ? 'hidden lg:flex' : ''}`}>
            <div className="flex-1 divide-y divide-gray-100 dark:divide-gray-800">
              {(currentPart.questions || []).map(q => (
                <QuestionBlock key={q.id} question={q}
                  value={answers[`q${q.question_number}`]}
                  onChange={val => setAnswer(q.question_number, val)}
                  showResult={submitted} disabled={submitted}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4 flex justify-between items-center">
              <button onClick={() => setActivePassage(p => Math.max(0, p-1))} disabled={activePassage===0} className="btn-secondary disabled:opacity-40">
                ← Oldingi
              </button>
              {activePassage < parts.length - 1 ? (
                <button onClick={() => setActivePassage(p => p+1)} className="btn-primary">Keyingi →</button>
              ) : !submitted ? (
                <button onClick={submit} className="btn-primary flex items-center gap-2">
                  <CheckSquare size={16} />Tekshirish
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {result && (
        <ResultModal result={result} test={test} onClose={() => navigate('/')}
          onRetry={() => { setAnswers({}); setSubmitted(false); setResult(null); setActivePassage(0) }} />
      )}
    </div>
  )
}

function normalize(v) {
  if (v==null) return ''
  return String(v).trim().toLowerCase()
}
