import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mic, Star, ExternalLink, ShieldCheck, Zap, MessageCircle } from 'lucide-react'
import { useLangStore } from '../store/langStore'
import { api } from '../api/client'

const TG_LINK = 'https://t.me/ieltsshokh'
const LOGO_URL = 'https://shavkatovichshohrux.github.io/ielts-audio/logo.png'

const LANGS = ['uz', 'en', 'ru']
const LANG_FLAGS = { uz: '🇺🇿', en: '🇺🇸', ru: '🇷🇺' }

export default function Landing() {
  const { lang, setLang, t } = useLangStore()
  const [dossiers, setDossiers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSpeakingDossiers()
      .then(r => {
        const getNum = s => parseInt((s || '').match(/\d+/)?.[0] ?? '9999', 10)
        const sorted = [...r.data].sort((a, b) => {
          const na = getNum(a.title_uz || a.title_en)
          const nb = getNum(b.title_uz || b.title_en)
          return na !== nb ? na - nb : a.id - b.id
        })
        setDossiers(sorted)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const titleKey = `title_${lang}`
  const descKey  = `description_${lang}`

  return (
    <div style={{ background: '#0a0b18', minHeight: '100vh', color: '#f1f2f8', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>

      {/* ── HEADER ── */}
      <header style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <a href={TG_LINK} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
          <img src={LOGO_URL} alt="IELTSSHOKH" style={{ height: 40, width: 'auto', filter: 'brightness(0) invert(1)' }} onError={e => { e.target.style.display='none' }} />
          <div>
            <span style={{ display: 'inline-block', padding: '3px 10px', border: '1.5px solid #c9a84c', borderRadius: 7, fontSize: 13, fontWeight: 800, letterSpacing: 1, color: '#c9a84c' }}>IELTSSHOKH</span>
            <div style={{ fontSize: 9, letterSpacing: 2, color: '#6b7280', fontWeight: 600, marginTop: 2, textTransform: 'uppercase' }}>Speaking Mastery</div>
          </div>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', background: '#13152a', border: '1px solid #2a2c40', borderRadius: 999, padding: 3, gap: 2 }}>
            {LANGS.map(l => (
              <button key={l} onClick={() => setLang(l)}
                style={{
                  border: 'none', borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
                  background: lang === l ? 'linear-gradient(135deg,#8a6bff,#4a6cf7)' : 'transparent',
                  color: lang === l ? '#fff' : '#9aa0b4',
                }}>
                {LANG_FLAGS[l]} {t(`lang_${l}`)}
              </button>
            ))}
          </div>
          <Link to="/login"
            style={{ fontSize: 12, fontWeight: 700, color: '#9aa0b4', textDecoration: 'none', padding: '7px 16px', border: '1px solid #2a2c40', borderRadius: 10, transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.color='#f1f2f8'; e.currentTarget.style.borderColor='#4a6cf7' }}
            onMouseLeave={e => { e.currentTarget.style.color='#9aa0b4'; e.currentTarget.style.borderColor='#2a2c40' }}>
            {t('admin_btn')}
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 28px 52px', textAlign: 'center' }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(124,92,255,0.12)', border: '1px solid rgba(124,92,255,0.28)', borderRadius: 999, padding: '6px 18px', marginBottom: 30 }}>
          <Mic size={13} color="#8a6bff" />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#8a6bff', letterSpacing: 1.2, textTransform: 'uppercase' }}>{t('hero_badge')}</span>
        </div>

        {/* Title */}
        <h1 style={{ margin: 0, fontSize: 'clamp(36px,7vw,68px)', fontWeight: 900, lineHeight: 1.06, letterSpacing: -1.5 }}>
          <span style={{ background: 'linear-gradient(135deg,#9b7dff 0%,#5b8cf7 60%,#38d9ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {t('hero_title')}
          </span>
          <br />
          <span style={{ color: '#f1f2f8' }}>{t('hero_title2')}</span>
        </h1>

        <p style={{ marginTop: 22, fontSize: 17, color: '#9aa0b4', lineHeight: 1.65, maxWidth: 540, margin: '22px auto 0' }}>
          {t('hero_sub')}
        </p>

        {/* Stars */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 26 }}>
          {[...Array(5)].map((_, i) => <Star key={i} size={15} fill="#c9a84c" color="#c9a84c" />)}
          <span style={{ marginLeft: 10, fontSize: 13, color: '#9aa0b4', fontWeight: 600 }}>IELTS Band 9 target</span>
        </div>

        {/* CTA */}
        <div style={{ marginTop: 36, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href={TG_LINK} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#8a6bff,#4a6cf7)', color: '#fff', fontSize: 14, fontWeight: 700, padding: '13px 28px', borderRadius: 14, textDecoration: 'none', transition: 'opacity .15s', boxShadow: '0 8px 32px rgba(124,92,255,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <MessageCircle size={16} />
            {t('contact_btn')}
          </a>
          <a href="#dossiers"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: '#9aa0b4', fontSize: 14, fontWeight: 700, padding: '13px 28px', borderRadius: 14, textDecoration: 'none', border: '1px solid #2a2c40', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#8a6bff'; e.currentTarget.style.color='#f1f2f8' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#2a2c40'; e.currentTarget.style.color='#9aa0b4' }}>
            {t('see_dossiers')}
          </a>
        </div>
      </section>

      {/* ── FEATURES ROW ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px 56px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
          {[
            { icon: <ShieldCheck size={20} color="#8a6bff" />, title: t('feat1_title'), sub: t('feat1_sub') },
            { icon: <Zap size={20} color="#c9a84c" />, title: t('feat2_title'), sub: t('feat2_sub') },
            { icon: <Mic size={20} color="#4a6cf7" />, title: t('feat3_title'), sub: t('feat3_sub') },
          ].map((f, i) => (
            <div key={i} style={{ background: '#13152a', border: '1px solid #1e2136', borderRadius: 16, padding: '20px 22px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}>{f.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f2f8', marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DOSSIERS GRID ── */}
      <section id="dossiers" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px 80px' }}>
        <h2 style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2.5, color: '#6b7280', textTransform: 'uppercase', marginBottom: 28, textAlign: 'center' }}>
          ✦ {t('available')} ✦
        </h2>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '48px 0' }}>{t('loading')}</p>
        ) : dossiers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ color: '#6b7280', marginBottom: 16 }}>{t('no_dossiers')}</p>
            <a href={TG_LINK} target="_blank" rel="noopener noreferrer"
              style={{ color: '#8a6bff', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
              @ieltsshokh ↗
            </a>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
            {dossiers.map(d => (
              <DossierCard key={d.id} dossier={d} titleKey={titleKey} descKey={descKey} t={t} />
            ))}
          </div>
        )}
      </section>

      {/* ── HOW TO BUY ── */}
      <section style={{ background: '#0d0f1f', padding: '56px 28px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2.5, color: '#6b7280', textTransform: 'uppercase', marginBottom: 10 }}>
            ✦ {t('how_title')} ✦
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 20, marginTop: 32 }}>
            {[t('step1'), t('step2'), t('step3')].map((s, i) => (
              <div key={i} style={{ background: '#13152a', border: '1px solid #1e2136', borderRadius: 16, padding: '20px 18px', textAlign: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#8a6bff,#4a6cf7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontWeight: 900, fontSize: 16 }}>{i + 1}</div>
                <p style={{ margin: 0, fontSize: 13, color: '#9aa0b4', lineHeight: 1.55 }}>{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid #1a1c2e', padding: '32px 28px', textAlign: 'center' }}>
        <a href={TG_LINK} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#8a6bff,#4a6cf7)', color: '#fff', fontSize: 14, fontWeight: 700, padding: '11px 24px', borderRadius: 12, textDecoration: 'none', marginBottom: 20, transition: 'opacity .15s' }}
          onMouseEnter={e => e.currentTarget.style.opacity='.85'}
          onMouseLeave={e => e.currentTarget.style.opacity='1'}>
          <ExternalLink size={14} />
          {t('buy_btn')}
        </a>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f1f2f8' }}>{t('footer')}</p>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6b7280' }}>
          {t('footer_sub')}{' '}
          <a href={TG_LINK} target="_blank" rel="noopener noreferrer" style={{ color: '#4a6cf7', textDecoration: 'none', fontWeight: 700 }}>@ieltsshokh</a>
        </p>
      </footer>
    </div>
  )
}

function DossierCard({ dossier, titleKey, descKey, t }) {
  const title = dossier[titleKey] || dossier.title_uz || dossier.title_en || '—'
  const desc  = dossier[descKey]  || dossier.description_uz || ''
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#13152a',
        border: `1px solid ${hovered ? 'rgba(124,92,255,0.45)' : '#1e2136'}`,
        borderRadius: 20, padding: '24px',
        display: 'flex', flexDirection: 'column', gap: 14,
        transform: hovered ? 'translateY(-5px)' : 'none',
        boxShadow: hovered ? '0 20px 48px rgba(124,92,255,0.18)' : 'none',
        transition: 'transform .2s, box-shadow .2s, border-color .2s',
      }}
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ background: 'rgba(124,92,255,0.15)', color: '#b89bff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>
          🎤 {t('part23')}
        </span>
        <span style={{ background: 'rgba(74,108,247,0.15)', color: '#8fa6ff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>
          {t('bands')}
        </span>
      </div>

      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.35, color: '#f1f2f8' }}>{title}</h3>

      {desc && <p style={{ margin: 0, fontSize: 13, color: '#9aa0b4', lineHeight: 1.6 }}>{desc}</p>}

      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid #1e2136' }}>
        {dossier.price ? (
          <div>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>{t('price_label')}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#c9a84c' }}>{dossier.price}</div>
          </div>
        ) : <div />}

        <a href={TG_LINK} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'linear-gradient(135deg,#8a6bff,#4a6cf7)', color: '#fff',
            fontSize: 13, fontWeight: 700, padding: '10px 18px', borderRadius: 12,
            textDecoration: 'none', transition: 'opacity .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <ExternalLink size={13} />
          {t('buy_btn')}
        </a>
      </div>
    </div>
  )
}
