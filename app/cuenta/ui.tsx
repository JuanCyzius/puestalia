'use client'
import { useState } from 'react'

const post = (url: string, body?: unknown) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body ?? {}) })

export function BuyPass({ price, again }: { price: string; again: boolean }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function go() {
    setBusy(true); setErr('')
    const r = await post('/api/subscribe')
    const j = await r.json()
    if (r.ok) location.href = j.url
    else { setErr(j.error); setBusy(false) }
  }
  return (
    <div className="form">
      <button className="btn" disabled={busy} onClick={go}>{busy ? 'Abriendo Mercado Pago…' : again ? `Sumar 30 días por ${price}` : `Pagar ${price} · 30 días`}</button>
      {err && <p className="msg err">{err}</p>}
      <p className="note">Pago único con Mercado Pago: tarjeta, débito, dinero en cuenta y los demás medios que te ofrezca. Sin débito automático. Puestalia no ve ni guarda los datos de tu tarjeta.</p>
    </div>
  )
}

export function Cancel() {
  const [step, setStep] = useState<'idle' | 'confirm' | 'busy'>('idle')
  const [err, setErr] = useState('')
  if (step === 'idle') return <button className="btn ghost" onClick={() => setStep('confirm')}>Cancelar suscripción</button>
  return (
    <div className="form">
      <p>Se cancela el débito mensual de la suscripción vieja. Si tenés un pase de 30 días, lo seguís teniendo. ¿Confirmás?</p>
      <button className="btn" disabled={step === 'busy'} onClick={async () => {
        setStep('busy')
        const r = await post('/api/subscribe/cancel')
        if (r.ok) location.reload(); else { setErr((await r.json()).error); setStep('confirm') }
      }}>{step === 'busy' ? 'Cancelando…' : 'Sí, cancelar suscripción'}</button>
      <button className="btn ghost" onClick={() => setStep('idle')}>Volver</button>
      {err && <p className="msg err">{err}</p>}
    </div>
  )
}

export function Logout() {
  return <button className="clear" onClick={async () => { await post('/api/auth/logout'); location.href = '/' }}>Cerrar sesión</button>
}

export function ChangePassword() {
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'ok'>('idle')
  const [err, setErr] = useState('')
  if (!open) return <button className="clear" onClick={() => setOpen(true)}>Cambiar contraseña</button>
  if (state === 'ok') return <p className="msg">Contraseña cambiada.</p>
  return (
    <form className="form" onSubmit={async (e) => {
      e.preventDefault()
      setState('busy'); setErr('')
      const r = await post('/api/auth/password', { password: pw })
      if (r.ok) setState('ok'); else { setErr((await r.json()).error); setState('idle') }
    }}>
      <label>Contraseña nueva (8 caracteres o más)
        <input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
      </label>
      <button className="btn sm" disabled={state === 'busy'}>Guardar contraseña</button>
      {err && <p className="msg err">{err}</p>}
    </form>
  )
}
