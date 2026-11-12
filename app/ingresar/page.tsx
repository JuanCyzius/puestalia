'use client'
import { useState } from 'react'

const post = (url: string, body: unknown) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
const nextPath = () => {
  const n = new URLSearchParams(location.search).get('next') ?? '/cuenta'
  return /^\/(?!\/)/.test(n) ? n : '/cuenta'
}

export default function Ingresar() {
  const [mode, setMode] = useState<'in' | 'up' | 'forgot'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr('')
    const r = mode === 'in' ? await post('/api/auth/signin', { email, password })
      : mode === 'up' ? await post('/api/auth/signup', { email, password, name })
      : await post('/api/auth/login', { email, next: '/cuenta' })
    if (!r.ok) { setErr((await r.json()).error); setBusy(false); return }
    if (mode === 'forgot') { setSent(true); setBusy(false) } else location.replace(nextPath())
  }
  const go = (m: typeof mode) => { setMode(m); setErr(''); setSent(false) }

  return (
    <article className="job auth">
      <p className="kicker">Tu cuenta</p>
      <h1>{mode === 'in' ? 'Ingresá a Puestalia.' : mode === 'up' ? 'Creá tu cuenta.' : 'Recuperá tu cuenta.'}</h1>
      {mode !== 'forgot' && (
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={mode === 'in'} onClick={() => go('in')}>Ya tengo cuenta</button>
          <button role="tab" aria-selected={mode === 'up'} onClick={() => go('up')}>Soy nuevo</button>
        </div>
      )}
      {sent ? (
        <p className="msg">Te mandamos un enlace a {email}. Abrilo, entrás a tu cuenta y ahí podés poner una contraseña nueva.</p>
      ) : (
        <form className="form" onSubmit={submit}>
          {mode === 'forgot' && <p className="co">Poné tu mail y te enviamos un enlace para entrar sin contraseña.</p>}
          <label>Mail<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus /></label>
          {mode !== 'forgot' && (
            <label>Contraseña{mode === 'up' && ' (8 caracteres o más)'}
              <input type="password" required minLength={mode === 'up' ? 8 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'up' ? 'new-password' : 'current-password'} />
            </label>
          )}
          {mode === 'up' && <label>Nombre (opcional)<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" maxLength={80} /></label>}
          <button className="btn" disabled={busy}>{busy ? 'Un momento…' : mode === 'in' ? 'Ingresar' : mode === 'up' ? 'Crear cuenta' : 'Enviarme el enlace'}</button>
          {err && <p className="msg err">{err}</p>}
        </form>
      )}
      <p style={{ marginTop: 16 }}>
        {mode === 'forgot'
          ? <button className="clear" onClick={() => go('in')}>Volver a ingresar</button>
          : mode === 'in' && <button className="clear" onClick={() => go('forgot')}>Olvidé mi contraseña</button>}
      </p>
    </article>
  )
}
