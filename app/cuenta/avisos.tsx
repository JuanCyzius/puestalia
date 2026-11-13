'use client'
import { useEffect, useState } from 'react'
import { CATEGORIES, EXPERIENCES, MODALITIES } from '@/lib/types'
import { InstallButton, isIOS, isStandalone } from '../pwa'

type Prefs = { cats: string[]; mods: string[]; exps: string[] }
type Saved = Prefs & { endpoint: string }
type State = 'loading' | 'ios-install' | 'unsupported' | 'denied' | 'off' | 'on'

const post = (url: string, body?: unknown) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body ?? {}) })
const b64 = (s: string) => { const r = atob((s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, (c) => c.charCodeAt(0)) }

function Chips({ label, opts, value, onChange }: { label: string; opts: Record<string, string>; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <fieldset className="chips">
      <legend>{label} <span>{value.length ? '' : '· todas'}</span></legend>
      {Object.entries(opts).map(([k, l]) => {
        const on = value.includes(k)
        return <button type="button" key={k} className={on ? 'chip on' : 'chip'} aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== k) : [...value, k])}>{l}</button>
      })}
    </fieldset>
  )
}

/** Activar, ajustar y probar las notificaciones de ofertas en este celular o compu. */
export function Avisos({ saved, premium }: { saved: Saved[]; premium: boolean }) {
  const [state, setState] = useState<State>('loading')
  const [endpoint, setEndpoint] = useState('')
  const [p, setP] = useState<Prefs>({ cats: [], mods: [], exps: [] })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ t: string; err?: boolean } | null>(null)

  useEffect(() => {
    (async () => {
      const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
      if (!ok) return setState(isIOS() && !isStandalone() ? 'ios-install' : 'unsupported')
      if (Notification.permission === 'denied') return setState('denied')
      const reg = await navigator.serviceWorker.register('/sw.js')
      const sub = await reg.pushManager.getSubscription()
      const mine = sub && saved.find((s) => s.endpoint === sub.endpoint)
      if (sub && mine) { setEndpoint(sub.endpoint); setP({ cats: mine.cats ?? [], mods: mine.mods ?? [], exps: mine.exps ?? [] }); setState('on') }
      else setState('off')
    })().catch(() => setState('unsupported'))
  }, [saved])

  async function activate() {
    setBusy(true); setMsg(null)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setState(perm === 'denied' ? 'denied' : 'off'); return }
      const { key, error } = await (await fetch('/api/push/key')).json()
      if (!key) throw new Error(error || 'No se pudo preparar las notificaciones.')
      const reg = await navigator.serviceWorker.ready
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) }))
      const r = await post('/api/push/subscribe', { subscription: sub.toJSON(), ...p })
      if (!r.ok) throw new Error((await r.json()).error)
      setEndpoint(sub.endpoint); setState('on'); setMsg({ t: 'Listo. Te mandamos una de prueba.' })
      await post('/api/push/test', { endpoint: sub.endpoint })
    } catch (e) { setMsg({ t: (e as Error).message, err: true }) }
    finally { setBusy(false) }
  }

  async function save() {
    setBusy(true); setMsg(null)
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    const r = sub && (await post('/api/push/subscribe', { subscription: sub.toJSON(), ...p }))
    setMsg(r && r.ok ? { t: 'Preferencias guardadas.' } : { t: 'No se pudo guardar. Probá desactivar y activar de nuevo.', err: true })
    setBusy(false)
  }

  async function test() {
    setBusy(true); setMsg(null)
    const r = await post('/api/push/test', { endpoint })
    setMsg(r.ok ? { t: 'Enviada. Si no aparece, revisá que el celular no esté en "No molestar".' } : { t: (await r.json()).error, err: true })
    setBusy(false)
  }

  async function off() {
    setBusy(true)
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    await post('/api/push/unsubscribe', { endpoint: sub?.endpoint ?? endpoint })
    await sub?.unsubscribe().catch(() => {})
    setState('off'); setMsg({ t: 'Notificaciones desactivadas en este dispositivo.' }); setBusy(false)
  }

  const prefs = (
    <>
      <Chips label="Modalidad" opts={MODALITIES} value={p.mods} onChange={(mods) => setP({ ...p, mods })} />
      <Chips label="Experiencia" opts={EXPERIENCES} value={p.exps} onChange={(exps) => setP({ ...p, exps })} />
      <Chips label="Rubro" opts={CATEGORIES} value={p.cats} onChange={(cats) => setP({ ...p, cats })} />
    </>
  )

  return (
    <div className="avisos">
      <p>
        {premium
          ? 'Con Premium te avisamos apenas entra una oferta que coincide con lo que elegiste. Como mucho, una notificación por hora: si entran varias, llegan juntas.'
          : 'En el plan gratis te avisamos cuando se liberan las ofertas que coinciden con lo que elegiste (3 días después de publicadas), como mucho dos veces por día. Con Premium te llegan apenas entran.'}
      </p>

      {state === 'loading' && <p className="note">Revisando este dispositivo…</p>}

      {state === 'ios-install' && (
        <div className="howto">
          <b>En iPhone, primero instalá Puestalia:</b>
          <ol>
            <li>Abrí esta página en Safari.</li>
            <li>Tocá el botón Compartir (el cuadrado con la flecha).</li>
            <li>Elegí «Agregar a pantalla de inicio».</li>
            <li>Abrí Puestalia desde el ícono nuevo y volvé a esta sección para activar los avisos.</li>
          </ol>
          <p className="note">Hace falta iOS 16.4 o posterior.</p>
        </div>
      )}
      {state === 'unsupported' && <p className="note">Este navegador no permite notificaciones. En Android usá Chrome; en iPhone, Safari con la app agregada a la pantalla de inicio.</p>}
      {state === 'denied' && <p className="msg err">Bloqueaste las notificaciones de Puestalia. Para activarlas, entrá a la configuración del navegador o del celular, buscá Puestalia y permitilas. Después recargá esta página.</p>}

      {(state === 'off' || state === 'on') && prefs}
      <div className="row">
        {state === 'off' && <button className="btn" disabled={busy} onClick={activate}>{busy ? 'Activando…' : 'Activar notificaciones'}</button>}
        {state === 'on' && (
          <>
            <button className="btn sm" disabled={busy} onClick={save}>Guardar preferencias</button>
            <button className="btn sm ghost" disabled={busy} onClick={test}>Mandarme una de prueba</button>
            <button className="clear" disabled={busy} onClick={off}>Desactivar en este dispositivo</button>
          </>
        )}
        <InstallButton className="btn sm ghost" />
      </div>
      {msg && <p className={msg.err ? 'msg err' : 'msg'}>{msg.t}</p>}
    </div>
  )
}
