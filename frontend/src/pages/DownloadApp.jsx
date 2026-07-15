import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, ShieldCheck, Smartphone, ArrowLeft, CheckCircle2 } from 'lucide-react'

const APK_URL = '/downloads/ieltsshokh.apk'
const APK_SIZE = '4.4 MB'
const APK_VERSION = '1.1'

export default function DownloadApp() {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = () => {
    setDownloading(true)
    setTimeout(() => setDownloading(false), 2000)
  }

  return (
    <div style={{ background: '#0a0b18', minHeight: '100vh', color: '#f1f2f8', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <header style={{ maxWidth: 720, margin: '0 auto', padding: '18px 28px' }}>
        <Link to="/speaking" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9aa0b4', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
          <ArrowLeft size={15} /> Bosh sahifa
        </Link>
      </header>

      <section style={{ maxWidth: 560, margin: '0 auto', padding: '24px 28px 80px', textAlign: 'center' }}>
        <img src="/icon-512.png" alt="IELTSSHOKH" style={{ width: 96, height: 96, borderRadius: 24, marginBottom: 24, boxShadow: '0 12px 40px rgba(124,92,255,0.25)' }} />

        <h1 style={{ margin: 0, fontSize: 'clamp(28px,6vw,38px)', fontWeight: 900, letterSpacing: -1 }}>
          <span style={{ background: 'linear-gradient(135deg,#9b7dff 0%,#5b8cf7 60%,#38d9ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            IELTSSHOKH
          </span>{' '}
          Android ilovasi
        </h1>
        <p style={{ marginTop: 14, fontSize: 15, color: '#9aa0b4', lineHeight: 1.6 }}>
          Speaking testlarini, savol turlarini va vokabulyarni endi mobil ilova orqali ham mashq qiling.
        </p>

        <a
          href={APK_URL}
          download="ieltsshokh.apk"
          onClick={handleDownload}
          style={{
            marginTop: 32, display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'linear-gradient(135deg,#8a6bff,#4a6cf7)', color: '#fff',
            fontSize: 16, fontWeight: 700, padding: '16px 36px', borderRadius: 16,
            textDecoration: 'none', boxShadow: '0 10px 36px rgba(124,92,255,0.35)', transition: 'opacity .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Download size={19} />
          {downloading ? 'Yuklanmoqda...' : 'APK yuklab olish'}
        </a>

        <p style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>
          v{APK_VERSION} · {APK_SIZE} · Android 7.0+
        </p>

        <div style={{ marginTop: 44, background: '#13152a', border: '1px solid #1e2136', borderRadius: 18, padding: '24px 26px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Smartphone size={17} color="#8a6bff" />
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.5 }}>O'rnatish bo'yicha qo'llanma</span>
          </div>
          {[
            'Yuqoridagi tugma orqali APK faylni yuklab oling.',
            'Fayl menejerda ieltsshokh.apk ustiga bosing.',
            '"Noma\'lum manbalar" (Install unknown apps) ruxsatini so\'rasa — yoqing.',
            '"O\'rnatish" tugmasini bosing va kuting.',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: i < 3 ? 14 : 0 }}>
              <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: 'rgba(124,92,255,0.15)', color: '#b89bff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                {i + 1}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#9aa0b4', lineHeight: 1.55 }}>{step}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#6b7280', fontSize: 12 }}>
          <ShieldCheck size={14} />
          <span>Play Store'dan tashqarida tarqatiladi, shu sabab telefon "noma'lum manba" haqida ogohlantiradi — bu normal holat.</span>
        </div>

        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#4ade80', fontSize: 12, fontWeight: 600 }}>
          <CheckCircle2 size={14} />
          <span>Login talab qilinmaydi — bu sahifa ochiq</span>
        </div>
      </section>
    </div>
  )
}
