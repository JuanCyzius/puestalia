'use client'
import { useEffect, useState } from 'react'

/** Cuánto falta, con minutos: "2 d 5 h 12 min", "5 h 3 min", "12 min". */
export function fmtLeft(ms: number) {
  const m = Math.max(0, Math.ceil(ms / 60000))
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60
  return [d && `${d} d`, (d || h) && `${h} h`, `${mm} min`].filter(Boolean).join(' ')
}

/** Cuenta regresiva que se actualiza sola hasta que el aviso se libera gratis. */
export function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])
  const ms = new Date(to).getTime() - (now ?? new Date(to).getTime() - 1)
  if (now !== null && ms <= 0) return <span className="cd done">ya se liberó · recargá la página</span>
  return <span className="cd" suppressHydrationWarning>{now === null ? '…' : fmtLeft(ms)}</span>
}
