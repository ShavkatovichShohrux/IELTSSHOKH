import { useRef, useState, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75]

function fmt(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function AudioPlayer({ src, title }) {
  const ref = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const audio = ref.current
    if (!audio) return
    const onTime = () => setCurrent(audio.currentTime)
    const onMeta = () => setDuration(audio.duration)
    const onLoaded = () => setLoaded(true)
    const onEnded = () => setPlaying(false)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('canplay', onLoaded)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('canplay', onLoaded)
      audio.removeEventListener('ended', onEnded)
    }
  }, [src])

  const toggle = async () => {
    const audio = ref.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { await audio.play().catch(() => {}); setPlaying(true) }
  }

  const seek = e => {
    const audio = ref.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = ratio * duration
  }

  const skip = s => {
    const audio = ref.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + s))
  }

  const changeVolume = e => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (ref.current) ref.current.volume = v
    setMuted(v === 0)
  }

  const toggleMute = () => {
    const audio = ref.current
    if (!audio) return
    const next = !muted
    setMuted(next)
    audio.muted = next
  }

  const changeSpeed = () => {
    const idx = SPEEDS.indexOf(speed)
    const next = SPEEDS[(idx + 1) % SPEEDS.length]
    setSpeed(next)
    if (ref.current) ref.current.playbackRate = next
  }

  const progress = duration ? (current / duration) * 100 : 0

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-md">
      <audio ref={ref} src={src} preload="auto" />

      <div className="max-w-4xl mx-auto px-4 py-2">
        {/* Title */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-brand text-white px-1.5 py-0.5 rounded text-xs font-black tracking-wider">IELTS</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-xs">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Volume */}
            <div className="flex items-center gap-1">
              <button onClick={toggleMute} className="text-gray-500 dark:text-gray-400 hover:text-brand transition-colors">
                {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                onChange={changeVolume}
                className="w-16 h-1 accent-brand cursor-pointer" style={{userSelect:'text'}}
              />
            </div>
            {/* Speed */}
            <button onClick={changeSpeed} className="text-xs font-bold text-brand bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
              {speed}x
            </button>
          </div>
        </div>

        {/* Controls + Progress */}
        <div className="flex items-center gap-3">
          <button onClick={() => skip(-5)} className="text-gray-600 dark:text-gray-400 hover:text-brand transition-colors" title="-5s">
            <SkipBack size={18} />
          </button>
          <button onClick={toggle} disabled={!loaded}
            className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center hover:bg-brand-dark transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
          <button onClick={() => skip(5)} className="text-gray-600 dark:text-gray-400 hover:text-brand transition-colors" title="+5s">
            <SkipForward size={18} />
          </button>

          {/* Progress bar */}
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right tabular-nums">{fmt(current)}</span>
            <div onClick={seek} className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer relative group">
              <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${progress}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-brand rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 w-10 tabular-nums">{fmt(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
