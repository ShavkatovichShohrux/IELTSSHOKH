import { useEffect } from 'react'

// isAdmin=true bo'lsa: DevTools shortcuts, keyboard shortcuts bloklanmaydi
export function useCopyProtection(isAdmin = false) {
  useEffect(() => {
    if (isAdmin) return // admin uchun hech qanday bloklash yo'q

    const stop = e => e.preventDefault()

    const stopCopy = e => {
      e.clipboardData?.setData('text/plain', '')
      e.preventDefault()
    }

    const blockKeys = e => {
      // PrintScreen → clipboard clear
      if (e.key === 'PrintScreen') {
        e.preventDefault()
        navigator.clipboard?.writeText('').catch(() => {})
        return
      }
      // Ctrl combos
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase()
        // print, save, view-source
        if (['p', 's', 'u'].includes(k)) { e.preventDefault(); return }
        // DevTools: Ctrl+Shift+I/J/C/K
        if (e.shiftKey && ['i', 'j', 'c', 'k'].includes(k)) { e.preventDefault(); return }
      }
      // F12
      if (e.key === 'F12') { e.preventDefault(); return }
    }

    document.addEventListener('copy', stopCopy)
    document.addEventListener('cut', stopCopy)
    document.addEventListener('contextmenu', stop)
    document.addEventListener('selectstart', stop)
    document.addEventListener('dragstart', stop)
    document.addEventListener('keydown', blockKeys)

    return () => {
      document.removeEventListener('copy', stopCopy)
      document.removeEventListener('cut', stopCopy)
      document.removeEventListener('contextmenu', stop)
      document.removeEventListener('selectstart', stop)
      document.removeEventListener('dragstart', stop)
      document.removeEventListener('keydown', blockKeys)
    }
  }, [isAdmin])
}
