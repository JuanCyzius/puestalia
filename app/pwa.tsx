'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
let deferred: BIP | null = null
const listeners = new Set<() => void>()

/** Registra el service worker y guarda el aviso de instalación de Android/Chrome para usarlo con un botón propio. */
export function PwaSetup() {
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
    const onPrompt = (e: Event) => { e.preventDefault(); deferred = e as BIP; listeners.forEach((f) => f()) }
    const onInstalled = () => { deferred = null; listeners.forEach((f) => f()) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled) }
  }, [])
  return null
}

export const isStandalone = () =>
  typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true)
export const isIOS = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)

/** Botón "Instalar app": aparece solo cuando el navegador permite instalar (Android y Chrome de compu). */
export function InstallButton({ className = 'clear' }: { className?: string }) {
  const [, tick] = useState(0)
  useEffect(() => { const f = () => tick((n) => n + 1); listeners.add(f); return () => { listeners.delete(f) } }, [])
  if (!deferred) return null
  return (
    <button className={className} onClick={async () => { await deferred?.prompt(); deferred = null; tick((n) => n + 1) }}>
      Instalar app
    </button>
  )
}

/** Avisa al servidor que esta pestaña sigue abierta (para ver cuánta gente hay en vivo). Anónimo: un id al azar por navegador. */
export function Presence() {
  const path = usePathname()
  useEffect(() => {
    let id = ''
    try { id = localStorage.getItem('vid') || crypto.randomUUID(); localStorage.setItem('vid', id) } catch { id = crypto.randomUUID() }
    const ping = () => { if (document.visibilityState === 'visible') fetch('/api/ping', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ v: id, p: path }), keepalive: true }).catch(() => {}) }
    ping()
    const t = setInterval(ping, 60000)
    document.addEventListener('visibilitychange', ping)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', ping) }
  }, [path])
  return null
}
