'use client'
import { useEffect, useState } from 'react'

/** Llega acá el enlace del mail. El token viene después del # y nunca viaja en la dirección al servidor. */
export default function Callback() {
  const [err, setErr] = useState('')
  useEffect(() => {
    const hash = new URLSearchParams(location.hash.slice(1))
    const next = new URLSearchParams(location.search).get('next') ?? '/cuenta'
    const token = hash.get('access_token')
    history.replaceState(null, '', location.pathname)
    if (!token) { setErr(hash.get('error_description')?.replace(/\+/g, ' ') || 'El enlace venció o ya se usó.'); return }
    fetch('/api/auth/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ access_token: token }) })
      .then(async (r) => { if (r.ok) location.replace(/^\/(?!\/)/.test(next) ? next : '/cuenta'); else setErr((await r.json()).error) })
      .catch(() => setErr('No pudimos iniciar tu sesión. Probá de nuevo.'))
  }, [])
  return (
    <article className="job">
      <h1>{err ? 'No pudimos entrar.' : 'Entrando…'}</h1>
      {err && (<><p className="msg err" style={{ marginTop: 16 }}>{err}</p><p style={{ marginTop: 16 }}><a className="btn" href="/ingresar">Pedir un enlace nuevo</a></p></>)}
    </article>
  )
}
