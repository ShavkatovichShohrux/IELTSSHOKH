import { useEffect } from 'react'

const OVERLAY_ID = '__ielts_protect__'

function showBlackScreen(msg = 'IELTSSHOKH · Protected') {
  if (document.getElementById(OVERLAY_ID)) return
  const el = document.createElement('div')
  el.id = OVERLAY_ID
  el.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:2147483647',
    'background:#000', 'pointer-events:none',
    'display:flex', 'align-items:center', 'justify-content:center',
  ].join(';')
  el.innerHTML = `<span style="color:rgba(255,255,255,0.1);font-size:11px;font-family:monospace;letter-spacing:3px;text-transform:uppercase;">${msg}</span>`
  document.body.appendChild(el)
}

function hideBlackScreen() {
  document.getElementById(OVERLAY_ID)?.remove()
}

function flashBlackOnce(durationMs = 1600) {
  showBlackScreen()
  navigator.clipboard?.writeText('').catch(() => {})
  setTimeout(hideBlackScreen, durationMs)
}

// Screen share / recording interception via getDisplayMedia
function interceptScreenCapture() {
  if (!navigator.mediaDevices?.getDisplayMedia) return
  const original = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices)
  navigator.mediaDevices.getDisplayMedia = async function (constraints) {
    showBlackScreen('Screen capture is not allowed')
    let stream
    try {
      stream = await original(constraints)
    } catch {
      // User cancelled or denied — restore immediately
      hideBlackScreen()
      throw new Error('Screen capture blocked')
    }
    // Keep overlay active while sharing is running
    stream.getTracks().forEach(track => {
      track.addEventListener('ended', hideBlackScreen)
    })
    return stream
  }
}

// isAdmin=true → nusxa/kontekst menyusi ruxsat, lekin screenshot bloklash HAMMA JOYDA
export function useCopyProtection(isAdmin = false) {
  useEffect(() => {
    // Apply screen capture interception once globally
    interceptScreenCapture()

    const onKeyDown = e => {
      const isPrintScreen =
        e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44
      if (isPrintScreen) {
        e.preventDefault()
        flashBlackOnce()
        return
      }
      if (isAdmin) return

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
      const stopCopy = e => {
        e.clipboardData?.setData('text/plain', '')
        e.preventDefault()
      }
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
