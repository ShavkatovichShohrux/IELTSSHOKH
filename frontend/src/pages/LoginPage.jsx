import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'

const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

const CITY = (() => {
  const arr = []; let s = 1
  const clusters = [
    [32,25,11,9],[58,22,12,8],[74,28,10,8],
    [50,35,10,8],[28,40, 9,7],[62,42,11,9],
    [38,50, 8,7],[52,18, 9,6],[42,38,13,10],
    [78,36, 8,7],[24,52, 9,8],[66,55,10,8],
  ]
  while (arr.length < 300) {
    const ci = Math.floor(rnd(s++) * clusters.length) % clusters.length
    const [cx,cy,sx,sy] = clusters[ci]
    const gx = (rnd(s++)+rnd(s++)+rnd(s++)-1.5)/1.5
    const gy = (rnd(s++)+rnd(s++)+rnd(s++)-1.5)/1.5
    const x = cx+gx*sx, y = cy+gy*sy
    const dx=(x-50)/47, dy=(y-47)/47
    if (dx*dx+dy*dy>0.88) continue
    if (y>78 && rnd(s++)>0.28) continue
    arr.push({ x:+x.toFixed(2), y:+y.toFixed(2),
      r:+(0.22+rnd(s++)*1.2).toFixed(2), o:+(0.1+rnd(s++)*0.62).toFixed(2),
      dur:+(1.6+rnd(s++)*3.8).toFixed(2), delay:+(rnd(s++)*5).toFixed(2) })
  }
  return arr
})()

const STARS = (() => {
  const arr = []; let s = 200
  while (arr.length < 70) {
    const x=rnd(s++)*100, y=rnd(s++)*100
    if (x>26 && x<74 && y>28 && y<92) continue
    arr.push({ x:+x.toFixed(2), y:+y.toFixed(2),
      r:+(0.5+rnd(s++)*1.8).toFixed(2), dur:+(2+rnd(s++)*4.5).toFixed(2),
      delay:+(rnd(s++)*5).toFixed(2), o:+(0.25+rnd(s++)*0.6).toFixed(2) })
  }
  return arr
})()

const TNODES = [
  [22,20],[32,42],[40,36],[28,18],[38,12],[44,16],
  [50,18],[62,26],[56,14],[54,30],
  [68,16],[82,22],[86,34],[80,44],[66,42],
  [52,32],[58,66],[50,62],
  [28,44],[26,72],[34,76],[38,50],
  [70,60],[80,70],[84,64],[74,54],
  [35,34],[54,44],[68,28],[46,22],
]
const TEDGES = [
  [22,20,28,18],[28,18,32,42],[32,42,40,36],[40,36,22,20],
  [38,12,44,16],[38,12,28,18],[44,16,50,18],
  [50,18,56,14],[56,14,62,26],[62,26,54,30],[54,30,50,18],
  [68,16,82,22],[82,22,86,34],[86,34,80,44],[80,44,66,42],[66,42,68,16],
  [52,32,58,66],[58,66,50,62],[50,62,52,32],
  [28,44,34,76],[34,76,38,50],[38,50,28,44],[28,44,26,72],
  [70,60,80,70],[80,70,84,64],[84,64,74,54],[74,54,70,60],
  [40,36,50,18],[62,26,68,16],[66,42,52,32],
  [32,42,28,44],[54,30,52,32],[80,44,70,60],
  [40,36,35,34],[54,30,54,44],[62,26,68,28],[28,18,46,22],
]

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7FA0E6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconLock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7FA0E6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IconEye = ({ off }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8FA6D8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {off ? (
      <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/></>
    ) : (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>)}
  </svg>
)
const IconArrow = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)
const IconFingerprint = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5B87F0" strokeWidth="1.4" strokeLinecap="round">
    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/>
    <path d="M2 17.5c2.25 0 8.5-.5 8.5-5.5"/><path d="M5.45 5.11A7 7 0 0 1 19 12c-.06 2-.48 2.91-.52 3"/>
    <path d="M21.5 12A9.5 9.5 0 0 0 3 9.5"/><path d="M7 22c.9-3.3 1-5.5 1-9"/><path d="M9 12c0-2.21 1.79-4 4-4"/>
  </svg>
)
const IconDiamond = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5B87F0" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="6 3 18 3 22 9 12 22 2 9"/><line x1="2" y1="9" x2="22" y2="9"/>
    <line x1="12" y1="3" x2="6" y2="9"/><line x1="12" y1="3" x2="18" y2="9"/>
  </svg>
)

export default function LoginPage() {
  const [form, setForm]       = useState({ username: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate    = useNavigate()
  const location    = useLocation()
  const from        = location.state?.from?.pathname
  const sceneRef    = useRef(null)

  const submit = async e => {
    e.preventDefault()
    if (!form.username || !form.password) return toast.error("Barcha maydonlarni to'ldiring")
    setLoading(true)
    try {
      const res = await api.login(form)
      setAuth(res.data.user, res.data.access_token)
      toast.success(`Xush kelibsiz, ${res.data.user.username}!`)
      navigate(res.data.user.role === 'admin' ? '/admin' : from && from !== '/' ? from : '/tests', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login yoki parol noto'g'ri")
    } finally { setLoading(false) }
  }

  const onMove = e => {
    const el = sceneRef.current; if (!el) return
    const nx = (e.clientX/window.innerWidth  - 0.5)*2
    const ny = (e.clientY/window.innerHeight - 0.5)*2
    el.style.transform = `translate3d(${(-nx*10).toFixed(1)}px,${(-ny*8).toFixed(1)}px,0)`
  }
  const onLeave = () => { if (sceneRef.current) sceneRef.current.style.transform='translate3d(0,0,0)' }

  return (
    <div onMouseMove={onMove} onMouseLeave={onLeave} style={{
      position:'relative', minHeight:'100vh', width:'100%', overflow:'hidden',
      background:'#030A1A', color:'#fff',
      fontFamily:"'Inter',-apple-system,'Segoe UI',system-ui,sans-serif",
      WebkitFontSmoothing:'antialiased',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

        /* Fix browser autofill white background */
        .lg-input:-webkit-autofill,
        .lg-input:-webkit-autofill:hover,
        .lg-input:-webkit-autofill:focus,
        .lg-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px rgba(4,8,22,.9) inset !important;
          -webkit-text-fill-color: #EAF0FF !important;
          caret-color: #EAF0FF;
          transition: background-color 9999s ease-in-out 0s;
        }

        @keyframes lgTwinkle { 0%,100%{opacity:var(--o);}   50%{opacity:calc(var(--o)*.15);} }
        @keyframes lgSpin    { to{transform:translate(-50%,-50%) rotate(360deg);} }
        @keyframes lgSpinR   { to{transform:translate(-50%,-50%) rotate(-360deg);} }
        @keyframes lgFloat   { 0%,100%{transform:translateY(0) rotate(var(--r,0deg));}
                               50%{transform:translateY(-14px) rotate(calc(var(--r,0deg)+12deg));} }
        @keyframes lgAura    { 0%,100%{opacity:.55;} 50%{opacity:.92;} }
        @keyframes lgBeam    { 0%,100%{opacity:.45;} 50%{opacity:.95;} }
        @keyframes lgRingP   { 0%,100%{opacity:.5;transform:translate(-50%,-50%) scale(1);}
                               50%{opacity:.9;transform:translate(-50%,-50%) scale(1.04);} }
        @keyframes lgPlanet  { to{transform:translateX(-50%) rotate(360deg);} }
        @keyframes lgGlow    { 0%,100%{opacity:.65;transform:translate(-50%,-50%) scale(1);}
                               50%{opacity:1;transform:translate(-50%,-50%) scale(1.07);} }

        .lg-scene  { transition:transform .3s ease-out; will-change:transform; }
        .lg-input  { background:transparent;border:none;outline:none;flex:1;min-width:0;
                     color:#EAF0FF;font-size:15px;font-weight:400;font-family:inherit;height:100%; }
        .lg-input::placeholder { color:#8C97B8;font-weight:300; }
        .lg-field  { transition:border-color .2s,box-shadow .2s; }
        .lg-field:focus-within { border-color:rgba(90,140,255,.7)!important;
                     box-shadow:0 0 0 3px rgba(70,120,255,.18),0 0 30px rgba(50,110,255,.25)!important; }
        .lg-eye    { background:none;border:none;cursor:pointer;padding:4px;display:flex;align-items:center;opacity:.85; }
        .lg-eye:hover { opacity:1; }
        .lg-btn    { transition:transform .2s,box-shadow .2s,filter .2s; }
        .lg-btn:hover:not(:disabled) { transform:translateY(-2px);
                     box-shadow:0 18px 55px rgba(36,76,255,.58),0 0 32px rgba(60,140,255,.48)!important;
                     filter:brightness(1.08); }
        .lg-btn:active:not(:disabled) { transform:translateY(0); }
        .lg-link   { color:#6E93FF;text-decoration:none;transition:color .15s; }
        .lg-link:hover { color:#9DB8FF; }
        .lg-fcard  { transition:border-color .25s,box-shadow .25s,transform .25s; }
        .lg-fcard:hover { border-color:rgba(110,155,255,.5)!important;transform:translateY(-3px);
                     box-shadow:0 14px 44px rgba(0,0,0,.48),0 0 32px rgba(50,120,255,.16)!important; }

        @media (max-width:1180px){ .lg-side  { display:none!important; } }
        @media (max-width:900px) { .lg-vtext { display:none!important; } }
        @media (prefers-reduced-motion:reduce){
          .lg-star,.lg-sq,.lg-aura,.lg-beam,.lg-ring,.lg-planet,.lg-hud,.lg-glow { animation:none!important; }
        }
      `}</style>

      {/* ═══ SCENE ═══ */}
      <div ref={sceneRef} className="lg-scene" style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0}}>

        {/* Wide atmosphere bloom — pulsing */}
        <div className="lg-glow" style={{
          position:'absolute', left:'50%', top:'30vh', transform:'translate(-50%,-50%)',
          width:'230vh', height:'230vh', borderRadius:'50%',
          background:'radial-gradient(circle, rgba(18,88,255,.4) 0%, rgba(12,62,230,.22) 28%, rgba(8,42,180,.1) 52%, transparent 72%)',
          filter:'blur(55px)',
          animation:'lgGlow 8s ease-in-out infinite',
        }}/>

        {/* Static HUD rings */}
        {[74,94,114,134].map((sz,i)=>(
          <div key={i} style={{
            position:'absolute', left:'50%', top:'32vh', transform:'translate(-50%,-50%)',
            width:`${sz}vh`, height:`${sz}vh`, borderRadius:'50%',
            border:`1px solid rgba(100,165,255,${0.12-i*0.02})`,
          }}/>
        ))}

        {/* Rotating HUD rings */}
        {[{sz:106,dur:48,dir:'lgSpin'},{sz:130,dur:72,dir:'lgSpinR'}].map((r,i)=>(
          <div key={i} className="lg-hud" style={{
            position:'absolute', left:'50%', top:'32vh',
            width:`${r.sz}vh`, height:`${r.sz}vh`, borderRadius:'50%',
            border:'1px solid rgba(100,165,255,.07)',
            transform:'translate(-50%,-50%)',
            animation:`${r.dir} ${r.dur}s linear infinite`,
          }}>
            <div style={{
              position:'absolute', top:-3, left:'50%', marginLeft:-3,
              width:5, height:5, borderRadius:'50%',
              background:'#A8CCFF', boxShadow:'0 0 14px 4px rgba(110,195,255,.98)',
            }}/>
          </div>
        ))}

        {/* ═══ PLANET ═══ */}
        <div className="lg-planet" style={{
          position:'absolute', left:'50%', top:'-16vh', transform:'translateX(-50%)',
          width:'92vh', height:'92vh', borderRadius:'50%',
          background:'radial-gradient(circle at 50% 40%, #1C3F72 0%, #0E2750 28%, #081A3A 52%, #030D22 76%, #010610 100%)',
          boxShadow:[
            '0 0 0 2px rgba(90,195,255,.9)',
            '0 0 60px 22px rgba(50,178,255,1)',
            '0 0 150px 65px rgba(38,148,255,.85)',
            '0 0 320px 130px rgba(25,115,255,.65)',
            '0 0 560px 220px rgba(16,82,245,.45)',
            '0 0 900px 340px rgba(10,58,215,.25)',
            'inset 0 0 160px 40px rgba(5,18,68,.72)',
          ].join(','),
          overflow:'hidden',
          animation:'lgPlanet 240s linear infinite',
        }}>
          {/* SVG topology — digital globe overlay */}
          <svg viewBox="0 0 100 100" style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:.3}}>
            <path d="M22,20 L18,28 L22,38 L32,42 L40,36 L36,22 L28,18 Z" fill="rgba(55,130,255,.1)" stroke="rgba(110,195,255,.55)" strokeWidth="0.35"/>
            <path d="M38,12 L35,18 L40,20 L44,16 Z" fill="rgba(55,130,255,.09)" stroke="rgba(110,195,255,.45)" strokeWidth="0.3"/>
            <path d="M50,18 L48,26 L54,30 L62,26 L62,18 L56,14 Z" fill="rgba(55,130,255,.09)" stroke="rgba(110,195,255,.5)" strokeWidth="0.35"/>
            <path d="M52,32 L48,46 L50,62 L58,66 L64,56 L62,36 Z" fill="rgba(55,130,255,.08)" stroke="rgba(110,195,255,.42)" strokeWidth="0.3"/>
            <path d="M60,14 L68,16 L82,22 L86,34 L80,44 L66,42 L62,34 L58,22 Z" fill="rgba(55,130,255,.09)" stroke="rgba(110,195,255,.48)" strokeWidth="0.35"/>
            <path d="M28,44 L24,56 L26,72 L34,76 L40,66 L38,50 Z" fill="rgba(55,130,255,.08)" stroke="rgba(110,195,255,.38)" strokeWidth="0.3"/>
            <path d="M70,60 L72,68 L80,70 L84,64 L82,56 L74,54 Z" fill="rgba(55,130,255,.07)" stroke="rgba(110,195,255,.35)" strokeWidth="0.3"/>
            {TEDGES.map(([x1,y1,x2,y2],i)=>(
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(90,168,255,.28)" strokeWidth="0.22"/>
            ))}
            {TNODES.map(([cx,cy],i)=>(
              <circle key={i} cx={cx} cy={cy} r="0.75" fill="rgba(155,218,255,.94)"/>
            ))}
          </svg>

          {/* City lights */}
          {CITY.map((d,i)=>(
            <div key={i} className="lg-star" style={{
              position:'absolute', left:`${d.x}%`, top:`${d.y}%`,
              width:d.r, height:d.r, borderRadius:'50%',
              background:'#c4dcff', opacity:d.o, '--o':d.o,
              boxShadow:`0 0 ${d.r*2.2}px rgba(150,205,255,.75)`,
              animation:`lgTwinkle ${d.dur}s ease-in-out ${d.delay}s infinite`,
            }}/>
          ))}

          {/* Atmospheric rim */}
          <div style={{
            position:'absolute', inset:0, borderRadius:'50%',
            background:'radial-gradient(circle at 50% 50%, transparent 80%, rgba(22,132,255,.55) 83.5%, rgba(72,178,255,.9) 87.5%, rgba(150,228,255,1) 91%, rgba(200,242,255,1) 93.5%, rgba(128,198,255,.62) 97%, transparent 100%)',
          }}/>

          {/* Upper bloom (lit face) */}
          <div className="lg-aura" style={{
            position:'absolute', inset:0, borderRadius:'50%',
            background:'radial-gradient(ellipse 74% 40% at 50% 4%, rgba(175,225,255,.78) 0%, rgba(110,190,255,.45) 38%, transparent 68%)',
            animation:'lgAura 5.5s ease-in-out infinite',
          }}/>

          {/* Night-side shadow */}
          <div style={{
            position:'absolute', inset:0, borderRadius:'50%',
            background:'linear-gradient(to bottom, rgba(3,8,20,0) 32%, rgba(3,8,20,.44) 65%, rgba(3,8,20,.84) 100%)',
          }}/>
        </div>

        {/* Stars */}
        {STARS.map((s,i)=>(
          <div key={i} className="lg-star" style={{
            position:'absolute', left:`${s.x}%`, top:`${s.y}%`,
            width:s.r, height:s.r, borderRadius:'50%',
            background:'#dce8ff', opacity:s.o, '--o':s.o,
            boxShadow:`0 0 ${s.r*2.5}px rgba(150,198,255,.82)`,
            animation:`lgTwinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}/>
        ))}

        {/* Floating squares */}
        {[
          {x:'22%',y:'44%',s:9, dur:7,  delay:0,  rot:0 },
          {x:'76%',y:'42%',s:8, dur:8.5,delay:1.2,rot:45},
          {x:'89%',y:'67%',s:7, dur:9,  delay:.6, rot:0 },
          {x:'11%',y:'67%',s:6, dur:7.5,delay:1.8,rot:45},
          {x:'76%',y:'11%',s:5, dur:10, delay:2.4,rot:0 },
          {x:'20%',y:'18%',s:6, dur:8,  delay:.9, rot:45},
        ].map((q,i)=>(
          <div key={i} className="lg-sq" style={{
            position:'absolute', left:q.x, top:q.y, width:q.s, height:q.s,
            border:'1px solid rgba(95,158,255,.34)', background:'rgba(65,122,255,.07)',
            '--r':`${q.rot}deg`, transform:`rotate(${q.rot}deg)`,
            animation:`lgFloat ${q.dur}s ease-in-out ${q.delay}s infinite`,
          }}/>
        ))}

        {/* Blueprint dots */}
        <div style={{position:'absolute',top:'11%',right:'5.5%',width:46,height:46}}>
          {[0,1,2,3].flatMap(r=>[0,1,2,3].map(c=>(
            <div key={`${r}-${c}`} style={{
              position:'absolute', top:r*11.5, left:c*11.5,
              width:2.5, height:2.5, borderRadius:'50%',
              background:`rgba(100,165,255,${0.26+((r+c)%2)*0.12})`,
            }}/>
          )))}
        </div>
        <div style={{position:'absolute',top:'5%',right:'2.8%'}}>
          <div style={{width:24,height:1,background:'rgba(100,165,255,.32)',marginBottom:5}}/>
          <div style={{width:13,height:1,background:'rgba(100,165,255,.18)'}}/>
        </div>

        {/* Mountain silhouettes */}
        <svg viewBox="0 0 1440 300" preserveAspectRatio="none" style={{
          position:'absolute',bottom:0,left:0,width:'100%',height:'34vh',display:'block',
        }}>
          <path fill="rgba(3,9,24,.72)"  d="M0,235 L120,175 L230,205 L360,150 L470,190 L590,138 L700,178 L820,120 L940,165 L1060,112 L1180,158 L1300,110 L1440,150 L1440,300 L0,300Z"/>
          <path fill="rgba(2,7,18,.88)"  d="M0,262 L110,222 L215,244 L320,205 L430,236 L540,196 L650,228 L760,186 L880,222 L1000,180 L1120,216 L1240,176 L1360,210 L1440,188 L1440,300 L0,300Z"/>
          <path fill="#010610"           d="M0,300 L90,270 L180,286 L280,260 L380,282 L490,256 L600,278 L710,252 L820,274 L930,250 L1050,272 L1160,250 L1280,270 L1400,250 L1440,262 L1440,300Z"/>
          <path fill="none" stroke="rgba(50,145,255,.2)" strokeWidth="1.5"
            d="M0,300 L90,270 L180,286 L280,260 L380,282 L490,256 L600,278 L710,252 L820,274 L930,250 L1050,272 L1160,250 L1280,270 L1400,250 L1440,262"/>
        </svg>

        {/* Holographic platform */}
        <div style={{position:'absolute',bottom:'-3vh',left:'50%',transform:'translateX(-50%)',width:680,height:195}}>
          <div style={{
            position:'absolute',left:'50%',top:'30%',transform:'translateX(-50%)',
            width:3,height:105,
            background:'linear-gradient(to top, rgba(55,168,255,.82), rgba(95,212,255,.45), transparent)',
            filter:'blur(.4px)',
          }}/>
          <div className="lg-beam" style={{
            position:'absolute',left:'50%',top:'60%',transform:'translate(-50%,-50%)',
            width:14,height:14,borderRadius:'50%',
            background:'rgba(140,208,255,.98)',
            boxShadow:'0 0 30px 10px rgba(48,148,255,.72)',
            animation:'lgBeam 3s ease-in-out infinite',
          }}/>
          {[
            {w:640,h:158,o:.32,d:'0s'},{w:504,h:126,o:.42,d:'.28s'},
            {w:378,h: 95,o:.54,d:'.55s'},{w:260,h: 65,o:.66,d:'.82s'},
            {w:164,h: 41,o:.78,d:'1.06s'},{w: 86,h: 22,o:.90,d:'1.28s'},
          ].map((r,i)=>(
            <div key={i} className="lg-ring" style={{
              position:'absolute',left:'50%',top:'60%',transform:'translate(-50%,-50%)',
              width:r.w,height:r.h,borderRadius:'50%',
              border:`1px solid rgba(38,152,255,${r.o})`,
              boxShadow:`0 0 ${8+i*3}px rgba(35,142,255,${r.o*.48})`,
              animation:`lgRingP ${3.2+i*.38}s ease-in-out ${r.d} infinite`,
            }}/>
          ))}
        </div>

      </div>{/* /scene */}

      {/* ═══ UI ═══ */}

      {/* Header */}
      <div style={{position:'absolute',top:28,left:36,zIndex:10,display:'flex',alignItems:'center',gap:16}}>
        <div style={{width:34,height:1,background:'rgba(180,208,255,.4)'}}/>
        <div>
          <div style={{fontSize:16,fontWeight:500,letterSpacing:10,color:'#EAF0FF'}}>IELTSSHOKH</div>
          <div style={{fontSize:9,fontWeight:300,letterSpacing:5,color:'rgba(165,182,222,.76)',marginTop:5}}>MASTER YOUR SPEAKING</div>
        </div>
      </div>

      {/* Left vertical text */}
      <div className="lg-vtext" style={{
        position:'absolute',left:26,top:'50%',transform:'translateY(-50%)',zIndex:10,
        display:'flex',flexDirection:'column',alignItems:'center',
      }}>
        {['FOCUS','PRACTICE','ACHIEVE'].map((w,i)=>(
          <div key={w} style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
            {i>0 && <div style={{width:1,height:22,background:'rgba(100,162,255,.38)',margin:'6px 0'}}/>}
            <span style={{writingMode:'vertical-rl',textOrientation:'mixed',fontSize:9,fontWeight:400,letterSpacing:8,color:'rgba(165,182,222,.36)'}}>{w}</span>
          </div>
        ))}
      </div>

      {/* Center column */}
      <div style={{
        position:'relative',zIndex:10,minHeight:'100vh',
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        padding:'96px 20px 120px',
      }}>

        {/* Headline */}
        <div style={{textAlign:'center',marginBottom:34}}>
          <div style={{fontSize:13,fontWeight:500,letterSpacing:8,color:'#5D88FF',opacity:.9,marginBottom:20}}>
            WELCOME&nbsp;BACK
          </div>
          <h1 style={{
            margin:'0 0 16px',fontWeight:300,lineHeight:1.16,letterSpacing:'-0.5px',
            fontSize:'clamp(34px,4.6vw,64px)',color:'#fff',
            textShadow:'0 0 70px rgba(25,78,255,.38)',
          }}>
            Every step you take<br/>
            builds your <span style={{color:'#5B8CFF',fontWeight:400}}>future.</span>
          </h1>
          <p style={{margin:0,fontSize:18,fontWeight:300,color:'rgba(255,255,255,.72)',letterSpacing:'.4px'}}>
            Discipline today, success tomorrow.
          </p>
        </div>

        {/* Card */}
        <div style={{
          width:'min(560px,92vw)',borderRadius:28,
          background:'rgba(10,15,34,.6)',
          backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',
          border:'1px solid rgba(72,132,255,.28)',
          boxShadow:'0 0 80px rgba(22,75,225,.14),inset 0 1px 0 rgba(255,255,255,.05)',
          padding:'40px 44px 34px',
        }}>
          <form onSubmit={submit}>

            <div style={{marginBottom:22}}>
              <label style={{display:'block',fontSize:11,fontWeight:500,letterSpacing:2,color:'#A5AFD6',marginBottom:11}}>USERNAME</label>
              <div className="lg-field" style={{
                height:64,borderRadius:16,display:'flex',alignItems:'center',gap:12,padding:'0 18px',
                background:'rgba(4,8,22,.72)',border:'1px solid rgba(92,142,255,.24)',
              }}>
                <IconUser/>
                <input className="lg-input" type="text" placeholder="Enter your username"
                  value={form.username} onChange={e=>setForm(p=>({...p,username:e.target.value}))}
                  autoComplete="username"/>
              </div>
            </div>

            <div style={{marginBottom:30}}>
              <label style={{display:'block',fontSize:11,fontWeight:500,letterSpacing:2,color:'#A5AFD6',marginBottom:11}}>PASSWORD</label>
              <div className="lg-field" style={{
                height:64,borderRadius:16,display:'flex',alignItems:'center',gap:12,padding:'0 14px 0 18px',
                background:'rgba(4,8,22,.72)',border:'1px solid rgba(92,142,255,.24)',
              }}>
                <IconLock/>
                <input className="lg-input" type={showPw?'text':'password'} placeholder="Enter your password"
                  value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))}
                  autoComplete="current-password"/>
                <button type="button" className="lg-eye" onClick={()=>setShowPw(v=>!v)}
                  aria-label={showPw?'Hide password':'Show password'}>
                  <IconEye off={showPw}/>
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="lg-btn" style={{
              width:'100%',height:70,borderRadius:18,border:'none',
              cursor:loading?'wait':'pointer',
              background:'linear-gradient(180deg,#244CFF 0%,#1638D4 100%)',
              color:'#fff',position:'relative',
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:'0 8px 34px rgba(26,68,232,.52)',
            }}>
              <span style={{
                position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',
                width:48,height:48,borderRadius:'50%',
                border:'1.5px solid rgba(255,255,255,.55)',
                display:'flex',alignItems:'center',justifyContent:'center',
                boxShadow:'0 0 22px rgba(118,178,255,.56)',background:'rgba(255,255,255,.07)',
              }}>
                <IconArrow/>
              </span>
              <span style={{fontSize:14,fontWeight:500,letterSpacing:2}}>
                {loading?'KIRISH...':'ACCESS DASHBOARD'}
              </span>
            </button>

            <div style={{display:'flex',alignItems:'center',gap:14,margin:'22px 0 14px'}}>
              <div style={{flex:1,height:1,background:'rgba(88,142,255,.16)'}}/>
              <span style={{fontSize:12,color:'rgba(165,182,222,.52)'}}>or</span>
              <div style={{flex:1,height:1,background:'rgba(88,142,255,.16)'}}/>
            </div>
            <div style={{textAlign:'center',fontSize:13.5,color:'rgba(165,182,222,.82)'}}>
              Don't have an account? <a href="/register" className="lg-link" style={{fontWeight:500}}>Create one</a>
            </div>

          </form>
        </div>
      </div>

      {/* Feature cards */}
      <div className="lg-side lg-fcard" style={{
        position:'absolute',left:'3%',top:'64%',zIndex:10,
        display:'flex',alignItems:'center',gap:14,maxWidth:240,
        padding:'16px 20px',borderRadius:16,
        background:'rgba(7,12,28,.58)',backdropFilter:'blur(18px)',WebkitBackdropFilter:'blur(18px)',
        border:'1px solid rgba(88,142,255,.22)',
      }}>
        <div style={{width:46,height:46,borderRadius:12,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
          background:'rgba(28,82,192,.18)',border:'1px solid rgba(68,128,255,.24)'}}><IconFingerprint/></div>
        <div>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:1,color:'#DCE6FF',marginBottom:5}}>SECURE ACCESS</div>
          <div style={{fontSize:11.5,fontWeight:300,color:'rgba(165,182,222,.72)',lineHeight:1.45}}>Your data is 100% protected</div>
        </div>
      </div>

      <div className="lg-side lg-fcard" style={{
        position:'absolute',right:'3%',top:'64%',zIndex:10,
        display:'flex',alignItems:'center',gap:14,maxWidth:240,
        padding:'16px 20px',borderRadius:16,
        background:'rgba(7,12,28,.58)',backdropFilter:'blur(18px)',WebkitBackdropFilter:'blur(18px)',
        border:'1px solid rgba(88,142,255,.22)',
      }}>
        <div style={{width:46,height:46,borderRadius:12,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
          background:'rgba(28,82,192,.18)',border:'1px solid rgba(68,128,255,.24)'}}><IconDiamond/></div>
        <div>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:1,color:'#DCE6FF',marginBottom:5}}>PREMIUM CONTENT</div>
          <div style={{fontSize:11.5,fontWeight:300,color:'rgba(165,182,222,.72)',lineHeight:1.45}}>Top-quality IELTS materials</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{position:'absolute',bottom:20,right:32,zIndex:10}}>
        <p style={{margin:0,fontSize:11,fontWeight:300,letterSpacing:1,color:'rgba(165,182,222,.36)'}}>
          © 2026 <span style={{color:'#5B8CFF',fontWeight:500}}>IELTSSHOKH</span>. ALL RIGHTS RESERVED.
        </p>
      </div>

    </div>
  )
}
