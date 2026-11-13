'use client'
import { useEffect, useState } from 'react'

type S = {
  live: number | null; liveLogged: number; livePages: [string, number][]; today: number | null; week: number | null
  users: number; usersToday: number; premium: number; sales30: number; revenue30: number
  pushSubs: number | null; jobsLive: number | null; jobsQueued: number | null; jobsToday: number | null; at: string; error?: string
}
const n = (v: number | null | undefined) => (v == null ? '—' : v.toLocaleString('es-AR'))

/** Métricas del panel: gente en vivo (se actualiza cada 20 segundos), visitas, cuentas, ventas y avisos. */
export function Stats() {
  const [s, setS] = useState<S | null>(null)
  useEffect(() => {
    const load = () => fetch('/api/admin/stats').then((r) => r.json()).then(setS).catch(() => {})
    load()
    const t = setInterval(load, 20000)
    return () => clearInterval(t)
  }, [])
  if (!s) return <section className="stats"><p className="note">Cargando métricas…</p></section>
  if (s.error) return <section className="stats"><p className="msg err">{s.error}</p></section>
  return (
    <section className="stats" aria-label="Métricas">
      <div className="live">
        <span className="dot" aria-hidden />
        <b>{n(s.live)}</b>
        <span>{s.live === 1 ? 'persona en la web ahora' : 'personas en la web ahora'}{s.liveLogged ? ` · ${s.liveLogged} con cuenta` : ''}</span>
      </div>
      {s.livePages.length > 0 && <p className="pages">{s.livePages.map(([p, c]) => `${p} (${c})`).join(' · ')}</p>}
      <dl className="grid">
        <div><dt>Visitantes hoy</dt><dd>{n(s.today)}</dd></div>
        <div><dt>Últimos 7 días</dt><dd>{n(s.week)}</dd></div>
        <div><dt>Cuentas</dt><dd>{n(s.users)} <small>+{s.usersToday} hoy</small></dd></div>
        <div><dt>Premium activos</dt><dd>{n(s.premium)}</dd></div>
        <div><dt>Ventas 30 días</dt><dd>{n(s.sales30)} <small>${s.revenue30.toLocaleString('es-AR')}</small></dd></div>
        <div><dt>Celulares con avisos</dt><dd>{n(s.pushSubs)}</dd></div>
        <div><dt>Avisos online</dt><dd>{n(s.jobsLive)} <small>+{n(s.jobsToday)} hoy</small></dd></div>
        <div><dt>En cola</dt><dd>{n(s.jobsQueued)}</dd></div>
      </dl>
      <p className="note">Se actualiza solo cada 20 segundos. "En vivo" = navegadores con la web abierta en el último par de minutos. Un "—" significa que falta correr etapa3.sql.</p>
    </section>
  )
}
