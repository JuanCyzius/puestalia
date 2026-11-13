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

/**
 * Para quien tiene la web abierta (por ejemplo, en una pestaña al costado en la compu):
 * cada 2 minutos se fija si entraron avisos nuevos. Si hay, pone "(3)" en el título de la pestaña,
 * muestra un aviso abajo y, si la persona ya dio permiso de notificaciones, saca una notificación de escritorio.
 */
export function NewJobsWatcher() {
  const [since, setSince] = useState('')
  const [found, setFound] = useState<{ count: number; first: { id: string; title: string } | null } | null>(null)
  const base = useState(() => (typeof document !== 'undefined' ? document.title.replace(/^\(\d+\)\s*/, '') : ''))[0]

  useEffect(() => { fetch('/api/jobs/new').then((r) => r.json()).then((j) => setSince(j.now)).catch(() => {}) }, [])

  useEffect(() => {
    if (!since) return
    let shown = 0
    const check = async () => {
      try {
        const j = await (await fetch('/api/jobs/new?since=' + encodeURIComponent(since))).json()
        if (!j.count) return
        setFound(j)
        document.title = `(${j.count}) ${base || document.title.replace(/^\(\d+\)\s*/, '')}`
        if (j.count > shown && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          const reg = await navigator.serviceWorker?.getRegistration()
          // Si este navegador ya recibe las notificaciones del servidor, no duplicamos.
          if (reg && !(await reg.pushManager?.getSubscription())) {
            reg.showNotification(j.count === 1 ? 'Nueva oferta en Puestalia' : `${j.count} ofertas nuevas en Puestalia`, {
              body: j.first ? j.first.title + (j.count > 1 ? ` y ${j.count - 1} más` : '') : '', icon: '/icon-192.png', badge: '/badge-96.png', tag: 'puestalia-tab', data: { url: j.count === 1 && j.first ? `/empleos/${j.first.id}` : '/' },
            })
          }
        }
        shown = j.count
      } catch {}
    }
    const t = setInterval(check, 120000)
    return () => clearInterval(t)
  }, [since, base])

  if (!found) return null
  const go = () => {
    document.title = base || document.title.replace(/^\(\d+\)\s*/, '')
    setFound(null); setSince(new Date().toISOString())
    location.href = found.count === 1 && found.first ? `/empleos/${found.first.id}` : '/'
  }
  return (
    <div className="newjobs" role="status">
      <span><b>{found.count === 1 ? 'Entró una oferta nueva' : `Entraron ${found.count} ofertas nuevas`}</b>{found.first ? ` · ${found.first.title}` : ''}</span>
      <button className="btn sm" onClick={go}>Ver</button>
      <button className="clear" aria-label="Cerrar" onClick={() => setFound(null)}>✕</button>
    </div>
  )
}
