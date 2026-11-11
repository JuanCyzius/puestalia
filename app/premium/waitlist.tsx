'use client'
import { useState } from 'react'

export function Waitlist() {
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle')
  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('busy')
    const email = new FormData(e.currentTarget).get('email')
    const r = await fetch('/api/waitlist', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) })
    setState(r.ok ? 'ok' : 'err')
  }
  if (state === 'ok') return <p className="msg">Listo, quedaste anotado. Te escribimos apenas abramos Premium.</p>
  return (
    <form className="form" onSubmit={send}>
      <input type="email" name="email" required placeholder="tu@mail.com" autoComplete="email" />
      <button className="btn" disabled={state === 'busy'}>Avisame cuando abra</button>
      {state === 'err' && <p className="msg err">No pudimos anotarte. Revisá el mail y probá de nuevo.</p>}
    </form>
  )
}
