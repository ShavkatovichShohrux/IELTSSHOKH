/* Renders any question type from the database */

export default function QuestionBlock({ question, value, onChange, showResult, disabled }) {
  const { question_number: num, question_type: type, question_text: text, options } = question

  const inputCls = (val, correct) => {
    if (!showResult) return 'border-gray-300 dark:border-gray-600 focus:border-brand focus:ring-brand/30'
    const isCorrect = normalizeAns(val) === normalizeAns(correct)
    return isCorrect
      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
      : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
  }

  const correctAns = showResult ? question.correct_answer : null

  // ── Text input ──────────────────────────────────────────────────────────
  if (type === 'text') {
    return (
      <div className="flex items-start gap-3 py-2">
        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-6 pt-2 flex-shrink-0">{num}</span>
        <div className="flex-1">
          {text && <p className="text-sm text-gray-700 dark:text-gray-300 mb-1" dangerouslySetInnerHTML={{ __html: text }} />}
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            placeholder="Javobingiz..."
            className={`input text-sm max-w-xs ${inputCls(value, correctAns)}`}
            style={{ userSelect: 'text' }}
          />
          {showResult && correctAns && normalizeAns(value) !== normalizeAns(correctAns) && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              To'g'ri javob: <strong>{correctAns}</strong>
            </p>
          )}
          {showResult && question.feedback && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{question.feedback}</p>
          )}
        </div>
      </div>
    )
  }

  // ── Radio ────────────────────────────────────────────────────────────────
  if (type === 'radio') {
    const opts = Array.isArray(options) ? options : []
    return (
      <div className="py-2">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-6 flex-shrink-0 pt-0.5">{num}</span>
          {text && <p className="text-sm text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: text }} />}
        </div>
        <div className="ml-8 space-y-1.5">
          {opts.map(opt => {
            const label = opt.label || opt
            const optText = opt.text || opt
            const checked = value === label
            const isCorrect = showResult && normalizeAns(label) === normalizeAns(correctAns)
            const isWrong = showResult && checked && !isCorrect
            return (
              <label key={label} className={`flex items-start gap-2 cursor-pointer rounded-lg px-2 py-1.5 transition-colors
                ${isCorrect ? 'bg-green-50 dark:bg-green-900/20' : ''}
                ${isWrong ? 'bg-red-50 dark:bg-red-900/20' : ''}
                ${!showResult && !disabled ? 'hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
              `}>
                <input type="radio" name={`q${num}`} value={label} checked={checked}
                  onChange={() => !disabled && onChange(label)}
                  className="mt-0.5 accent-brand flex-shrink-0"
                  style={{ userSelect: 'text' }}
                />
                <span className={`text-sm ${isCorrect ? 'text-green-700 dark:text-green-300 font-medium' : isWrong ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  <strong>{label}.</strong> {typeof optText === 'string' ? optText : optText.text || ''}
                </span>
              </label>
            )
          })}
        </div>
        {showResult && question.feedback && (
          <p className="ml-8 text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{question.feedback}</p>
        )}
      </div>
    )
  }

  // ── Select / dropdown ────────────────────────────────────────────────────
  if (type === 'select' || type === 'match') {
    const opts = Array.isArray(options) ? options : []
    return (
      <div className="flex items-start gap-3 py-2">
        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-6 pt-2 flex-shrink-0">{num}</span>
        <div className="flex-1">
          {text && <p className="text-sm text-gray-700 dark:text-gray-300 mb-1.5" dangerouslySetInnerHTML={{ __html: text }} />}
          <select
            value={value || ''}
            onChange={e => !disabled && onChange(e.target.value)}
            disabled={disabled}
            className={`input text-sm max-w-xs ${inputCls(value, correctAns)}`}
            style={{ userSelect: 'text' }}
          >
            <option value="">— tanlang —</option>
            {opts.map(opt => {
              const label = opt.label || opt
              const optText = opt.text || opt
              return <option key={label} value={label}>{label}. {typeof optText === 'string' ? optText : ''}</option>
            })}
          </select>
          {showResult && correctAns && normalizeAns(value) !== normalizeAns(correctAns) && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">To'g'ri: <strong>{correctAns}</strong></p>
          )}
        </div>
      </div>
    )
  }

  // ── Multi-select (choose TWO) ────────────────────────────────────────────
  if (type === 'multi_select') {
    const opts = Array.isArray(options) ? options : []
    const selected = Array.isArray(value) ? value : []
    const correct = Array.isArray(correctAns) ? correctAns : []

    const toggle = label => {
      if (disabled) return
      if (selected.includes(label)) onChange(selected.filter(v => v !== label))
      else if (selected.length < 2) onChange([...selected, label])
    }

    return (
      <div className="py-2">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-6 flex-shrink-0">{num}</span>
          {text && <p className="text-sm text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: text }} />}
        </div>
        <div className="ml-8 space-y-1.5">
          {opts.map(opt => {
            const label = opt.label || opt
            const optText = opt.text || label
            const checked = selected.includes(label)
            const isCorrect = showResult && correct.includes(label)
            const isWrong = showResult && checked && !isCorrect
            return (
              <label key={label} className={`flex items-start gap-2 cursor-pointer rounded-lg px-2 py-1.5 transition-colors
                ${isCorrect ? 'bg-green-50 dark:bg-green-900/20' : ''}
                ${isWrong ? 'bg-red-50 dark:bg-red-900/20' : ''}
                ${!showResult && !disabled ? 'hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
              `}>
                <input type="checkbox" checked={checked} onChange={() => toggle(label)}
                  className="mt-0.5 accent-brand flex-shrink-0" style={{ userSelect: 'text' }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>{label}.</strong> {typeof optText === 'string' ? optText : ''}
                </span>
              </label>
            )
          })}
        </div>
      </div>
    )
  }

  // ── True / False / Not Given ─────────────────────────────────────────────
  if (type === 'tfng' || type === 'yn') {
    const choices = type === 'yn' ? ['YES', 'NO', 'NOT GIVEN'] : ['TRUE', 'FALSE', 'NOT GIVEN']
    return (
      <div className="py-2">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-6 flex-shrink-0">{num}</span>
          {text && <p className="text-sm text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: text }} />}
        </div>
        <div className="ml-8 flex gap-2 flex-wrap">
          {choices.map(c => {
            const isSelected = value === c
            const isCorrect = showResult && normalizeAns(c) === normalizeAns(correctAns)
            const isWrong = showResult && isSelected && !isCorrect
            return (
              <button key={c} type="button"
                onClick={() => !disabled && onChange(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                  ${isSelected && !showResult ? 'bg-brand text-white border-brand' : ''}
                  ${isCorrect ? 'bg-green-500 text-white border-green-500' : ''}
                  ${isWrong ? 'bg-red-500 text-white border-red-500' : ''}
                  ${!isSelected && !isCorrect ? 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-brand hover:text-brand' : ''}
                `}
              >{c}</button>
            )
          })}
        </div>
        {showResult && correctAns && normalizeAns(value) !== normalizeAns(correctAns) && (
          <p className="ml-8 text-xs text-green-600 dark:text-green-400 mt-1">To'g'ri: <strong>{correctAns}</strong></p>
        )}
      </div>
    )
  }

  // Fallback
  return (
    <div className="py-2 flex gap-3">
      <span className="text-xs font-bold text-gray-400 w-6">{num}</span>
      <p className="text-sm text-gray-500">Unknown question type: {type}</p>
    </div>
  )
}

function normalizeAns(v) {
  if (v === null || v === undefined) return ''
  return String(v).trim().toLowerCase()
}
