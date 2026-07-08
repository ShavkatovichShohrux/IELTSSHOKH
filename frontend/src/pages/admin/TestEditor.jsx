import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Save, ArrowLeft, ChevronDown, ChevronUp, Play, Square, AlertCircle, CheckCircle2, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../../api/client'

const QTYPES = [
  { value: 'text',         label: 'Text (açiq javob)',     hint: 'Foydalanuvchi matn yozadi. Javob: "mining"' },
  { value: 'radio',        label: 'Radio (bitta tanlov)',   hint: 'Bitta variant tanlanadi. Javob: "A"' },
  { value: 'select',       label: 'Select (dropdown)',      hint: 'Dropdown orqali tanlov. Javob: "B"' },
  { value: 'multi_select', label: 'Multi-select',           hint: 'Bir nechta variant. Javob: ["A","C"]' },
  { value: 'tfng',         label: 'True/False/NG',          hint: 'Javob: "True", "False", yoki "Not Given"' },
  { value: 'yn',           label: 'Yes/No/NG',              hint: 'Javob: "Yes", "No", yoki "Not Given"' },
  { value: 'match',        label: 'Matching',               hint: 'Moslashtirish. Javob: "B" (harflar bilan)' },
]
const QTYPE_MAP = Object.fromEntries(QTYPES.map(q => [q.value, q]))
const NEEDS_OPTIONS = ['radio', 'select', 'multi_select', 'match']

function newQuestion(num) {
  return { question_number: num, question_type: 'text', question_text: '', options: '', correct_answer: '', feedback: '' }
}
function newPart(num) {
  return { part_number: num, title: '', description: '', passage_text: '', questions: [newQuestion(1)] }
}

function JsonField({ value, onChange }) {
  const [error, setError] = useState(null)

  const handleChange = v => {
    onChange(v)
    if (!v.trim()) { setError(null); return }
    try { JSON.parse(v); setError(null) }
    catch (e) { setError('JSON xato: ' + e.message.split('\n')[0]) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="label text-xs">Variantlar (JSON array)</label>
        {value && !error && <CheckCircle2 size={13} className="text-green-500" />}
        {error && <AlertCircle size={13} className="text-red-500" />}
      </div>
      <textarea
        className={`input text-xs font-mono min-h-20 resize-none ${error ? 'border-red-400 focus:ring-red-300' : ''}`}
        value={value || ''}
        onChange={e => handleChange(e.target.value)}
        placeholder={'[{"label":"A","text":"Option text"},{"label":"B","text":"..."}]'}
        style={{ userSelect: 'text' }}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export default function TestEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isEdit = !!id

  const [form, setForm] = useState({
    title: '', type: 'listening', description: '', audio_url: '',
    difficulty: 'Academic', is_published: true, topic_id: null,
    parts: [newPart(1)],
  })
  const [saving, setSaving] = useState(false)
  const [openParts, setOpenParts] = useState({ 0: true })
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioEl, setAudioEl] = useState(null)
  const [errors, setErrors] = useState({})

  const { data: existing } = useQuery({
    queryKey: ['test', id],
    queryFn: async () => (await api.getTest(id)).data,
    enabled: isEdit,
  })

  const { data: topics = [] } = useQuery({
    queryKey: ['topics'],
    queryFn: async () => (await api.getTopics()).data,
  })

  useEffect(() => {
    if (!existing) return
    setForm({
      title: existing.title,
      type: existing.type,
      description: existing.description || '',
      audio_url: existing.audio_url || '',
      difficulty: existing.difficulty || 'Academic',
      is_published: existing.is_published,
      topic_id: existing.topic_id || null,
      parts: existing.parts.map(p => ({
        part_number: p.part_number,
        title: p.title || '',
        description: p.description || '',
        passage_text: p.passage_text || '',
        questions: p.questions.map(q => ({
          question_number: q.question_number,
          question_type: q.question_type,
          question_text: q.question_text || '',
          options: q.options ? JSON.stringify(q.options, null, 2) : '',
          correct_answer: q.correct_answer !== null && q.correct_answer !== undefined
            ? (typeof q.correct_answer === 'object' ? JSON.stringify(q.correct_answer) : String(q.correct_answer))
            : '',
          feedback: q.feedback || '',
        })),
      })),
    })
    const opens = {}
    existing.parts.forEach((_, i) => { opens[i] = i === 0 })
    setOpenParts(opens)
  }, [existing])

  useEffect(() => {
    return () => { if (audioEl) { audioEl.pause(); audioEl.src = '' } }
  }, [audioEl])

  const setField = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(e => ({ ...e, [k]: null })) }
  const setPart = (pi, k, v) => setForm(p => { const pts = [...p.parts]; pts[pi] = { ...pts[pi], [k]: v }; return { ...p, parts: pts } })
  const setQ = (pi, qi, k, v) => setForm(p => {
    const pts = [...p.parts]; const qs = [...pts[pi].questions]
    qs[qi] = { ...qs[qi], [k]: v }; pts[pi] = { ...pts[pi], questions: qs }
    return { ...p, parts: pts }
  })

  const addPart = () => {
    const num = form.parts.length + 1
    setForm(p => ({ ...p, parts: [...p.parts, newPart(num)] }))
    setOpenParts(p => ({ ...p, [form.parts.length]: true }))
  }
  const removePart = pi => setForm(p => ({
    ...p, parts: p.parts.filter((_, i) => i !== pi).map((pt, i) => ({ ...pt, part_number: i + 1 }))
  }))
  const addQuestion = pi => setForm(p => {
    const pts = [...p.parts]
    pts[pi] = { ...pts[pi], questions: [...pts[pi].questions, newQuestion(pts[pi].questions.length + 1)] }
    return { ...p, parts: pts }
  })
  const removeQuestion = (pi, qi) => setForm(p => {
    const pts = [...p.parts]
    pts[pi] = { ...pts[pi], questions: pts[pi].questions.filter((_, i) => i !== qi).map((q, i) => ({ ...q, question_number: i + 1 })) }
    return { ...p, parts: pts }
  })

  const toggleAllParts = expand => {
    const opens = {}
    form.parts.forEach((_, i) => { opens[i] = expand })
    setOpenParts(opens)
  }

  const toggleAudio = () => {
    if (!form.audio_url) return toast.error('Audio URL kiriting')
    if (audioPlaying && audioEl) {
      audioEl.pause(); setAudioPlaying(false); return
    }
    const el = new Audio(form.audio_url)
    el.onended = () => setAudioPlaying(false)
    el.onerror = () => { toast.error("Audio yuklanmadi — URL tekshiring"); setAudioPlaying(false) }
    el.play().then(() => { setAudioEl(el); setAudioPlaying(true) }).catch(() => toast.error("Audio o'ynab bo'lmadi"))
  }

  const parseJSON = str => {
    if (!str || str.trim() === '') return null
    try { return JSON.parse(str) } catch { return str }
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = "Test nomi majburiy"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) { toast.error("Majburiy maydonlarni to'ldiring"); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        parts: form.parts.map(p => ({
          ...p,
          questions: p.questions.map(q => ({
            ...q,
            options: parseJSON(q.options),
            correct_answer: parseJSON(q.correct_answer) ?? q.correct_answer,
          })),
        })),
      }
      if (isEdit) await api.updateTest(id, payload)
      else await api.createTest(payload)
      qc.invalidateQueries({ queryKey: ['adminTests'] })
      qc.invalidateQueries({ queryKey: ['tests'] })
      toast.success(isEdit ? "Test yangilandi" : "Test yaratildi")
      navigate('/admin/tests')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Xatolik')
    } finally {
      setSaving(false)
    }
  }

  const totalQ = form.parts.reduce((s, p) => s + p.questions.length, 0)

  return (
    <div className="max-w-4xl space-y-5">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-gray-100 dark:bg-gray-950 py-3 -mx-6 px-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/tests')}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 truncate">
              {isEdit ? (form.title || 'Testni tahrirlash') : (form.title || 'Yangi test')}
            </h1>
            <p className="text-xs text-gray-400">{form.parts.length} part · {totalQ} savol</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => toggleAllParts(true)}
              className="btn-ghost text-xs hidden sm:flex items-center gap-1">
              <ChevronDown size={13} />Hamma
            </button>
            <button onClick={() => toggleAllParts(false)}
              className="btn-ghost text-xs hidden sm:flex items-center gap-1">
              <ChevronUp size={13} />Yig'ish
            </button>
            <button onClick={submit} disabled={saving} className="btn-primary flex items-center gap-2">
              <Save size={16} />{saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </div>
      </div>

      {/* Basic info */}
      <div className="card p-5 space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-gray-100">Asosiy ma'lumotlar</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Test nomi *</label>
            <input
              className={`input ${errors.title ? 'border-red-400 focus:ring-red-300' : ''}`}
              value={form.title}
              onChange={e => setField('title', e.target.value)}
              placeholder="Cambridge 21 Test 1"
              style={{ userSelect: 'text' }}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.title}</p>}
          </div>
          <div>
            <label className="label">Tur *</label>
            <select className="input" value={form.type} onChange={e => setField('type', e.target.value)} style={{ userSelect: 'text' }}>
              <option value="listening">Listening</option>
              <option value="reading">Reading</option>
            </select>
          </div>
        </div>

        {/* Audio URL with preview */}
        {form.type === 'listening' && (
          <div>
            <label className="label">Audio URL</label>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                value={form.audio_url}
                onChange={e => setField('audio_url', e.target.value)}
                placeholder="https://... yoki /api/audio/filename.mp3"
                style={{ userSelect: 'text' }}
              />
              <button
                onClick={toggleAudio}
                disabled={!form.audio_url}
                title={audioPlaying ? "To'xtatish" : "Sinab ko'rish"}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${audioPlaying ? 'bg-red-100 dark:bg-red-900/30 text-brand' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                {audioPlaying ? <Square size={15} /> : <Play size={15} />}
                {audioPlaying ? 'To\'xtat' : 'Test'}
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Qiyinlik darajasi</label>
            <select className="input" value={form.difficulty} onChange={e => setField('difficulty', e.target.value)} style={{ userSelect: 'text' }}>
              <option>Academic</option>
              <option>General</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={form.is_published}
                onChange={e => setField('is_published', e.target.checked)}
                className="w-4 h-4 accent-brand" style={{ userSelect: 'text' }} />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nashr qilish</p>
                <p className="text-xs text-gray-400">Foydalanuvchilarga ko'rinadigan bo'ladi</p>
              </div>
            </label>
          </div>
        </div>

        {/* Topic selector */}
        <div>
          <label className="label flex items-center gap-1.5"><Tag size={14} />Mavzu (topic)</label>
          <select
            className="input"
            value={form.topic_id ?? ''}
            onChange={e => setField('topic_id', e.target.value ? Number(e.target.value) : null)}
            style={{ userSelect: 'text' }}>
            <option value="">— Mavzu tanlanmagan —</option>
            {topics.map(t => <option key={t.id} value={t.id}>{t.name}{t.name_uz ? ` (${t.name_uz})` : ''}</option>)}
          </select>
          {topics.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Topiclar yo'q — <a href="/admin/topics" className="text-brand hover:underline">Topiclar sahifasida</a> yarating
            </p>
          )}
        </div>

        <div>
          <label className="label">Tavsif</label>
          <textarea className="input min-h-16 resize-none" value={form.description}
            onChange={e => setField('description', e.target.value)}
            placeholder="Test haqida qisqacha ma'lumot"
            style={{ userSelect: 'text' }} />
        </div>
      </div>

      {/* Parts */}
      <div className="space-y-3">
        {form.parts.map((part, pi) => (
          <div key={pi} className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800 cursor-pointer select-none"
              onClick={() => setOpenParts(p => ({ ...p, [pi]: !p[pi] }))}>
              <div className="flex items-center gap-3">
                <span className="font-black text-brand text-sm">Part {part.part_number}</span>
                {part.title && <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-48">{part.title}</span>}
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                  {part.questions.length} savol
                </span>
              </div>
              <div className="flex items-center gap-2">
                {form.parts.length > 1 && (
                  <button onClick={e => { e.stopPropagation(); removePart(pi) }}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
                {openParts[pi] ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>
            </div>

            {openParts[pi] && (
              <div className="p-5 space-y-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Sarlavha</label>
                    <input className="input" value={part.title}
                      onChange={e => setPart(pi, 'title', e.target.value)}
                      placeholder="International Club" style={{ userSelect: 'text' }} />
                  </div>
                  <div>
                    <label className="label">Yo'riqnoma</label>
                    <input className="input" value={part.description}
                      onChange={e => setPart(pi, 'description', e.target.value)}
                      placeholder="Questions 1–10: Complete the notes." style={{ userSelect: 'text' }} />
                  </div>
                </div>

                {form.type === 'reading' && (
                  <div>
                    <label className="label">Passage matni <span className="font-normal text-gray-400">(HTML qabul qilinadi)</span></label>
                    <textarea className="input min-h-32 resize-y text-xs font-mono" value={part.passage_text}
                      onChange={e => setPart(pi, 'passage_text', e.target.value)}
                      placeholder="<p>Passage matni...</p>" style={{ userSelect: 'text' }} />
                  </div>
                )}

                {/* Questions */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800 pb-2">
                    Savollar
                  </h3>
                  {part.questions.map((q, qi) => {
                    const qInfo = QTYPE_MAP[q.question_type]
                    return (
                      <div key={qi} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3 bg-gray-50/50 dark:bg-gray-800/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-brand bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
                            Savol {q.question_number}
                          </span>
                          {part.questions.length > 1 && (
                            <button onClick={() => removeQuestion(pi, qi)}
                              className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-400 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <label className="label text-xs">Savol turi</label>
                            <select className="input text-sm" value={q.question_type}
                              onChange={e => setQ(pi, qi, 'question_type', e.target.value)} style={{ userSelect: 'text' }}>
                              {QTYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            {qInfo && <p className="text-xs text-gray-400 mt-1">{qInfo.hint}</p>}
                          </div>
                          <div>
                            <label className="label text-xs">To'g'ri javob *</label>
                            <input className="input text-sm" value={q.correct_answer}
                              onChange={e => setQ(pi, qi, 'correct_answer', e.target.value)}
                              placeholder={q.question_type === 'multi_select' ? '["A","C"]' : 'mining'}
                              style={{ userSelect: 'text' }} />
                          </div>
                        </div>

                        <div>
                          <label className="label text-xs">Savol matni <span className="font-normal text-gray-400">(HTML qabul qilinadi)</span></label>
                          <textarea className="input text-sm min-h-12 resize-none" value={q.question_text}
                            onChange={e => setQ(pi, qi, 'question_text', e.target.value)}
                            placeholder="Savol matni..." style={{ userSelect: 'text' }} />
                        </div>

                        {NEEDS_OPTIONS.includes(q.question_type) && (
                          <JsonField
                            value={q.options || ''}
                            onChange={v => setQ(pi, qi, 'options', v)}
                          />
                        )}

                        <div>
                          <label className="label text-xs">Feedback <span className="font-normal text-gray-400">(izohlash)</span></label>
                          <input className="input text-sm" value={q.feedback}
                            onChange={e => setQ(pi, qi, 'feedback', e.target.value)}
                            placeholder="Bu savol bo'yicha izoh..." style={{ userSelect: 'text' }} />
                        </div>
                      </div>
                    )
                  })}

                  <button onClick={() => addQuestion(pi)}
                    className="w-full flex items-center gap-2 justify-center py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand/50 text-sm text-gray-500 dark:text-gray-400 hover:text-brand transition-all">
                    <Plus size={16} />Savol qo'shish
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        <button onClick={addPart}
          className="w-full flex items-center gap-2 justify-center py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand/50 text-sm text-gray-600 dark:text-gray-400 hover:text-brand transition-all font-medium">
          <Plus size={18} />Part qo'shish
        </button>
      </div>

      {/* Bottom save */}
      <div className="flex justify-end pb-6">
        <button onClick={submit} disabled={saving} className="btn-primary flex items-center gap-2 px-8">
          <Save size={18} />{saving ? 'Saqlanmoqda...' : isEdit ? 'Yangilash' : 'Yaratish'}
        </button>
      </div>
    </div>
  )
}
