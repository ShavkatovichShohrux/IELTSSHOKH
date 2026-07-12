import { useEffect } from 'react'

const flashBlack = () => {
  if (document.getElementById('__ss_guard')) return
  const el = document.createElement('div')
  el.id = '__ss_guard'
  el.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:2147483647',
    'background:#000', 'pointer-events:none',
    'display:flex', 'align-items:center', 'justify-content:center',
  ].join(';')
  el.innerHTML = '<span style="color:rgba(255,255,255,0.12);font-size:12px;font-family:sans-serif;letter-spacing:2px;text-transform:uppercase;">IELTSSHOKH · Protected</span>'
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 1800)
}

// isAdmin=true bo'lsa: nusxa/kontekst menyusi bloklanmaydi, lekin screenshot himoyasi HAMMA YERDA ishlaydi
export function useCopyProtection(isAdmin = false) {
  useEffect(() => {
    // Screenshot himoyasi — admin/user farqi yo'q, HAMMA SAHIFADA
    const onKeyDown = e => {
      if (
        e.key === 'PrintScreen' ||
        e.code === 'PrintScreen' ||
        e.keyCode === 44
      ) {
        e.preventDefault()
        flashBlack()
        navigator.clipboard?.writeText('').catch(() => {})
        return
      }
      if (isAdmin) return // Admindan keyin boshqa bloklarni o'tkazib yuborish

      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        const k = e.key.toLowerCase()
        if (['p', 's', 'u'].includes(k)) { e.preventDefault(); return }
        if (e.shiftKey && ['i', 'j', 'c', 'k'].includes(k)) { e.preventDefault(); return }
      }
      if (e.key === 'F12') { e.preventDefault(); return }
    }

    const onKeyUp = e => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44) {
        navigator.clipboard?.writeText('').catch(() => {})
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)

    if (!isAdmin) {
      const stop = e => e.preventDefault()
      const stopCopy = e => { e.clipboardData?.setData('text/plain', ''); e.preventDefault() }
      document.addEventListener('copy', stopCopy)
      document.addEventListener('cut', stopCopy)
      document.addEventListener('contextmenu', stop)
      document.addEventListener('selectstart', stop)
      document.addEventListener('dragstart', stop)

      return () => {
        document.removeEventListener('keydown', onKeyDown)
        document.removeEventListener('keyup', onKeyUp)
        document.removeEventListener('copy', stopCopy)
        document.removeEventListener('cut', stopCopy)
        document.removeEventListener('contextmenu', stop)
        document.removeEventListener('selectstart', stop)
        document.removeEventListener('dragstart', stop)
      }
    }

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [isAdmin])
}
