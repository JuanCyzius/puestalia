'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CATEGORIES, EXPERIENCES, MODALITIES, SCHEDULES, type Job, type JobDraft } from '@/lib/types'
import { linkedinPost } from '@/lib/linkedin'

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

const queued = (j: Job) => new Date(j.published_at).getTime() > Date.now()
const when = (iso: string) => new Date(iso).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })
const TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
const toB64 = (f: File) => new Promise<string>((res, rej) => {
  const r = new FileReader()
  r.onload = () => res(String(r.result).split(',')[1])
  r.onerror = rej
  r.readAsDataURL(f)
})

function CopyLinkedin({ job }: { job: Job }) {
  const [done, setDone] = useState(false)
  return (
    <button className="btn sm ghost" onClick={async () => {
      await navigator.clipboard.writeText(linkedinPost(job, location.origin))
      post('/api/jobs', { open_free: job.id }).catch(() => {}) // queda abierto gratis para quien llegue desde LinkedIn
      setDone(true); setTimeout(() => setDone(false), 2000)
    }} title="Copia el texto y deja este aviso abierto gratis">{done ? 'Copiado · abierto gratis' : 'Copiar texto para LinkedIn'}</button>
  )
}

export function Panel() {
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [thumb, setThumb] = useState('')
  const [over, setOver] = useState(false)
  const [draft, setDraft] = useState<JobDraft | null>(null)
  const [done, setDone] = useState<Job | null>(null)
  const [recent, setRecent] = useState<Job[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ t: string; dup?: boolean } | null>(null)
  const [lastMode, setLastMode] = useState<'now' | 'queue'>('queue')
  const pick = useRef<HTMLInputElement>(null)
  const step = done ? 3 : draft ? 2 : 1

  const loadRecent = useCallback(() => { fetch('/api/jobs').then((r) => r.json()).then((j) => setRecent(j.jobs ?? [])).catch(() => {}) }, [])
  useEffect(loadRecent, [loadRecent])

  const take = useCallback((f?: File | null) => {
    if (!f) return
    if (!TYPES.includes(f.type)) { setMsg({ t: 'Ese archivo no sirve. Usá una imagen (PNG, JPG, WEBP) o un PDF.' }); return }
    if (f.size > 6 * 1024 * 1024) { setMsg({ t: 'El archivo pesa más de 6 MB. Recortá la captura o pegá el texto.' }); return }
    setMsg(null); setFile(f)
    setThumb(f.type.startsWith('image/') ? URL.createObjectURL(f) : '')
  }, [])

  // Pegar una captura con Ctrl+V en cualquier parte del paso 1.
  useEffect(() => {
    if (step !== 1) return
    const onPaste = (e: ClipboardEvent) => {
      const img = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'))
      if (img) { e.preventDefault(); take(img) }
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [step, take])

  const ready = !!(text.trim() || url.trim() || file)

  async function extract() {
    setBusy(true); setMsg(null)
    try {
      const body: Record<string, unknown> = { text: text.trim() || undefined, url: url.trim() || undefined }
      if (file) body.file = { data: await toB64(file), media_type: file.type }
      const r = await post('/api/ingest', body)
      const j = await r.json()
      if (!r.ok) throw new Error(j.error)
      setDraft(j.draft)
    } catch (x) { setMsg({ t: (x as Error).message }) }
    setBusy(false)
  }

  async function publish(mode: 'now' | 'queue', force = false) {
    setBusy(true); setMsg(null); setLastMode(mode)
    const r = await post('/api/jobs', { draft, force, mode })
    const j = await r.json()
    if (r.ok) { setDone(j.job); setDraft(null); setText(''); setUrl(''); setFile(null); setThumb(''); loadRecent() }
    else setMsg({ t: j.error, dup: r.status === 409 })
    setBusy(false)
  }

  const set = (k: keyof JobDraft, v: string) => setDraft((d) => d && { ...d, [k]: v.trim() === '' && k !== 'title' && k !== 'description' ? null : v })
  const field = (k: keyof JobDraft, label: string, area = false) => (
    <label key={k} className={draft![k] ? '' : 'missing'}>
      <span>{label}{!draft![k] && <em>No informado</em>}</span>
      {area ? <textarea rows={5} value={draft![k] ?? ''} onChange={(e) => set(k, e.target.value)} />
            : <input value={draft![k] ?? ''} onChange={(e) => set(k, e.target.value)} />}
    </label>
  )
  const select = (k: keyof JobDraft, label: string, opts: [string, string][]) => (
    <label key={k} className={draft![k] ? '' : 'missing'}>
      <span>{label}{!draft![k] && <em>No informado</em>}</span>
      <select value={draft![k] ?? ''} onChange={(e) => set(k, e.target.value)}>
        <option value="">No informado</option>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  )
  const old = draft?.source_published_at && Date.now() - new Date(draft.source_published_at).getTime() > 20 * 86400000

  return (
    <div className="adm">
      <ol className="steps" aria-label="Pasos">
        {['Cargar', 'Revisar', 'Listo'].map((s, i) => <li key={s} className={step === i + 1 ? 'on' : step > i + 1 ? 'past' : ''}><b>{i + 1}</b>{s}</li>)}
      </ol>

      {step === 1 && (
        <section className="load">
          <h1>Cargá un aviso</h1>
          <p className="co">Usá lo que tengas: texto, captura o enlace. Con uno alcanza y, si combinás varios, la ficha sale más completa.</p>
          <div className="srcs">
            <div className="src">
              <h3>Texto {text.trim() && <i>✓</i>}</h3>
              <textarea rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder="Pegá el aviso copiado de LinkedIn, un mail, WhatsApp…" />
            </div>
            <div className="src">
              <h3>Captura o PDF {file && <i>✓</i>}</h3>
              <div className={over ? 'drop over' : 'drop'} role="button" tabIndex={0}
                onClick={() => pick.current?.click()} onKeyDown={(e) => e.key === 'Enter' && pick.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
                onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files[0]) }}>
                {file ? (
                  <>
                    {thumb ? <img src={thumb} alt="Vista de la captura" /> : <p className="pdf">PDF</p>}
                    <p>{file.name}</p>
                    <button type="button" className="clear" onClick={(e) => { e.stopPropagation(); setFile(null); setThumb('') }}>Quitar</button>
                  </>
                ) : (
                  <p><b>Arrastrá el archivo acá</b><br />o tocá para elegirlo. También podés pegar una captura con Ctrl+V.</p>
                )}
              </div>
              <input ref={pick} type="file" hidden accept={TYPES.join(',')} onChange={(e) => { take(e.target.files?.[0]); e.target.value = '' }} />
            </div>
            <div className="src">
              <h3>Enlace {url.trim() && <i>✓</i>}</h3>
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
              <p className="note">Si es de una empresa, leo la página. Si es de LinkedIn o Instagram, lo guardo como link de postulación y el contenido sale del texto o la captura.</p>
            </div>
          </div>
          {msg && <p className="msg err">{msg.t}</p>}
          <button className="btn big" disabled={!ready || busy} onClick={extract}>{busy ? 'Leyendo el aviso…' : 'Armar la ficha'}</button>
        </section>
      )}

      {step === 2 && draft && (
        <section className="review">
          <div className="form">
            <h1>Revisá la ficha</h1>
            <p className="co">Lo que el aviso no dice queda como “No informado”. Corregí lo que haga falta y publicá.</p>
            {old && <p className="msg err">El aviso original tiene más de 20 días. Verificá que siga abierto.</p>}
            <h3>Lo esencial</h3>
            {field('title', 'Puesto')}
            {field('company', 'Empresa')}
            <div className="two">
              {select('category', 'Categoría', Object.entries(CATEGORIES))}
              {select('modality', 'Modalidad', Object.entries(MODALITIES))}
              {field('location', 'Ubicación')}
              {select('experience', 'Experiencia', Object.entries(EXPERIENCES))}
            </div>
            <h3>Condiciones</h3>
            <div className="two">
              {select('schedule_type', 'Jornada', SCHEDULES.map((s) => [s, s]))}
              {field('hours', 'Horarios')}
              {field('salary', 'Salario')}
              {field('education', 'Estudios')}
            </div>
            <h3>Cómo postularse</h3>
            <div className="two">
              {field('contact_email', 'Mail de postulación')}
              {field('apply_url', 'Enlace')}
            </div>
            <h3>Texto</h3>
            {field('description', 'Descripción', true)}
            {field('requirements', 'Requisitos', true)}
            {field('benefits', 'Beneficios', true)}
            <h3>Origen</h3>
            <div className="two">
              {field('source', 'Fuente')}
              {field('source_published_at', 'Fecha original (AAAA-MM-DD)')}
              {field('closing_date', 'Cierre (AAAA-MM-DD)')}
            </div>
          </div>
          <aside className="side">
            <p className="kicker">Así se va a ver</p>
            <div className="card">
              <div className="tags">
                {draft.contact_email && <span className="tag direct">Mail directo</span>}
                {draft.modality && <span className="tag">{MODALITIES[draft.modality]}</span>}
                {draft.experience === 'sin_experiencia' && <span className="tag">Sin experiencia</span>}
              </div>
              <h3>{draft.title || 'Sin título'}</h3>
              <p className="co">{draft.company ?? 'Empresa confidencial'} · {draft.location ?? 'Ubicación no informada'}</p>
              {draft.salary && <p className="pay">{draft.salary}</p>}
            </div>
            {msg && <p className="msg err">{msg.t}</p>}
            <button className="btn big" disabled={busy} onClick={() => publish('queue')}>{busy && lastMode === 'queue' ? 'Sumando…' : 'Sumar a la cola'}</button>
            <p className="note" style={{ margin: 0 }}>Los primeros 4 de la tanda salen al instante. El resto se reparte solo: más seguidos al principio y más espaciados después.</p>
            <button className="btn ghost" disabled={busy} onClick={() => publish('now')}>{busy && lastMode === 'now' ? 'Publicando…' : 'Publicar ahora'}</button>
            {msg?.dup && <button className="btn ghost" onClick={() => publish(lastMode, true)}>Guardar igual</button>}
            <button className="btn ghost" onClick={() => { setDraft(null); setMsg(null) }}>Volver a cargar</button>
          </aside>
        </section>
      )}

      {step === 3 && done && (
        <section className="done">
          <h1>{queued(done) ? 'En la cola.' : 'Publicado.'}</h1>
          <p className="co">{queued(done)
            ? `“${done.title}” sale el ${when(done.published_at)}. Hasta entonces no se ve en el sitio.`
            : `“${done.title}” ya está en el sitio y vence el ${new Date(done.expires_at).toLocaleDateString('es-AR')}.`}</p>
          <h3>Texto para LinkedIn</h3>
          <pre className="li">{linkedinPost(done, location.origin)}</pre>
          <div className="row">
            <CopyLinkedin job={done} />
            <a className="btn sm ghost" href={`/empleos/${done.id}`} target="_blank">Ver aviso</a>
            <button className="btn sm" onClick={() => setDone(null)}>Cargar otro</button>
          </div>
        </section>
      )}

      {recent.length > 0 && step !== 2 && (
        <section className="recent">
          <h2>Cola y últimos publicados</h2>
          {recent.some(queued) && <p className="co" style={{ marginBottom: 10 }}>{recent.filter(queued).length} en cola. El último sale el {when(recent.filter(queued)[0].published_at)}.</p>}
          <ul>
            {recent.map((j) => (
              <li key={j.id}>
                <div>
                  <a href={`/empleos/${j.id}`} target="_blank"><b>{j.title}</b></a>
                  <span>{j.company ?? 'Empresa confidencial'} · {queued(j) ? <em className="q">Sale el {when(j.published_at)}</em> : `vence el ${new Date(j.expires_at).toLocaleDateString('es-AR')}`}</span>
                </div>
                <div className="row">
                  {queued(j) && <button className="btn sm ghost" onClick={async () => { await post('/api/jobs', { publish_now: j.id }); loadRecent() }}>Publicar ahora</button>}
                  <CopyLinkedin job={j} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
