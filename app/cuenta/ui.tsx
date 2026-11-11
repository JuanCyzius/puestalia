'use client'
import { useState } from 'react'

const post = (url: string, body?: unknown) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body ?? {}) })

export function Subscribe({ email, price }: { email: string; price: string }) {
  const [payer, setPayer] = useState(email)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function go(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr('')
    const r = await post('/api/subscribe', { payer_email: payer })
    const j = await r.json()
    if (r.ok) location.href = j.url
    else { setErr(j.error); setBusy(false) }
  }
  return (
    <form className="form" onSubmit={go}>
      <label>Mail de tu cuenta de Mercado Pago
        <input type="email" required value={payer} onChange={(e) => setPayer(e.target.value)} autoComplete="email" />
      </label>
      <button className="btn" disabled={busy}>{busy ? 'Abriendo Mercado Pago…' : `Suscribirme por ${price} al mes`}</button>
      {err && <p className="msg err">{err}</p>}
      <p className="note">Tiene que ser el mail con el que entrás a Mercado Pago; si es otro, el pago no se puede completar. Cancelás cuando quieras desde esta página.</p>
    </form>
  )
}

export function Cancel() {
  const [step, setStep] = useState<'idle' | 'confirm' | 'busy'>('idle')
  const [err, setErr] = useState('')
  if (step === 'idle') return <button className="btn ghost" onClick={() => setStep('confirm')}>Cancelar suscripción</button>
  return (
    <div className="form">
      <p>Se cancela el débito mensual y perdés el acceso Premium. ¿Confirmás?</p>
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
