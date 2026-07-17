import { useAuthStore } from '../store/authStore'

const ROWS = 7
const COLS = 5

export default function UserWatermark() {
  const { user } = useAuthStore()
  if (!user) return null

  const text = `${user.username} · IELTSSHOKH`

  return (
    <div className="watermark select-none" aria-hidden="true">
      {Array.from({ length: ROWS }, (_, r) =>
        Array.from({ length: COLS }, (_, c) => (
          <span
            key={`${r}-${c}`}
            style={{
              position: 'absolute',
              top: `${(r / ROWS) * 100 + 3}%`,
              left: `${(c / COLS) * 100 - 2}%`,
              transform: 'rotate(-28deg)',
              fontSize: 11,
              fontFamily: 'monospace',
              color: 'rgba(128,128,128,0.07)',
              whiteSpace: 'nowrap',
              letterSpacing: 1,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {text}
          </span>
        ))
      )}
    </div>
  )
}
