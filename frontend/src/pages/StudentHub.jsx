import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  Mic, BookOpen, HelpCircle, ChevronRight, ChevronDown,
  Gem, Home as HomeIcon, ExternalLink, Sun, Moon, Flame, Lock, Crown, Zap, Ban, Monitor, Smartphone, Wifi, WifiOff,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { api } from '../api/client'
import { useChallenge } from '../hooks/useChallenge'

function parseUA(ua) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', icon: '💻' }
  const mobile = /mobile|android|iphone/i.test(ua)
  let browser = 'Unknown'
  if (/edg\//i.test(ua)) browser = 'Edge'
  else if (/opr\//i.test(ua) || /opera/i.test(ua)) browser = 'Opera'
  else if (/chrome/i.test(ua)) browser = 'Chrome'
  else if (/safari/i.test(ua)) browser = 'Safari'
  else if (/firefox/i.test(ua)) browser = 'Firefox'
  let os = 'Unknown'
  if (/iphone/i.test(ua)) os = 'iPhone'
  else if (/ipad/i.test(ua)) os = 'iPad'
  else if (/android/i.test(ua)) os = 'Android'
  else if (/windows/i.test(ua)) os = 'Windows'
  else if (/mac os/i.test(ua)) os = 'macOS'
  else if (/linux/i.test(ua)) os = 'Linux'
  return { browser, os, icon: mobile ? '📱' : '💻' }
}

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'Hozirgina'
  if (diff < 3600) return `${Math.floor(diff / 60)} daq oldin`
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`
  if (diff < 604800) return `${Math.floor(diff / 86400)} kun oldin`
  return new Date(dateStr).toLocaleDateString('uz-UZ')
}

const HERO_BG  = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1400&q=80'
const SPEAK_BG = 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80'
const QTYPE_BG = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80'
const VOCAB_BG = 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80'

const NAV = [{ icon: HomeIcon, label: 'Home', to: '/tests' }]

const MODULES = [
  {
    to: '/tests/speaking', bg: SPEAK_BG, overlay: 'rgba(40,5,5,0.55)',
    Icon: Mic, iconClr: '#ef4444', iconBg: 'rgba(239,68,68,0.18)',
    group: 'Speaking', title: 'Part 2 / 3', titleClr: '#ef4444',
    desc: 'Describe, compare, discuss and express your ideas with confidence.',
    btnBg: '#dc2626', stat: '24', statLbl: 'Recent Sessions',
    requiredPlan: 'basic',
  },
  {
    to: '/tests/question-types', bg: QTYPE_BG, overlay: 'rgba(10,5,30,0.6)',
    Icon: HelpCircle, iconClr: '#a78bfa', iconBg: 'rgba(167,139,250,0.18)',
    group: 'Speaking', title: 'Question Types', titleClr: '#a78bfa',
    desc: 'Get familiar with all question types and smart ways to answer naturally.',
    btnBg: '#7c3aed', stat: '15', statLbl: 'Question Sets',
    requiredPlan: 'basic',
  },
  {
    to: '/vocabulary', bg: VOCAB_BG, overlay: 'rgba(2,20,8,0.6)',
    Icon: BookOpen, iconClr: '#34d399', iconBg: 'rgba(52,211,153,0.18)',
    group: 'Topic Based', title: 'Vocabulary', titleClr: '#34d399',
    desc: 'Learn, practice and remember powerful vocabulary for every topic.',
    btnBg: '#059669', stat: '1200+', statLbl: 'Words',
    requiredPlan: 'basic',
  },
]

// Open Telegram links: use tg:// scheme on mobile to open app directly
function openExternal(url) {
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || !!window.navigator.standalone
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  if (isMobile || isPWA) {
    const tgMatch = url.match(/https?:\/\/t\.me\/([^?&#]+)/)
    if (tgMatch) {
      window.location.href = `tg://resolve?domain=${tgMatch[1]}`
      return
    }
    window.location.href = url
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

const PLAN_RANK = { none: 0, basic: 1, elite: 2 }
function hasAccess(userPlan, requiredPlan, userRole) {
  if (userRole === 'admin') return true
  return (PLAN_RANK[userPlan] ?? 0) >= (PLAN_RANK[requiredPlan] ?? 0)
}

const FEATURES = [
  { emoji: '📋', label: 'Real IELTS Questions', sub: 'Updated regularly' },
  { emoji: '🤖', label: 'AI-Powered Feedback',  sub: 'Get smarter every time' },
  { emoji: '📊', label: 'Track Your Progress',  sub: 'See your improvement' },
  { emoji: '🌐', label: 'Learn Anywhere',        sub: 'Mobile & desktop ready' },
]

// Color palettes
const dark = {
  pageBg:      '#0a0a0f',
  sidebarBg:   '#0d0d12',
  sidebarBdr:  'rgba(255,255,255,0.05)',
  topbarBg:    'rgba(10,10,15,0.92)',
  topbarBdr:   'rgba(255,255,255,0.04)',
  cardBg:      '#111115',
  cardBdr:     'rgba(255,255,255,0.05)',
  divider:     'rgba(255,255,255,0.07)',
  text:        '#fafafa',
  textSub:     '#e4e4e7',
  textMuted:   '#6b7280',
  textFaint:   '#52525b',
  navActive:   'rgba(124,58,237,0.18)',
  navActiveClr:'#a78bfa',
  navClr:      '#6b7280',
  toggleBg:    'rgba(255,255,255,0.04)',
  toggleBdr:   'rgba(255,255,255,0.08)',
  toggleActive:'rgba(255,255,255,0.12)',
  progressBg:  'rgba(12,12,18,0.88)',
  upgradeBg:   'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(59,130,246,0.08))',
  upgradeBdr:  'rgba(124,58,237,0.28)',
  upgradeDesc: '#52525b',
  upgradeBtnBg:'rgba(124,58,237,0.15)',
  upgradeBtnBdr:'rgba(124,58,237,0.35)',
}

const light = {
  pageBg:      '#f1f5f9',
  sidebarBg:   '#ffffff',
  sidebarBdr:  'rgba(0,0,0,0.08)',
  topbarBg:    'rgba(255,255,255,0.95)',
  topbarBdr:   'rgba(0,0,0,0.08)',
  cardBg:      '#ffffff',
  cardBdr:     'rgba(0,0,0,0.07)',
  divider:     'rgba(0,0,0,0.1)',
  text:        '#0f172a',
  textSub:     '#1e293b',
  textMuted:   '#64748b',
  textFaint:   '#94a3b8',
  navActive:   'rgba(124,58,237,0.1)',
  navActiveClr:'#7c3aed',
  navClr:      '#64748b',
  toggleBg:    'rgba(0,0,0,0.04)',
  toggleBdr:   'rgba(0,0,0,0.1)',
  toggleActive:'rgba(0,0,0,0.1)',
  progressBg:  'rgba(255,255,255,0.92)',
  upgradeBg:   'linear-gradient(135deg,rgba(124,58,237,0.08),rgba(59,130,246,0.05))',
  upgradeBdr:  'rgba(124,58,237,0.2)',
  upgradeDesc: '#94a3b8',
  upgradeBtnBg:'rgba(124,58,237,0.1)',
  upgradeBtnBdr:'rgba(124,58,237,0.25)',
}

/* ═══════════════════════════ ROOT ══════════════════════════════ */
export default function StudentHub() {
  const { user, theme } = useAuthStore()
  const [activeNav, setActiveNav] = useState('Home')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const isDark = theme === 'dark'
  const c = isDark ? dark : light
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h, { passive: true })
    return () => window.removeEventListener('resize', h)
  }, [])

  const { data: results = [] } = useQuery({
    queryKey: ['myResults'],
    queryFn: async () => (await api.myResults()).data,
  })

  const { streak: challengeStreak } = useChallenge()
  const lastBand = results[0]?.band_score ?? null
  const progress = results.length ? Math.min(Math.round((results.length / 20) * 100), 97) : 78

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: c.pageBg,
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      color: c.text, transition: 'background 0.2s, color 0.2s',
    }}>
      {!isMobile && <Sidebar active={activeNav} setActive={setActiveNav} c={c} isDark={isDark} onUpgrade={() => setShowUpgrade(true)} />}
      {showUpgrade && <UpgradeModal isDark={isDark} onClose={() => setShowUpgrade(false)} />}

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar user={user} lastBand={lastBand} streak={challengeStreak} c={c} isDark={isDark} isMobile={isMobile} onUpgrade={() => setShowUpgrade(true)} />

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: isMobile ? '12px 12px 0' : '24px 24px 0' }}>
            <Hero user={user} progress={progress} c={c} isDark={isDark} isMobile={isMobile} />
          </div>

          <div style={{ padding: isMobile ? '0 12px 16px' : '0 24px 20px' }}>
            <ChallengeBanner c={c} isDark={isDark} isMobile={isMobile} />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 10 : 14 }}>
              {MODULES.map((m, i) => (
                <ModuleCard key={i} {...m} locked={!hasAccess(user?.plan, m.requiredPlan, user?.role)} c={c} isDark={isDark} isMobile={isMobile} />
              ))}
            </div>
          </div>

          <FeatureStrip c={c} isMobile={isMobile} />

          {/* Mobile bottom nav */}
          {isMobile && (
            <div style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
              background: isDark ? 'rgba(13,13,18,0.97)' : 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(12px)',
              borderTop: `1px solid ${c.sidebarBdr}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-around',
              padding: '8px 16px 12px',
            }}>
              <Link to="/tests" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <HomeIcon size={20} color={c.navActiveClr} />
                <span style={{ fontSize: 10, color: c.navActiveClr, fontWeight: 600 }}>Home</span>
              </Link>
              <Link to="/my-results" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <Gem size={20} color={c.navClr} />
                <span style={{ fontSize: 10, color: c.navClr, fontWeight: 500 }}>Natijalar</span>
              </Link>
              <button onClick={() => openExternal('https://t.me/ieltsshokh')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <ExternalLink size={20} color={c.navClr} />
                <span style={{ fontSize: 10, color: c.navClr, fontWeight: 500 }}>Telegram</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════ SIDEBAR ════════════════════════════ */
function Sidebar({ active, setActive, c, isDark, onUpgrade }) {
  return (
    <aside style={{
      width: 196, minWidth: 196,
      background: c.sidebarBg,
      borderRight: `1px solid ${c.sidebarBdr}`,
      display: 'flex', flexDirection: 'column',
      padding: '20px 12px',
      transition: 'background 0.2s',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 24px' }}>
        <img
          src="/logo.png"
          alt="IELTSSHOKH"
          style={{
            height: 28, width: 'auto',
            filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)',
          }}
          onError={e => { e.target.style.display = 'none' }}
        />
        <div style={{ lineHeight: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: isDark ? '#ffffff' : '#0f172a', letterSpacing: 0.5 }}>IELTS</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: isDark ? '#ffffff' : '#0f172a', letterSpacing: 0.5 }}>SHOKH</span>
        </div>
        <MiniWave />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        {NAV.map(item => {
          const isActive = active === item.label
          return (
            <Link key={item.label} to={item.to} onClick={() => setActive(item.label)}
              style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 9, marginBottom: 1,
                background: isActive ? c.navActive : 'transparent',
                color: isActive ? c.navActiveClr : c.navClr,
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                transition: 'all 0.12s',
              }}>
                <item.icon size={15} />
                {item.label}
              </div>
            </Link>
          )
        })}

        <button onClick={() => openExternal('https://t.me/ieltsshokh')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%', display: 'block' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 9, marginBottom: 1,
            color: c.navClr, fontSize: 13, fontWeight: 400,
          }}>
            <ExternalLink size={15} /> IELTS Insights
          </div>
        </button>

        <button onClick={() => openExternal('https://t.me/shokh_shavkatovich')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%', display: 'block' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 9, marginBottom: 1,
            color: c.navClr, fontSize: 13, fontWeight: 400,
          }}>
            <ExternalLink size={15} /> Contact me
          </div>
        </button>
      </nav>

      {/* Upgrade card */}
      <div style={{
        background: c.upgradeBg,
        border: `1px solid ${c.upgradeBdr}`,
        borderRadius: 12, padding: '14px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
          <Gem size={14} color="#7c3aed" />
          <div>
            <div style={{ fontSize: 10, color: c.textMuted, fontWeight: 500 }}>Upgrade to</div>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#7c3aed', letterSpacing: 1 }}>ELITE</div>
          </div>
        </div>
        <p style={{ fontSize: 11, color: c.upgradeDesc, lineHeight: 1.55, margin: '0 0 10px' }}>
          Unlock all features, exclusive content and advanced analytics.
        </p>
        <button
          onClick={onUpgrade}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            border: 'none', borderRadius: 8, padding: '8px 12px', color: '#fff',
            fontSize: 11, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.3,
          }}>
          Go Elite <ChevronRight size={12} />
        </button>
      </div>
    </aside>
  )
}

function MiniWave() {
  const h = [3, 6, 10, 7, 12, 8, 5, 9, 6, 4]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {h.map((ht, i) => (
        <div key={i} style={{ width: 2, height: ht, background: '#7c3aed', borderRadius: 1 }} />
      ))}
    </div>
  )
}

/* ═══════════════════════════ TOP BAR ════════════════════════════ */
function TopBar({ user, lastBand, streak, c, isDark, isMobile, onUpgrade }) {
  const { toggleTheme } = useAuthStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['mySessions'],
    queryFn: () => api.mySessions().then(r => r.data),
    enabled: open,
    staleTime: 30000,
  })

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'flex-end',
      padding: isMobile ? '10px 16px' : '13px 28px', gap: isMobile ? 10 : 20,
      background: c.topbarBg, backdropFilter: 'blur(10px)',
      borderBottom: `1px solid ${c.topbarBdr}`, transition: 'background 0.2s',
    }}>
      {/* Mobile logo */}
      {isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/logo.png" alt="IELTSSHOKH" style={{ height: 24, width: 'auto', filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)' }} onError={e => { e.target.style.display = 'none' }} />
          <span style={{ fontSize: 13, fontWeight: 900, color: isDark ? '#ffffff' : '#0f172a', letterSpacing: 0.5 }}>IELTSSHOKH</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 20 }}>
      {/* Streak */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ fontSize: 20 }}>🔥</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: c.text, lineHeight: 1 }}>{streak || 0}</div>
          <div style={{ fontSize: 10, color: c.textFaint, fontWeight: 500, lineHeight: 1, marginTop: 2 }}>Day Streak</div>
        </div>
      </div>

      <div style={{ width: 1, height: 26, background: c.divider }} />

      {/* Theme toggle */}
      <button onClick={toggleTheme} style={{
        display: 'flex', alignItems: 'center', background: c.toggleBg,
        border: `1px solid ${c.toggleBdr}`, borderRadius: 999, padding: '4px 5px', gap: 2,
        cursor: 'pointer', transition: 'all 0.2s',
      }}>
        {[{ mode: 'light', Icon: Sun }, { mode: 'dark', Icon: Moon }].map(({ mode, Icon }) => {
          const active = isDark ? mode === 'dark' : mode === 'light'
          return (
            <div key={mode} style={{
              width: 28, height: 28, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: active ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)') : 'transparent',
              transition: 'all 0.2s',
            }}>
              <Icon size={14} color={active ? (isDark ? '#e4e4e7' : '#0f172a') : c.textFaint} />
            </div>
          )
        })}
      </button>

      <div style={{ width: 1, height: 26, background: c.divider }} />

      {/* User — Candidate details dropdown */}
      <div ref={ref} style={{ position: 'relative' }}>
        <div onClick={() => setOpen(o => !o)} style={{
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: user?.plan === 'elite'
              ? 'linear-gradient(135deg,#7c3aed,#4f46e5)'
              : user?.plan === 'basic'
                ? 'linear-gradient(135deg,#3b82f6,#2563eb)'
                : 'linear-gradient(135deg,#6b7280,#4b5563)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>
            {user?.username?.[0]?.toUpperCase() || 'S'}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, lineHeight: 1 }}>
              Candidate details
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
              {user?.plan === 'elite'
                ? <><Crown size={10} color="#7c3aed" /><span style={{ color: '#7c3aed' }}>Elite</span></>
                : user?.plan === 'basic'
                  ? <><Zap size={10} color="#3b82f6" /><span style={{ color: '#3b82f6' }}>Basic</span></>
                  : <><Ban size={10} color="#6b7280" /><span style={{ color: '#6b7280' }}>Free</span></>
              }
              {lastBand && <span style={{ color: c.textFaint }}>· Band {lastBand}</span>}
            </div>
          </div>
          <ChevronDown size={13} color={c.textFaint}
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>

        {/* Modal — portal to body so it covers everything */}
        {open && createPortal(
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 99999,
              backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
              background: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'relative',
                background: isDark ? '#16161e' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                borderRadius: 22, padding: '32px 20px 24px', width: '100%', maxWidth: 360,
                boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
              }}
            >
              {/* X close button — top right */}
              <button
                onClick={() => setOpen(false)}
                style={{
                  position: 'absolute', top: 14, right: 14,
                  width: 30, height: 30, borderRadius: '50%',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  color: isDark ? '#6b7280' : '#94a3b8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, cursor: 'pointer', lineHeight: 1,
                }}
              >×</button>

              {/* Avatar + title */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                  width: 68, height: 68, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#7c3aed,#3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 900, color: '#fff',
                  margin: '0 auto 14px',
                  boxShadow: '0 8px 28px rgba(124,58,237,0.45)',
                }}>
                  {user?.username?.[0]?.toUpperCase() || 'S'}
                </div>
                <div style={{ fontSize: 17, fontWeight: 900, color: isDark ? '#fafafa' : '#0f172a' }}>
                  Candidate Details
                </div>
                <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600, marginTop: 4 }}>
                  IELTSSHOKH Platform
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', marginBottom: 12 }} />

              {/* Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { label: 'Name',     value: user?.username || '—', icon: '👤' },
                  { label: 'Username', value: user?.username || '—', icon: '🔖' },
                  { label: 'Password', value: '••••••••',             icon: '🔒', mono: true },
                  { label: 'Plan',     value: user?.plan === 'elite' ? '👑 Elite' : user?.plan === 'basic' ? '⚡ Basic' : '🚫 Free', icon: '🎫' },
                  { label: 'Joined',   value: joinedDate,             icon: '📅' },
                ].map(({ label, value, icon, mono }) => (
                  <div key={label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 14px', borderRadius: 10,
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{icon}</span>
                      <span style={{ fontSize: 12, color: isDark ? '#6b7280' : '#64748b', fontWeight: 500 }}>{label}</span>
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: 700, color: isDark ? '#e4e4e7' : '#1e293b',
                      fontFamily: mono ? 'monospace' : 'inherit',
                      letterSpacing: mono ? 2 : 0,
                    }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Device history */}
              <div style={{ marginTop: 16 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
                  color: isDark ? '#52525b' : '#94a3b8',
                  marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Monitor size={11} /> ULANGAN QURILMALAR
                </div>
                {sessionsLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[1, 2].map(i => (
                      <div key={i} style={{ height: 52, borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', animation: 'pulse 1.5s infinite' }} />
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 12, color: isDark ? '#52525b' : '#94a3b8' }}>
                    Qurilma tarixi mavjud emas
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {sessions.map(s => {
                      const { browser, os, icon } = parseUA(s.user_agent)
                      return (
                        <div key={s.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 13px', borderRadius: 10,
                          background: s.is_active
                            ? (isDark ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.06)')
                            : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'),
                          border: s.is_active
                            ? `1px solid ${isDark ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.2)'}`
                            : `1px solid transparent`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <span style={{ fontSize: 18 }}>{icon}</span>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#e4e4e7' : '#1e293b', lineHeight: 1.2 }}>
                                {browser} · {os}
                              </div>
                              <div style={{ fontSize: 11, color: isDark ? '#6b7280' : '#94a3b8', marginTop: 2 }}>
                                {s.ip_address || '—'} · {timeAgo(s.created_at)}
                              </div>
                            </div>
                          </div>
                          {s.is_active ? (
                            <span style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 10, fontWeight: 700, color: '#7c3aed',
                              background: 'rgba(124,58,237,0.12)', padding: '3px 8px', borderRadius: 999,
                            }}>
                              <Wifi size={10} /> Faol
                            </span>
                          ) : (
                            <span style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 10, fontWeight: 600, color: isDark ? '#52525b' : '#94a3b8',
                            }}>
                              <WifiOff size={10} /> Tugagan
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
      </div>
    </header>
  )
}

/* ═══════════════════════════ HERO ═══════════════════════════════ */
function Hero({ user, progress, c, isMobile }) {
  return (
    <div style={{
      position: 'relative', borderRadius: 16, overflow: 'hidden',
      minHeight: isMobile ? 160 : 248, display: 'flex', alignItems: 'stretch', marginBottom: 14,
    }}>
      <img src={HERO_BG} alt="" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', filter: 'brightness(0.28) saturate(0.7)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(120deg,rgba(15,5,40,0.8) 0%,rgba(20,10,50,0.5) 55%,rgba(0,0,0,0.1) 100%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, flex: 1, padding: isMobile ? '24px 20px' : '32px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
          Welcome back,
        </p>
        <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: 900, lineHeight: 1.08, color: '#fff' }}>
          Let's make your<br />
          English sound{' '}
          <span style={{
            background: 'linear-gradient(135deg,#a78bfa,#818cf8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>elite.</span>
          <span style={{ display: 'block', width: 90, height: 3, marginTop: 6, background: 'linear-gradient(90deg,#7c3aed,transparent)', borderRadius: 2 }} />
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.38)' }}>
          Practice. Speak. Improve. Anytime, anywhere.
        </p>
      </div>

      {/* Progress card — hidden on mobile */}
      {!isMobile && <div style={{
        position: 'relative', zIndex: 1, margin: '20px 22px',
        background: c.progressBg,
        backdropFilter: 'blur(18px)',
        border: `1px solid ${c.cardBdr}`,
        borderRadius: 16, padding: '18px 20px',
        minWidth: 210, display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: c.textSub }}>Your Progress</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: c.textFaint }}>
            This Week <ChevronDown size={11} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <CircleProgress pct={progress} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 5 }}>Great progress!</div>
            <div style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.6 }}>
              Keep practicing daily<br />to reach your goal.
            </div>
            <Link to="/my-results" style={{ textDecoration: 'none' }}>
              <button style={{
                marginTop: 10, display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(124,58,237,0.14)', border: '1px solid rgba(124,58,237,0.32)',
                borderRadius: 7, padding: '6px 11px', color: '#a78bfa',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>
                View Progress <ChevronRight size={11} />
              </button>
            </Link>
          </div>
        </div>
      </div>}
    </div>
  )
}

function CircleProgress({ pct }) {
  const r = 36, circ = 2 * Math.PI * r, dash = (pct / 100) * circ
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="cpg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(124,58,237,0.1)" strokeWidth="7" />
      <circle cx="45" cy="45" r={r} fill="none" stroke="url(#cpg)" strokeWidth="7"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform="rotate(-90 45 45)" />
      <text x="45" y="50" textAnchor="middle" fontSize="17" fontWeight="800" fill="#7c3aed">{pct}%</text>
    </svg>
  )
}

/* ═══════════════════════════ MODULE CARD ════════════════════════ */
function ModuleCard({ to, bg, overlay, Icon, iconClr, iconBg, group, title, titleClr, desc, btnBg, stat, statLbl, locked, isMobile }) {
  const [hov, setHov] = useState(false)

  const card = (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      position: 'relative', borderRadius: 16, overflow: 'hidden',
      minHeight: isMobile ? 180 : 270, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      transform: !locked && hov ? 'translateY(-4px)' : 'none',
      boxShadow: !locked && hov ? '0 20px 40px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.15)',
      transition: 'transform 0.2s, box-shadow 0.2s', cursor: locked ? 'default' : 'pointer',
      opacity: locked ? 0.7 : 1,
    }}>
      <img src={bg} alt="" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', filter: locked ? 'brightness(0.18) saturate(0.3)' : 'brightness(0.38) saturate(0.65)',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: overlay }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.1) 55%,transparent 100%)' }} />

      {/* Lock overlay */}
      {locked && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: 'rgba(0,0,0,0.45)',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock size={22} color="rgba(255,255,255,0.7)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>Basic tarifdan</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Admin bilan bog'laning</div>
          </div>
        </div>
      )}

      <div style={{
        position: 'absolute', top: 18, left: 18, width: 42, height: 42, borderRadius: 11,
        background: iconBg, backdropFilter: 'blur(8px)', border: `1px solid ${iconClr}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={19} color={iconClr} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '18px 20px' }}>
        <p style={{ margin: '0 0 3px', fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{group}</p>
        <h3 style={{ margin: '0 0 9px', fontSize: 21, fontWeight: 900, color: titleClr, lineHeight: 1.15 }}>{title}</h3>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{desc}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <AudioWave />
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: locked ? 'rgba(255,255,255,0.1)' : btnBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {locked ? <Lock size={15} color="rgba(255,255,255,0.5)" /> : <ChevronRight size={17} color="#fff" />}
          </div>
        </div>
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 11, color: 'rgba(255,255,255,0.38)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: 'rgba(255,255,255,0.72)', fontWeight: 700 }}>{stat}</span> {statLbl}
        </div>
      </div>
    </div>
  )

  if (locked) return <div style={{ textDecoration: 'none', display: 'block' }}>{card}</div>
  return <Link to={to} style={{ textDecoration: 'none', display: 'block' }}>{card}</Link>
}

function AudioWave() {
  const h = [4, 8, 13, 9, 16, 8, 11, 5, 13, 9, 7, 13, 5, 9, 11, 7, 13]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {h.map((ht, i) => (
        <div key={i} style={{ width: 2.5, height: ht, background: 'rgba(255,255,255,0.28)', borderRadius: 1.5 }} />
      ))}
    </div>
  )
}

/* ═══════════════════════════ CHALLENGE BANNER ═══════════════════ */
function ChallengeBanner({ c, isDark, isMobile }) {
  const { isStarted, currentDay, streak, totalCompleted, todayChecked } = useChallenge()
  const pct = Math.round((totalCompleted / 30) * 100)

  return (
    <Link to="/tests/challenge" style={{ textDecoration: 'none', display: 'block', marginBottom: 14 }}>
      <div style={{
        background: 'linear-gradient(120deg,rgba(124,58,237,0.13) 0%,rgba(59,130,246,0.08) 100%)',
        border: '1px solid rgba(124,58,237,0.22)',
        borderRadius: 16, padding: isMobile ? '14px 14px' : '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: isMobile ? 8 : 16,
        transition: 'border-color 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: isMobile ? 26 : 34, flexShrink: 0 }}>🎯</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: c.text, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {isStarted ? `Day ${currentDay} / 30` : '30-Day Speaking Challenge'}
              {isStarted && (
                <>
                  <span style={{ color: c.textFaint, fontWeight: 400 }}>/</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', letterSpacing: 0.2 }}>
                    Study In Monster Mode, Achieve Monster Results!
                  </span>
                </>
              )}
            </div>
            <div style={{ fontSize: 12, color: c.textMuted }}>
              {isStarted
                ? `${totalCompleted} days done${todayChecked ? ' · ✓ Today complete' : ' · Practice today!'}`
                : 'Build a daily habit. Speak every day for 30 days.'
              }
            </div>
            {isStarted && (
              <div style={{ marginTop: 8, width: isMobile ? '100%' : 180, height: 4, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#7c3aed,#3b82f6)', borderRadius: 99 }} />
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {isStarted && streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 999, background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}>
              <Flame size={13} color="#f97316" />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#f97316' }}>{streak}</span>
            </div>
          )}
          <div style={{
            padding: isStarted ? '8px 14px' : '9px 16px',
            borderRadius: 10,
            background: isStarted ? 'rgba(124,58,237,0.12)' : 'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(59,130,246,0.15))',
            border: '1px solid rgba(124,58,237,0.28)',
            color: '#a78bfa', fontSize: 12, fontWeight: 800,
          }}>
            {isStarted ? <ChevronRight size={16} /> : 'Start →'}
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ═══════════════════════════ UPGRADE MODAL ══════════════════════ */
function UpgradeModal({ isDark, onClose }) {
  const { user } = useAuthStore()
  const [selected, setSelected] = useState('elite')
  const [copied, setCopied] = useState(false)

  const { data: cfg } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => api.getSettings().then(r => r.data),
    staleTime: 60000,
  })

  const cardNumber = cfg?.card_number || ''
  const cardHolder = cfg?.card_holder || ''
  const basicName  = cfg?.basic_name  || 'Basic'
  const eliteName  = cfg?.elite_name  || 'Elite'
  const basicPrice = cfg?.basic_price || '—'
  const elitePrice = cfg?.elite_price || '—'
  const tg = cfg?.telegram_username || 'shokh_shavkatovich'
  const note = cfg?.payment_note || ''
  const selectedPrice = selected === 'elite' ? elitePrice : basicPrice
  const selectedName  = selected === 'elite' ? eliteName  : basicName

  const copy = () => {
    if (!cardNumber) return
    navigator.clipboard.writeText(cardNumber.replace(/\s/g, ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const goTelegram = () => {
    const msg = `Salom! Men @${user?.username || ''} — ${selectedName} tarifiga to'lov qildim. Iltimos, tarifimni faollashtirib bering.`
    openExternal(`https://t.me/${tg}?text=${encodeURIComponent(msg)}`)
  }

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: isDark ? '#13131a' : '#ffffff',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
          borderRadius: 20, padding: '24px 18px', width: '100%', maxWidth: 420,
          boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
          position: 'relative', maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            width: 30, height: 30, borderRadius: '50%',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            color: isDark ? '#6b7280' : '#94a3b8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, cursor: 'pointer', fontWeight: 700,
          }}
        >×</button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(79,70,229,0.15))',
            border: '1px solid rgba(124,58,237,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', fontSize: 26,
          }}>💳</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: isDark ? '#fafafa' : '#0f172a' }}>
            Tarifni tanlang
          </div>
          <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600, marginTop: 4 }}>
            IELTSSHOKH Premium
          </div>
        </div>

        {/* Plan selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { id: 'basic', icon: '⚡', label: basicName, price: basicPrice, color: '#3b82f6', desc: 'Speaking, Vocabulary, Q-Types' },
            { id: 'elite', icon: '👑', label: eliteName, price: elitePrice, color: '#7c3aed', desc: `${basicName} + Listening & Reading`, hot: true },
          ].map(plan => (
            <div
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              style={{
                position: 'relative', padding: '14px 12px', borderRadius: 14, cursor: 'pointer',
                border: `2px solid ${selected === plan.id ? plan.color : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
                background: selected === plan.id
                  ? (isDark ? `${plan.color}18` : `${plan.color}0d`)
                  : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              {plan.hot && (
                <span style={{
                  position: 'absolute', top: -9, right: 8,
                  fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: 0.5,
                  background: 'linear-gradient(90deg,#7c3aed,#4f46e5)',
                  padding: '2px 7px', borderRadius: 999,
                }}>TOP</span>
              )}
              <div style={{ fontSize: 20, marginBottom: 6 }}>{plan.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: plan.color, marginBottom: 2 }}>{plan.label}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: isDark ? '#e4e4e7' : '#0f172a', marginBottom: 4 }}>
                {plan.price}
              </div>
              <div style={{ fontSize: 10, color: isDark ? '#6b7280' : '#94a3b8', lineHeight: 1.4 }}>
                {plan.desc}
              </div>
              {selected === plan.id && (
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 18, height: 18, borderRadius: '50%',
                  background: plan.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#fff', fontWeight: 900,
                }}>✓</div>
              )}
            </div>
          ))}
        </div>

        {/* Card number */}
        {cardNumber ? (
          <div style={{
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: 12, padding: '14px 16px', marginBottom: 16,
          }}>
            <div style={{ fontSize: 10, color: isDark ? '#6b7280' : '#94a3b8', fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>
              💳 TO'LOV KARTASI
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: 3, color: isDark ? '#fafafa' : '#0f172a', fontFamily: 'monospace' }}>
                  {cardNumber}
                </div>
                {cardHolder && (
                  <div style={{ fontSize: 11, color: isDark ? '#6b7280' : '#94a3b8', marginTop: 4 }}>{cardHolder}</div>
                )}
              </div>
              <button
                onClick={copy}
                style={{
                  padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 11,
                  background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(124,58,237,0.1)',
                  border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(124,58,237,0.25)'}`,
                  color: copied ? '#22c55e' : '#7c3aed', transition: 'all 0.2s',
                }}
              >
                {copied ? '✓ Nusxa' : 'Nusxa'}
              </button>
            </div>
            <div style={{
              marginTop: 12, paddingTop: 10,
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
              fontSize: 12, color: isDark ? '#e4e4e7' : '#1e293b', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>Jami to'lov:</span>
              <span style={{ color: '#7c3aed', fontWeight: 900 }}>{selectedPrice}</span>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12,
            color: '#f97316', fontWeight: 600, textAlign: 'center',
          }}>
            ⚠️ Karta raqami admin tomonidan kiritilmagan
          </div>
        )}

        {/* Steps */}
        <div style={{ marginBottom: 18 }}>
          {[
            `Yuqoridagi karta raqamiga ${selectedPrice} pul o'tkazing`,
            `To'lov chekini (screenshot) Telegramda @${tg} ga yuboring`,
            `Tarifingiz 24 soat ichida faollashtiriladi`,
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: '#7c3aed',
              }}>{i + 1}</div>
              <span style={{ fontSize: 12, color: isDark ? '#a1a1aa' : '#64748b', lineHeight: 1.5, paddingTop: 2 }}>{step}</span>
            </div>
          ))}
          {note && (
            <div style={{
              marginTop: 8, padding: '8px 12px', borderRadius: 8, fontSize: 11,
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              color: isDark ? '#71717a' : '#94a3b8', lineHeight: 1.55,
            }}>{note}</div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={goTelegram}
          style={{
            width: '100%', padding: '13px', borderRadius: 12, cursor: 'pointer',
            background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            border: 'none', color: '#fff', fontSize: 14, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
          }}
        >
          ✈️ To'lov qildim — Telegramga o'tish
        </button>
        <p style={{ fontSize: 10, color: isDark ? '#52525b' : '#94a3b8', textAlign: 'center', marginTop: 10 }}>
          @{tg} ga murojaat qiling
        </p>
      </div>
    </div>,
    document.body
  )
}

/* ═══════════════════════════ FEATURE STRIP ══════════════════════ */
function FeatureStrip({ c, isMobile }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 8 : 12, padding: isMobile ? '0 12px 88px' : '0 24px 28px' }}>
      {FEATURES.map((f, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: c.cardBg, border: `1px solid ${c.cardBdr}`,
          borderRadius: 12, padding: '14px 16px',
          transition: 'background 0.2s',
        }}>
          <span style={{ fontSize: 20 }}>{f.emoji}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: c.textSub, lineHeight: 1.25 }}>{f.label}</div>
            <div style={{ fontSize: 11, color: c.textFaint, marginTop: 2 }}>{f.sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
