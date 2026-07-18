import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'

/* ─── City-lights: Earth at night, viewed from ~35°E / 15°N ─────────── */
function makeCityLights() {
  const cx = 375, cy = 345, R = 338
  const dots = []
  // tiny seedable PRNG so dots are deterministic (no hydration mismatch)
  const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
  let s = 0

  // [centerNx, centerNy, spreadX, spreadY, count, maxOpacity]
  // ny negative = upper half of globe
  const C = [
    /* W/C Europe       */ [-0.17,-0.50, .16,.11, 85, .95],
    /* UK/Ireland       */ [-0.28,-0.57, .07,.05, 32, .90],
    /* Iberian Peninsula*/ [-0.25,-0.38, .06,.06, 18, .70],
    /* E Europe / Poland*/ [ 0.04,-0.47, .10,.08, 38, .75],
    /* Scandinavia      */ [-0.05,-0.68, .09,.05, 18, .55],
    /* Russia west      */ [ 0.15,-0.62, .14,.07, 22, .50],
    /* Turkey           */ [ 0.07,-0.36, .07,.05, 22, .70],
    /* Middle East      */ [ 0.18,-0.26, .12,.09, 40, .75],
    /* Nile corridor    */ [ 0.07,-0.18, .03,.09, 14, .65],
    /* N Africa coast   */ [-0.10,-0.22, .10,.03, 12, .50],
    /* Sub-Saharan W    */ [-0.13, 0.05, .07,.08,  9, .42],
    /* E Africa         */ [ 0.17, 0.14, .07,.10,  8, .42],
    /* Iran/Pakistan    */ [ 0.26,-0.28, .10,.07, 18, .58],
    /* India            */ [ 0.34,-0.08, .13,.17, 70, .88],
    /* Sri Lanka        */ [ 0.38, 0.22, .02,.02,  6, .72],
    /* Central Asia     */ [ 0.24,-0.50, .10,.06, 12, .42],
    /* China coast/East */ [ 0.54,-0.38, .10,.12, 55, .90],
    /* Beijing/N China  */ [ 0.48,-0.52, .08,.07, 32, .85],
    /* Japan            */ [ 0.63,-0.46, .06,.08, 42, .95],
    /* Korea            */ [ 0.57,-0.44, .04,.04, 22, .88],
    /* SE Asia/Vietnam  */ [ 0.52,-0.06, .10,.12, 32, .72],
    /* Indonesia/Java   */ [ 0.56, 0.10, .13,.05, 18, .62],
    /* Philippines      */ [ 0.62, 0.02, .05,.07, 12, .60],
    /* Australia east   */ [ 0.62, 0.32, .05,.09, 14, .65],
    /* US East Coast    */ [-0.66,-0.25, .07,.11, 20, .62],
    /* Random scatter   */ [ 0.00, 0.00, .82,.72, 70, .22],
  ]

  C.forEach(([nx, ny, sx, sy, cnt, maxO]) => {
    for (let i = 0; i < cnt; i++) {
      // Box-Muller Gaussian
      const u1 = Math.max(rnd(s++), 1e-6), u2 = rnd(s++)
      const gx = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      const gy = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2)
      const px = cx + (nx + gx * sx) * R
      const py = cy + (ny + gy * sy) * R * 0.88
      // must be inside globe circle
      const dx = (px - cx) / R, dy = (py - cy) / R
      if (dx*dx + dy*dy > 0.83) continue
      const r = 0.4 + rnd(s++) * 1.9
      const o = (0.28 + rnd(s++) * 0.72) * maxO
      dots.push({ x: +px.toFixed(1), y: +py.toFixed(1), r: +r.toFixed(2), o: +o.toFixed(3) })
    }
  })
  return dots
}
const DOTS = makeCityLights()

/* ─── SVG Icons ──────────────────────────────────────────────────────── */
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(100,160,255,.72)" strokeWidth="2" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(100,160,255,.72)" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(100,160,255,.55)" strokeWidth="2" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const IconEyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(100,160,255,.55)" strokeWidth="2" strokeLinecap="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)
const IconArrow = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)
const IconFP = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,255,.9)" strokeWidth="1.5" strokeLinecap="round">
    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
    <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
    <path d="M2 12a10 10 0 0 1 18-6"/>
    <path d="M2 17.5c2.25 0 8.5-.5 8.5-5.5"/>
    <path d="M5.45 5.11A7 7 0 0 1 19 12c-.06 2-.48 2.91-.52 3"/>
    <path d="M21.5 12A9.5 9.5 0 0 0 3 9.5"/>
    <path d="M7 22c.9-3.3 1-5.5 1-9"/>
    <path d="M9 12c0-2.21 1.79-4 4-4"/>
  </svg>
)
const IconDiamond = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,255,.9)" strokeWidth="1.5" strokeLinecap="round">
    <polygon points="6 3 18 3 22 9 12 22 2 9"/>
    <line x1="2" y1="9" x2="22" y2="9"/>
    <line x1="12" y1="3" x2="6" y2="9"/>
    <line x1="12" y1="3" x2="18" y2="9"/>
  </svg>
)

/* ─── Mountain SVG (3-layer depth) ──────────────────────────────────── */
const Mountains = () => (
  <svg viewBox="0 0 1440 280" preserveAspectRatio="none"
    style={{ width:'100%', height:'100%', display:'block' }}>
    {/* Far layer */}
    <path fill="rgba(4,10,28,.55)"
      d="M0,240 L70,190 L140,215 L220,165 L300,200 L390,148 L470,185 L560,132
         L640,168 L720,118 L810,155 L900,108 L990,148 L1080,100 L1170,140
         L1270,95 L1360,130 L1440,108 L1440,280 L0,280Z"/>
    {/* Mid layer */}
    <path fill="rgba(3,8,22,.80)"
      d="M0,260 L55,228 L115,245 L185,210 L270,238 L355,196 L440,224
         L530,188 L615,218 L700,178 L795,210 L880,172 L968,205 L1060,165
         L1150,198 L1240,162 L1340,192 L1440,170 L1440,280 L0,280Z"/>
    {/* Front layer */}
    <path fill="#020810"
      d="M0,280 L45,260 L90,270 L150,252 L215,265 L285,245 L355,260
         L425,240 L500,256 L575,236 L645,252 L715,232 L790,250 L865,230
         L940,248 L1020,228 L1100,245 L1185,226 L1265,244 L1360,226
         L1440,242 L1440,280Z"/>
  </svg>
)

export default function LoginPage() {
  const [form, setForm]     = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate    = useNavigate()
  const location    = useLocation()
  const from        = location.state?.from?.pathname

  const submit = async e => {
    e.preventDefault()
    if (!form.username || !form.password) return toast.error("Barcha maydonlarni to'ldiring")
    setLoading(true)
    try {
      const res = await api.login(form)
      setAuth(res.data.user, res.data.access_token)
      toast.success(`Xush kelibsiz, ${res.data.user.username}!`)
      navigate(
        res.data.user.role === 'admin' ? '/admin'
        : from && from !== '/' ? from : '/tests',
        { replace: true }
      )
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login yoki parol noto'g'ri")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes globeBreath {
          0%,100% {
            box-shadow:
              0 0 70px 18px rgba(0,80,255,.60),
              0 0 140px 35px rgba(0,60,200,.38),
              0 0 260px 60px rgba(0,40,160,.20),
              inset 0 0 90px 20px rgba(0,30,120,.35);
          }
          50% {
            box-shadow:
              0 0 100px 24px rgba(0,100,255,.80),
              0 0 200px 50px rgba(0,80,220,.50),
              0 0 360px 80px rgba(0,50,180,.28),
              inset 0 0 120px 25px rgba(0,40,140,.45);
          }
        }
        @keyframes ringGlow {
          0%,100%{ opacity:.48; transform:scale(1); }
          50%    { opacity:.78; transform:scale(1.025); }
        }
        @keyframes fl1{ 0%,100%{transform:translateY(0) rotate(0deg)}   50%{transform:translateY(-13px) rotate(18deg)} }
        @keyframes fl2{ 0%,100%{transform:translateY(0) rotate(45deg)}  50%{transform:translateY(-9px)  rotate(62deg)} }
        @keyframes fl3{ 0%,100%{transform:translateY(0) rotate(12deg)}  50%{transform:translateY(-16px) rotate(-6deg)} }
        @keyframes fl4{ 0%,100%{transform:translateY(0) rotate(-8deg)}  50%{transform:translateY(-11px) rotate(10deg)} }
        .lp-input {
          user-select:text!important; -webkit-user-select:text!important;
          width:100%; border-radius:10px;
          background:rgba(6,14,40,.82);
          border:1px solid rgba(50,90,200,.24);
          color:#d8e4ff; font-size:14px;
          box-sizing:border-box;
          transition:border-color .16s, box-shadow .16s;
        }
        .lp-input::placeholder{ color:rgba(120,155,220,.38); }
        .lp-input:focus{
          outline:none!important;
          border-color:rgba(60,120,255,.75)!important;
          box-shadow:0 0 0 3px rgba(50,100,255,.13)!important;
        }
        .lp-btn{
          transition:transform .18s, box-shadow .18s;
        }
        .lp-btn:hover:not(:disabled){
          transform:translateY(-2px);
          box-shadow:0 10px 40px rgba(30,90,255,.65)!important;
        }
        .lp-card{ transition:border-color .22s; }
        .lp-card:hover{ border-color:rgba(60,110,255,.40)!important; }
      `}</style>

      <div style={{
        minHeight:'100vh', position:'relative', overflow:'hidden',
        background:'#030a17',
        fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",
      }}>

        {/* ══ GLOBE ══════════════════════════════════════════════════ */}
        <div style={{
          position:'absolute',
          top:-90, left:'50%', transform:'translateX(-50%)',
          width:750, height:750,
          borderRadius:'50%',
          background:'radial-gradient(ellipse at 52% 36%, #0e2558 0%, #071232 28%, #030c22 55%, #010810 100%)',
          border:'1.5px solid rgba(40,100,255,.30)',
          animation:'globeBreath 5.5s ease-in-out infinite',
          zIndex:1, flexShrink:0,
        }}>

          {/* ── Latitude grid lines ── */}
          {[.30,.50,.68,.83].map((f,i) => (
            <div key={i} style={{
              position:'absolute',
              left:`${(1-f)*50}%`, top:`${(1-f)*50}%`,
              width:`${f*100}%`, height:`${f*100}%`,
              borderRadius:'50%',
              border:'1px solid rgba(60,120,255,.055)',
              pointerEvents:'none',
            }}/>
          ))}
          {/* ── Longitude lines (vertical stripes) ── */}
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{
              position:'absolute', top:'5%', left:`${20+i*15}%`,
              width:1, height:'90%',
              background:'rgba(60,120,255,.04)',
              pointerEvents:'none',
            }}/>
          ))}

          {/* ── City lights SVG ── */}
          <svg
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', borderRadius:'50%', overflow:'hidden' }}
            viewBox="0 0 750 690">
            {DOTS.map((d,i) => (
              <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#b8d0ff" opacity={d.o}/>
            ))}
            {/* super-bright city cores */}
            {[
              // London
              [264,152,2.5,.92],[258,148,1.5,.70],
              // Paris
              [278,158,2.2,.88],
              // NW Europe dense
              [295,145,2.8,.95],[308,140,2.2,.85],[288,163,1.8,.80],
              // Moscow
              [355,122,2.5,.82],[348,118,1.5,.70],
              // Cairo
              [342,208,2.0,.80],[338,216,1.5,.70],
              // Mumbai
              [408,272,2.8,.88],[418,265,1.8,.78],
              // Delhi
              [400,238,2.5,.85],[395,232,1.5,.70],
              // Tokyo
              [580,164,3.0,.95],[590,158,2.0,.85],[572,170,1.8,.78],
              // Seoul
              [558,168,2.2,.88],[550,174,1.5,.75],
              // Shanghai
              [548,196,2.8,.90],[558,202,1.8,.80],
              // Beijing
              [532,158,2.5,.88],[522,152,1.8,.78],
              // Singapore/KL
              [528,286,2.0,.80],[518,292,1.5,.70],
              // Bangkok
              [510,272,1.8,.75],
              // Sydney
              [588,338,2.0,.78],[596,345,1.5,.68],
              // Istanbul
              [320,198,1.8,.75],
              // Tehran
              [368,210,1.8,.72],
            ].map(([x,y,r,o],i) => (
              <circle key={`h${i}`} cx={x} cy={y} r={r} fill="white" opacity={o}/>
            ))}
          </svg>

          {/* ── Continent ambient glow (very subtle) ── */}
          {[
            { cx:'36%', cy:'22%', rw:'16%', rh:'10%', c:'rgba(80,140,255,.04)' }, // Europe
            { cx:'58%', cy:'40%', rw:'14%', rh:'16%', c:'rgba(80,140,255,.035)' }, // India
            { cx:'76%', cy:'28%', rw:'12%', rh:'12%', c:'rgba(80,140,255,.04)' }, // E Asia
          ].map((g,i) => (
            <div key={i} style={{
              position:'absolute',
              left:g.cx, top:g.cy,
              transform:'translate(-50%,-50%)',
              width:g.rw, height:g.rh,
              borderRadius:'50%',
              background:g.c,
              filter:'blur(20px)',
              pointerEvents:'none',
            }}/>
          ))}

          {/* ── Atmospheric rim (CRITICAL — bright blue edge) ── */}
          <div style={{
            position:'absolute', inset:0, borderRadius:'50%',
            background:`radial-gradient(circle at 50% 50%,
              transparent 58%,
              rgba(0,50,180,.00) 64%,
              rgba(0,70,210,.08) 70%,
              rgba(10,90,240,.28) 77%,
              rgba(30,120,255,.58) 84%,
              rgba(70,160,255,.82) 89%,
              rgba(140,200,255,.72) 93%,
              rgba(200,230,255,.35) 96%,
              transparent 100%
            )`,
            pointerEvents:'none',
          }}/>
          {/* Top atmospheric shimmer */}
          <div style={{
            position:'absolute', inset:0, borderRadius:'50%',
            background:'radial-gradient(ellipse 65% 28% at 50% 8%, rgba(80,160,255,.14) 0%, transparent 70%)',
            pointerEvents:'none',
          }}/>
        </div>

        {/* ══ MOUNTAINS ══════════════════════════════════════════════ */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0,
          height:252, zIndex:2, pointerEvents:'none',
        }}>
          <Mountains/>
        </div>

        {/* ══ HOLOGRAPHIC RINGS (screen bottom-center) ═══════════════ */}
        <div style={{
          position:'absolute', bottom:-55, left:'50%',
          transform:'translateX(-50%)',
          zIndex:3, pointerEvents:'none',
          width:700, height:180,
        }}>
          {/* central vertical beam */}
          <div style={{
            position:'absolute', left:'50%', top:20,
            transform:'translateX(-50%)',
            width:3, height:100,
            background:'linear-gradient(to top, rgba(50,140,255,.65), transparent)',
            filter:'blur(1px)',
          }}/>
          {/* center glow dot */}
          <div style={{
            position:'absolute', left:'50%', top:'60%',
            transform:'translate(-50%,-50%)',
            width:10, height:10, borderRadius:'50%',
            background:'rgba(80,160,255,.85)',
            boxShadow:'0 0 20px 8px rgba(40,120,255,.55)',
          }}/>
          {/* rings — outermost to innermost */}
          {[
            { w:680, h:180, op:.28, blur:0, delay:'0s',   dur:'3.8s' },
            { w:540, h:142, op:.38, blur:0, delay:'.25s', dur:'3.5s' },
            { w:410, h:108, op:.48, blur:0, delay:'.5s',  dur:'3.2s' },
            { w:295, h: 78, op:.60, blur:0, delay:'.75s', dur:'2.9s' },
            { w:195, h: 52, op:.72, blur:0, delay:'1s',   dur:'2.6s' },
            { w:105, h: 28, op:.85, blur:0, delay:'1.2s', dur:'2.4s' },
          ].map(({ w, h, op, delay, dur }, i) => (
            <div key={i} style={{
              position:'absolute', left:'50%', top:'55%',
              transform:'translate(-50%,-50%)',
              width:w, height:h,
              borderRadius:'50%',
              border:`1px solid rgba(40,130,255,${op})`,
              boxShadow:`0 0 ${6+i*2}px rgba(30,120,255,${op*0.4}), inset 0 0 ${4+i}px rgba(30,120,255,${op*0.15})`,
              animation:`ringGlow ${dur} ease-in-out ${delay} infinite`,
            }}/>
          ))}
        </div>

        {/* ══ FLOATING SHAPES ════════════════════════════════════════ */}
        {[
          { sz:13, top: '8%', left: '7%',  rot:  0, anim:'fl1', delay:'0s',    op:.22 },
          { sz:10, top:'14%', left:'87%',  rot: 45, anim:'fl2', delay:'.8s',   op:.18 },
          { sz:11, top:'48%', left: '4%',  rot: 12, anim:'fl3', delay:'1.4s',  op:.16 },
          { sz: 9, top:'52%', left:'93%',  rot: 45, anim:'fl4', delay:'.4s',   op:.20 },
          { sz: 7, top:'22%', left:'91%',  rot:  0, anim:'fl1', delay:'2.2s',  op:.15 },
          { sz:10, top:'75%', left:'88%',  rot: 45, anim:'fl2', delay:'1.0s',  op:.18 },
          { sz: 8, top:'68%', left: '6%',  rot:  8, anim:'fl3', delay:'.6s',   op:.14 },
          { sz: 6, top:'30%', left:'96%',  rot: 45, anim:'fl4', delay:'2.8s',  op:.14 },
        ].map(({ sz, top, left, rot, anim, delay, op }, i) => (
          <div key={i} style={{
            position:'absolute', top, left,
            width:sz, height:sz,
            border:`1.5px solid rgba(60,130,255,${op+.1})`,
            background:`rgba(50,110,255,${op*.25})`,
            transform:`rotate(${rot}deg)`,
            animation:`${anim} ${5.5+i*.6}s ease-in-out ${delay} infinite`,
            zIndex:2, pointerEvents:'none',
          }}/>
        ))}

        {/* ══ CORNER DOT GRIDS ═══════════════════════════════════════ */}
        {/* top-right */}
        <div style={{ position:'absolute', top:26, right:26, zIndex:2, pointerEvents:'none', width:36, height:36 }}>
          {[0,1,2,3].flatMap(r => [0,1,2,3].map(c => (
            <div key={`${r}-${c}`} style={{
              position:'absolute', top:r*9, left:c*9,
              width:2.2, height:2.2, borderRadius:'50%',
              background:`rgba(60,130,255,${.22+(r+c)%2*.08})`,
            }}/>
          )))}
        </div>
        {/* bottom-left */}
        <div style={{ position:'absolute', bottom:28, left:26, zIndex:4, pointerEvents:'none', width:26, height:26 }}>
          {[0,1,2].flatMap(r => [0,1,2].map(c => (
            <div key={`${r}-${c}`} style={{
              position:'absolute', top:r*9, left:c*9,
              width:2, height:2, borderRadius:'50%',
              background:`rgba(60,130,255,${.18+(r+c)%2*.06})`,
            }}/>
          )))}
        </div>

        {/* top-right tick marks */}
        <div style={{ position:'absolute', top:54, right:24, zIndex:2, pointerEvents:'none' }}>
          <div style={{ width:20, height:1, background:'rgba(60,130,255,.32)', marginBottom:4 }}/>
          <div style={{ width:12, height:1, background:'rgba(60,130,255,.18)' }}/>
        </div>

        {/* ══ PAGE CONTENT ═══════════════════════════════════════════ */}
        <div style={{
          position:'relative', zIndex:10,
          minHeight:'100vh', display:'flex', flexDirection:'column',
        }}>

          {/* ── Logo (top-left) ── */}
          <div style={{ padding:'22px 30px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:30, height:1.5, background:'rgba(160,195,255,.30)' }}/>
            <div>
              <div style={{
                fontSize:13.5, fontWeight:800, letterSpacing:4.5,
                color:'#dce8ff', lineHeight:1, marginBottom:4,
              }}>IELTSSHOKH</div>
              <div style={{ fontSize:8, letterSpacing:4, color:'rgba(100,155,255,.55)', fontWeight:600 }}>
                MASTER YOUR SPEAKING
              </div>
            </div>
          </div>

          {/* ── Vertical text (left) ── */}
          <div style={{
            position:'absolute', left:18, top:'50%',
            transform:'translateY(-50%)',
            display:'flex', flexDirection:'column', alignItems:'center', gap:0,
            zIndex:10,
          }}>
            {['FOCUS','PRACTICE','ACHIEVE'].map((w,i) => (
              <div key={w} style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                {i > 0 && (
                  <div style={{ width:1, height:20, background:'rgba(60,130,255,.22)', margin:'3px 0' }}/>
                )}
                <span style={{
                  writingMode:'vertical-rl', textOrientation:'mixed',
                  fontSize:8, fontWeight:700, letterSpacing:4,
                  color:'rgba(120,165,255,.28)',
                }}>
                  {w}
                </span>
              </div>
            ))}
          </div>

          {/* ── Center block: headline + card ── */}
          <div style={{
            flex:1, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            padding:'0 20px 16px',
          }}>

            {/* Headline */}
            <div style={{ textAlign:'center', marginBottom:22 }}>
              <div style={{
                fontSize:9.5, letterSpacing:6, fontWeight:700,
                color:'rgba(100,160,255,.68)', marginBottom:15,
              }}>
                WELCOME BACK
              </div>
              <h1 style={{
                margin:'0 0 13px', fontWeight:800, lineHeight:1.14,
                color:'#dce8ff', letterSpacing:-0.6,
                fontSize:'clamp(24px,3.4vw,43px)',
              }}>
                Every step you take<br/>
                builds your{' '}
                <span style={{ color:'#4a90ff' }}>future.</span>
              </h1>
              <p style={{
                margin:0, fontSize:11.5, letterSpacing:2.8,
                color:'rgba(130,170,255,.30)', fontWeight:500,
              }}>
                Discipline today, success tomorrow.
              </p>
            </div>

            {/* Card */}
            <div style={{
              width:'100%', maxWidth:450,
              background:'rgba(4,9,26,.90)',
              backdropFilter:'blur(26px)', WebkitBackdropFilter:'blur(26px)',
              border:'1px solid rgba(50,90,200,.20)',
              borderRadius:18,
              padding:'32px 34px 26px',
              boxShadow:'0 10px 70px rgba(0,0,12,.72), 0 0 50px rgba(30,70,200,.06)',
            }}>
              <form onSubmit={submit}>

                {/* USERNAME */}
                <div style={{ marginBottom:17 }}>
                  <label style={{
                    display:'block', fontSize:10, letterSpacing:2.8,
                    color:'rgba(160,195,255,.36)', fontWeight:700, marginBottom:9,
                  }}>USERNAME</label>
                  <div style={{ position:'relative' }}>
                    <span style={{
                      position:'absolute', left:14, top:'50%',
                      transform:'translateY(-50%)',
                      display:'flex', alignItems:'center', pointerEvents:'none',
                    }}>
                      <IconUser/>
                    </span>
                    <input
                      type="text"
                      placeholder="Enter your username"
                      value={form.username}
                      onChange={e => setForm(p=>({...p,username:e.target.value}))}
                      autoComplete="username"
                      className="lp-input"
                      style={{ padding:'13px 14px 13px 42px' }}
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div style={{ marginBottom:26 }}>
                  <label style={{
                    display:'block', fontSize:10, letterSpacing:2.8,
                    color:'rgba(160,195,255,.36)', fontWeight:700, marginBottom:9,
                  }}>PASSWORD</label>
                  <div style={{ position:'relative' }}>
                    <span style={{
                      position:'absolute', left:14, top:'50%',
                      transform:'translateY(-50%)',
                      display:'flex', alignItems:'center', pointerEvents:'none',
                    }}>
                      <IconLock/>
                    </span>
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={e => setForm(p=>({...p,password:e.target.value}))}
                      autoComplete="current-password"
                      className="lp-input"
                      style={{ padding:'13px 44px 13px 42px' }}
                    />
                    <button
                      type="button"
                      onClick={()=>setShowPw(v=>!v)}
                      style={{
                        position:'absolute', right:12, top:'50%',
                        transform:'translateY(-50%)',
                        background:'none', border:'none', cursor:'pointer',
                        padding:4, display:'flex', alignItems:'center',
                      }}
                    >
                      {showPw ? <IconEyeOff/> : <IconEye/>}
                    </button>
                  </div>
                </div>

                {/* Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="lp-btn"
                  style={{
                    width:'100%', padding:'14px 20px', borderRadius:11,
                    background:'linear-gradient(135deg, #1a5dff 0%, #1244d4 55%, #0f38b5 100%)',
                    border:'none', cursor:loading?'wait':'pointer',
                    color:'#fff', fontSize:11, fontWeight:800, letterSpacing:3.8,
                    display:'flex', alignItems:'center', justifyContent:'center', gap:14,
                    boxShadow:'0 4px 26px rgba(20,80,255,.45)',
                  }}
                >
                  <div style={{
                    width:34, height:34, borderRadius:'50%',
                    border:'2px solid rgba(255,255,255,.38)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    flexShrink:0,
                  }}>
                    <IconArrow/>
                  </div>
                  {loading ? 'KIRISH...' : 'ACCESS DASHBOARD'}
                </button>

                <div style={{ textAlign:'center', marginTop:18 }}>
                  <span style={{ fontSize:11.5, color:'rgba(120,160,255,.22)' }}>or</span>
                </div>
                <div style={{ textAlign:'center', marginTop:10, fontSize:12, color:'rgba(120,160,255,.32)' }}>
                  Don't have an account?{' '}
                  <a href="/register" style={{ color:'#4a90ff', fontWeight:600, textDecoration:'none' }}>
                    Create one
                  </a>
                </div>

              </form>
            </div>
          </div>

          {/* ── Bottom row ── */}
          <div style={{
            display:'flex', alignItems:'flex-end', justifyContent:'space-between',
            padding:'0 26px 22px', position:'relative', zIndex:5,
          }}>

            {/* SECURE ACCESS */}
            <div className="lp-card" style={{
              background:'rgba(4,9,26,.72)',
              backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
              border:'1px solid rgba(50,90,200,.18)',
              borderRadius:14, padding:'15px 18px',
              display:'flex', alignItems:'center', gap:14, maxWidth:218,
            }}>
              <div style={{
                width:46, height:46, borderRadius:11, flexShrink:0,
                background:'rgba(30,80,200,.14)',
                border:'1px solid rgba(50,100,200,.18)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <IconFP/>
              </div>
              <div>
                <div style={{ fontSize:10.5, fontWeight:800, color:'#c0d4ff', letterSpacing:1, marginBottom:5 }}>
                  SECURE ACCESS
                </div>
                <div style={{ fontSize:11.5, color:'rgba(120,160,255,.36)', lineHeight:1.5 }}>
                  Your data is 100%<br/>protected
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign:'center', paddingBottom:2 }}>
              <p style={{ margin:0, fontSize:10.5, color:'rgba(120,160,255,.18)', letterSpacing:1 }}>
                {'© 2026 '}
                <span style={{ color:'#4a90ff', fontWeight:700 }}>IELTSSHOKH</span>
                {'. ALL RIGHTS RESERVED.'}
              </p>
            </div>

            {/* PREMIUM CONTENT */}
            <div className="lp-card" style={{
              background:'rgba(4,9,26,.72)',
              backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
              border:'1px solid rgba(50,90,200,.18)',
              borderRadius:14, padding:'15px 18px',
              display:'flex', alignItems:'center', gap:14, maxWidth:218,
            }}>
              <div style={{
                width:46, height:46, borderRadius:11, flexShrink:0,
                background:'rgba(30,80,200,.14)',
                border:'1px solid rgba(50,100,200,.18)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <IconDiamond/>
              </div>
              <div>
                <div style={{ fontSize:10.5, fontWeight:800, color:'#c0d4ff', letterSpacing:1, marginBottom:5 }}>
                  PREMIUM CONTENT
                </div>
                <div style={{ fontSize:11.5, color:'rgba(120,160,255,.36)', lineHeight:1.5 }}>
                  Top-quality IELTS<br/>materials
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
