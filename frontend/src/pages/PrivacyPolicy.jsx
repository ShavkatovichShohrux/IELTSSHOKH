import { Link } from 'react-router-dom'

export default function PrivacyPolicy() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#05091a',
      fontFamily: "'Inter','Segoe UI',sans-serif",
      color: '#fff',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <Link to="/login" style={{
            fontSize: 12, letterSpacing: 2, color: 'rgba(74,144,255,.7)',
            textDecoration: 'none', fontWeight: 600,
          }}>← Orqaga</Link>
          <div style={{ marginTop: 28 }}>
            <div style={{ fontSize: 10, letterSpacing: 4, color: 'rgba(74,144,255,.6)', fontWeight: 600, marginBottom: 10 }}>
              IELTSSHOKH · SPEAKING
            </div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
              Maxfiylik siyosati
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,.35)' }}>
              Privacy Policy — Oxirgi yangilanish: 2026-yil iyul
            </p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(74,108,247,.15)', marginBottom: 36 }} />

        {/* Sections */}
        {[
          {
            title: '1. Qaysi ma\'lumotlar yig\'iladi',
            text: `Xizmatdan foydalanish uchun siz tomonidan taqdim etilgan username va parol (shifrlangan holda) saqlanadi. Tizimga kirish vaqti va faoliyat ma\'lumotlari texnik maqsadlarda qayd etiladi. Ism, manzil, telefon raqam yoki to\'lov ma\'lumotlari serverda saqlanmaydi.`,
          },
          {
            title: '2. Ma\'lumotlar qanday ishlatiladi',
            text: `Yig\'ilgan ma\'lumotlar faqat IELTSSHOKH platformasiga kirish huquqini ta\'minlash uchun ishlatiladi. Uchinchi shaxslarga, reklama tizimlariga yoki boshqa tashkilotlarga hech qanday ma\'lumot uzatilmaydi.`,
          },
          {
            title: '3. Kontent himoyasi',
            text: `Platformadagi barcha materiallar (audio, PDF, matnlar) mualliflik huquqi bilan himoyalangan. Ruxsatsiz nusxa ko\'chirish, tarqatish yoki sotish taqiqlanadi. Ilova ekran tasvirini olishni texnik jihatdan bloklaydi. Ushbu himoya foydalanuvchi akkaunti bilan bog\'liq holda amalga oshiriladi.`,
          },
          {
            title: '4. Akkаunt xavfsizligi',
            text: `Har bir akkаunt faqat bir foydalanuvchi uchun mo\'ljallangan. Loginni boshqalarga ulashish taqiqlanadi va akkаunt bloklashga olib kelishi mumkin. Parolni xavfsiz saqlash foydalanuvchi mas\'uliyatidadir.`,
          },
          {
            title: '5. To\'lovlar',
            text: `To\'lovlar to\'g\'ridan-to\'g\'ri administrator bilan amalga oshiriladi. Platforma hech qanday to\'lov ma\'lumotlarini (karta raqami va h.k.) saqlamaydi. To\'lov tasdiqlangandan keyin akkаunt yaratiladi.`,
          },
          {
            title: '6. Aloqa',
            text: `Savollar yoki murojaatlar uchun Telegram orqali bog\'laning. Maxfiylik siyosati o\'zgarishi haqida foydalanuvchilar Telegram kanal orqali xabardor qilinadi.`,
          },
        ].map((s, i) => (
          <div key={i} style={{ marginBottom: 32 }}>
            <h2 style={{
              margin: '0 0 10px',
              fontSize: 15, fontWeight: 700,
              color: '#fff', letterSpacing: 0.2,
            }}>{s.title}</h2>
            <p style={{
              margin: 0, fontSize: 14,
              color: 'rgba(255,255,255,.55)',
              lineHeight: 1.75,
            }}>{s.text}</p>
          </div>
        ))}

        {/* Footer */}
        <div style={{
          marginTop: 48,
          paddingTop: 24,
          borderTop: '1px solid rgba(74,108,247,.12)',
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,.2)', letterSpacing: 1 }}>
            © 2026 IELTSSHOKH. BARCHA HUQUQLAR HIMOYALANGAN.
          </p>
        </div>
      </div>
    </div>
  )
}
