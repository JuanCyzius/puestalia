'use client'
import { useState } from 'react'
import { CATEGORIES, EXPERIENCES, MODALITIES, SCHEDULES, type JobDraft } from '@/lib/types'

const post = (url: string, body: unknown) =>
  fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

export function Login() {
  const [err, setErr] = useState(false)
  return (
    <form className="form" style={{ paddingTop: 40 }} onSubmit={async (e) => {
      e.preventDefault()
      const r = await post('/api/admin/login', { password: new FormData(e.currentTarget).get('password') })
      if (r.ok) location.reload(); else setErr(true)
    }}>
      <h1>Panel</h1>
      <input type="password" name="password" placeholder="Contraseña" required autoFocus />
      <button className="btn">Entrar</button>
      {err && <p className="msg err">Contraseña incorrecta.</p>}
    </form>
  )
}

const toB64 = (f: File) => new Promise<string>((res, rej) => {
  const r = new FileReader()
  r.onload = () => res(String(r.result).split(',')[1])
  r.onerror = rej
  r.readAsDataURL(f)
})

export function Panel() {
  const [draft, setDraft] = useState<JobDraft | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ t: string; err?: boolean; dup?: boolean } | null>(null)

  async function extract(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const file = fd.get('file') as File
    setBusy(true); setMsg(null)
    try {
      const body: Record<string, unknown> = { text: fd.get('text'), url: fd.get('url') || undefined }
      if (file?.size) body.file = { data: await toB64(file), media_type: file.type }
      const r = await post('/api/ingest', body)
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setDraft(j.draft)
      form.reset()
    } catch (x) { setMsg({ t: (x as Error).message, err: true }) }
    setBusy(false)
  }

  async function publish(force = false) {
    setBusy(true)
    const r = await post('/api/jobs', { draft, force })
    const j = await r.json()
    if (r.ok) { setMsg({ t: `Publicado. Vence el ${new Date(j.job.expires_at).toLocaleDateString('es-AR')}.` }); setDraft(null) }
    else setMsg({ t: j.error, err: true, dup: r.status === 409 })
    setBusy(false)
  }

  const set = (k: keyof JobDraft, v: string) => setDraft((d) => d && { ...d, [k]: v.trim() === '' && k !== 'title' && k !== 'description' ? null : v })
  const In = ({ k, label, area }: { k: keyof JobDraft; label: string; area?: boolean }) => (
    <label key={k}>{label}{draft![k] ? '' : ' · no informado'}
      {area ? <textarea rows={5} value={draft![k] ?? ''} onChange={(e) => set(k, e.target.value)} />
            : <input value={draft![k] ?? ''} onChange={(e) => set(k, e.target.value)} />}
    </label>
  )
  const Sel = ({ k, label, opts }: { k: keyof JobDraft; label: string; opts: [string, string][] }) => (
    <label key={k}>{label}
      <select value={draft![k] ?? ''} onChange={(e) => set(k, e.target.value)}>
        <option value="">No informado</option>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  )
  const old = draft?.source_published_at && Date.now() - new Date(draft.source_published_at).getTime() > 20 * 86400000

  return (
    <div className="admin">
      <form className="form" onSubmit={extract}>
        <h2>1. Cargar aviso</h2>
        <label>Texto del aviso<textarea name="text" rows={8} placeholder="Pegá acá el texto copiado de LinkedIn, un mail, etc." /></label>
        <label>Captura, foto o PDF<input type="file" name="file" accept="image/png,image/jpeg,image/webp,application/pdf" /></label>
        <label>Enlace (páginas de empresas; LinkedIn e Instagram no)<input name="url" type="url" placeholder="https://..." /></label>
        <button className="btn" disabled={busy}>{busy ? 'Procesando…' : 'Interpretar con IA'}</button>
        {msg && <p className={msg.err ? 'msg err' : 'msg'}>{msg.t}</p>}
        {msg?.dup && <button type="button" className="btn ghost" onClick={() => publish(true)}>Publicar igual</button>}
      </form>

      {draft && (
        <div className="form">
          <h2>2. Revisar y aprobar</h2>
          {old && <p className="msg err">El aviso original tiene más de 20 días. Verificá que siga abierto.</p>}
          {In({ k: 'title', label: 'Puesto' })}
          {In({ k: 'company', label: 'Empresa' })}
          <div className="two">
            {Sel({ k: 'category', label: 'Categoría', opts: Object.entries(CATEGORIES) })}
            {Sel({ k: 'modality', label: 'Modalidad', opts: Object.entries(MODALITIES) })}
            {Sel({ k: 'experience', label: 'Experiencia', opts: Object.entries(EXPERIENCES) })}
            {Sel({ k: 'schedule_type', label: 'Jornada', opts: SCHEDULES.map((s) => [s, s]) })}
            {In({ k: 'location', label: 'Ubicación' })}
            {In({ k: 'hours', label: 'Horarios' })}
            {In({ k: 'salary', label: 'Salario' })}
            {In({ k: 'education', label: 'Estudios' })}
            {In({ k: 'contact_email', label: 'Mail de postulación' })}
            {In({ k: 'apply_url', label: 'Enlace' })}
            {In({ k: 'source', label: 'Fuente' })}
            {In({ k: 'source_published_at', label: 'Fecha original (AAAA-MM-DD)' })}
            {In({ k: 'closing_date', label: 'Cierre (AAAA-MM-DD)' })}
          </div>
          {In({ k: 'description', label: 'Descripción', area: true })}
          {In({ k: 'requirements', label: 'Requisitos', area: true })}
          {In({ k: 'benefits', label: 'Beneficios', area: true })}
          <button className="btn" disabled={busy} onClick={() => publish()}>Aprobar y publicar</button>
          <button className="btn ghost" onClick={() => setDraft(null)}>Descartar</button>
        </div>
      )}
    </div>
  )
}
