'use client'
import { useState } from 'react'

export default function Ingresar() {
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>('idle')
  const [err, setErr] = useState('')
  const [email, setEmail] = useState('')

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setState('busy'); setErr('')
    const next = new URLSearchParams(location.search).get('next') ?? '/cuenta'
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, next }) })
    if (r.ok) setState('sent')
    else { setErr((await r.json()).error); setState('idle') }
  }

  return (
    <article className="job">
      <p className="kicker">Tu cuenta</p>
      <h1>Ingresá con tu mail.</h1>
      {state === 'sent' ? (
        <>
          <p className="msg" style={{ marginTop: 16 }}>Te mandamos un enlace a {email}. Abrilo desde este mismo dispositivo para entrar.</p>
          <p className="note">Si no llega en un minuto, revisá spam. El enlace sirve una sola vez.</p>
        </>
      ) : (
        <>
          <p className="co">Sin contraseña: te enviamos un enlace y entrás con un toque. Si no tenés cuenta, se crea sola.</p>
          <form className="form" onSubmit={send}>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@mail.com" autoComplete="email" autoFocus />
            <button className="btn" disabled={state === 'busy'}>{state === 'busy' ? 'Enviando…' : 'Enviarme el enlace'}</button>
            {err && <p className="msg err">{err}</p>}
          </form>
        </>
      )}
    </article>
  )
}
