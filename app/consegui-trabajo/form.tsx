'use client'
import { useState } from 'react'

export function HireForm() {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ t: string; err?: boolean } | null>(null)
  if (msg && !msg.err) return <p className="msg">{msg.t}</p>
  return (
    <form className="form" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true)
      const d = Object.fromEntries(new FormData(e.currentTarget))
      const r = await fetch('/api/hires', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...d, can_publish: d.can_publish === 'on' }) })
      const j = await r.json().catch(() => ({}))
      setMsg(r.ok ? { t: '¡Gracias! Ya quedó registrada tu historia.' } : { t: j.error || 'No se pudo guardar.', err: true }); setBusy(false)
    }}>
      <label>Tu nombre (como querés que aparezca)<input name="name" required maxLength={80} placeholder="Ej.: Sofía G." /></label>
      <label>Puesto que conseguiste<input name="role" required maxLength={120} /></label>
      <label>Empresa (opcional)<input name="company" maxLength={120} /></label>
      <label>Contanos cómo fue (opcional)<textarea name="testimonial" rows={4} maxLength={600} /></label>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" name="can_publish" style={{ width: 'auto' }} /> Autorizo a Puestalia a mostrar mi historia en la web</label>
      <button className="btn" disabled={busy}>{busy ? 'Enviando…' : 'Enviar'}</button>
      {msg?.err && <p className="msg err">{msg.t}</p>}
    </form>
  )
}
