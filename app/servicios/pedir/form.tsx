'use client'
import { useState } from 'react'

/** Formulario del pedido: datos, puesto buscado y CV. Al enviarlo, va a pagar a Mercado Pago. */
export function OrderForm({ initial, options }: { initial: string; options: Record<string, string> }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  return (
    <form className="form" style={{ marginTop: 20 }} onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setErr('')
      const r = await fetch('/api/orders', { method: 'POST', body: new FormData(e.currentTarget) })
      const j = await r.json().catch(() => ({ error: 'No se pudo enviar.' }))
      if (r.ok) location.href = j.url
      else { setErr(j.error); setBusy(false) }
    }}>
      <label>Servicio
        <select name="product" defaultValue={initial}>{Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      </label>
      <label>Nombre y apellido<input name="name" required maxLength={120} autoComplete="name" /></label>
      <label>WhatsApp (opcional, para dudas rápidas)<input name="phone" maxLength={40} inputMode="tel" autoComplete="tel" /></label>
      <label>¿Qué puesto buscás?<input name="target" required maxLength={200} placeholder="Ej.: administrativo/a remoto, atención al cliente, primer empleo" /></label>
      <label>Tu CV (PDF, Word o foto, hasta 5 MB)<input name="cv" type="file" accept=".pdf,.doc,.docx,.odt,.jpg,.jpeg,.png" /></label>
      <label>Algo más (si no tenés CV, contanos tu experiencia y estudios)<textarea name="notes" rows={5} maxLength={3000} /></label>
      <button className="btn" disabled={busy}>{busy ? 'Llevándote a Mercado Pago…' : 'Ir a pagar'}</button>
      {err && <p className="msg err">{err}</p>}
      <p className="note">Pago único con Mercado Pago. Tu CV queda guardado en privado y solo lo usamos para tu pedido.</p>
    </form>
  )
}
