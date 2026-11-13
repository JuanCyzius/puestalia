'use client'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES, DAYS_LIVE, EXPERIENCES, FREE_DELAY_DAYS, MODALITIES, SCHEDULES, type Filters } from '@/lib/types'
import { ago, left, until } from '@/lib/format'

/** Lo que llega al navegador. En los avisos bloqueados, empresa, ubicación y salario nunca salen del servidor. */
export type CardData = {
  id: string; title: string; category: string; modality: keyof typeof MODALITIES | null
  experience: keyof typeof EXPERIENCES | null; schedule_type: string | null
  published_at: string; expires_at: string; free_at: string; open: boolean; direct: boolean
  company: string | null; location: string | null; salary: string | null
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

type Opt = [value: string, menuLabel: string, sentenceLabel?: string]
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

/** Hueco de la frase: texto subrayado que abre un menú propio. */
function Pick({ value, onChange, any, opts, label }: { value?: string; onChange: (v: string) => void; any: string; opts: Opt[]; label: string }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLSpanElement>(null)
  const cur = opts.find(([v]) => v === value)
  const shown = cur ? (cur[2] ?? cur[1]).toLowerCase() : any
  const all: Opt[] = [['', cap(any)], ...opts]

  useEffect(() => {
    if (!open) return
    const out = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); box.current?.querySelector('button')?.focus() } }
    document.addEventListener('mousedown', out)
    document.addEventListener('keydown', esc)
    box.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus()
    return () => { document.removeEventListener('mousedown', out); document.removeEventListener('keydown', esc) }
  }, [open])

  const arrows = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const items = [...(box.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])]
    const i = items.indexOf(document.activeElement as HTMLElement)
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus()
  }

  return (
    <span className="pick" ref={box}>
      <button type="button" className={value ? 'pick-btn set' : 'pick-btn'} aria-haspopup="listbox" aria-expanded={open}
        aria-label={`${label}: ${shown}`} onClick={() => setOpen((o) => !o)}>
        {shown}<i aria-hidden>▾</i>
      </button>
      {open && (
        <span className="menu" role="listbox" aria-label={label} onKeyDown={arrows}>
          {all.map(([v, l]) => {
            const on = (value ?? '') === v
            return (
              <button type="button" role="option" aria-selected={on} key={v} onClick={() => { onChange(v); setOpen(false) }}>
                {l}{on && <b aria-hidden>✓</b>}
              </button>
            )
          })}
        </span>
      )}
    </span>
  )
}

function Card({ c, i }: { c: CardData; i: number }) {
  const days = Math.max(0, Math.ceil((new Date(c.expires_at).getTime() - Date.now()) / 86400000))
  const inner = (
    <>
      <div className="tags">
        {!c.open && <span className="tag lock">Recién llegado</span>}
        {c.direct && <span className="tag direct">Mail directo</span>}
        {c.modality && <span className="tag">{MODALITIES[c.modality]}</span>}
        {c.experience === 'sin_experiencia' && <span className="tag">Sin experiencia</span>}
      </div>
      <h3>{c.title}</h3>
      {c.open ? (
        <p className="co">{c.company ?? 'Empresa confidencial'} · {c.location ?? 'Ubicación no informada'}</p>
      ) : (
        <p className="co hidden-co" aria-label="Empresa y ubicación visibles con Premium"><i /><i /></p>
      )}
      {c.open && c.salary && <p className="pay">{c.salary}</p>}
      {!c.open && <p className="soon" suppressHydrationWarning>Gratis en {until(c.free_at)} · con Premium, ya</p>}
      <div className="life">
        <div className="bar"><span style={{ width: `${Math.min(100, (days / DAYS_LIVE) * 100)}%` }} /></div>
        <div className="meta"><span suppressHydrationWarning>{ago(c.published_at)}</span><span suppressHydrationWarning>{left(c.expires_at)}</span></div>
      </div>
      <span className="go">{c.open ? 'Ver aviso' : 'Abrir ya con Premium'} <b aria-hidden>→</b></span>
    </>
  )
  const style = { '--i': Math.min(i, 11) } as React.CSSProperties
  return c.open
    ? <Link className="card" style={style} href={`/empleos/${c.id}`}>{inner}</Link>
    : <Link className="card locked" style={style} href={`/empleos/${c.id}`}>{inner}</Link>
}

export function Catalog({ cards, initial, premium = false, preset, title, intro }: { cards: CardData[]; initial: Filters; premium?: boolean; preset?: Filters; title?: string; intro?: string }) {
  const [f, setF] = useState<Filters>(initial)
  const set = (k: keyof Filters) => (v: string) => setF((p) => ({ ...p, [k]: v || undefined }))
  const active = Object.values(f).some(Boolean)

  // La búsqueda queda en la dirección, así se puede compartir o guardar.
  useEffect(() => {
    // En una página por tema (/trabajo-remoto) el filtro de la página no se repite en la dirección.
    const keep = Object.entries(f).filter(([k, v]) => v && preset?.[k as keyof Filters] !== v) as [string, string][]
    const presetOn = !!preset && Object.entries(preset).every(([k, v]) => f[k as keyof Filters] === v)
    const base = presetOn ? location.pathname : '/'
    const qs = new URLSearchParams(presetOn ? keep : (Object.entries(f).filter(([, v]) => v) as [string, string][])).toString()
    history.replaceState(null, '', qs ? base + '?' + qs : base)
  }, [f, preset])

  const list = useMemo(() => {
    const words = norm(f.q ?? '').split(/\s+/).filter(Boolean)
    return cards.filter((c) => {
      if (f.cat && c.category !== f.cat) return false
      if (f.mod && c.modality !== f.mod) return false
      if (f.exp && c.experience !== f.exp) return false
      if (f.jor && c.schedule_type !== f.jor) return false
      if (f.dir && !c.direct) return false
      if (!words.length) return true
      const hay = norm([c.title, CATEGORIES[c.category], c.modality && MODALITIES[c.modality], c.experience && EXPERIENCES[c.experience], c.schedule_type, c.company, c.location].filter(Boolean).join(' '))
      return words.every((w) => hay.includes(w))
    })
  }, [cards, f])
  const openCount = list.filter((c) => c.open).length
  const SentenceTag = title ? 'p' : 'h1'

  return (
    <>
      <section className="hero">
        {title ? <h1 className="kicker">{title}</h1> : <p className="kicker">Oportunidades todos los días</p>}
        <SentenceTag className="sentence">
          Busco trabajo{' '}
          <Pick label="Modalidad" value={f.mod} onChange={set('mod')} any="en cualquier modalidad" opts={Object.entries(MODALITIES) as Opt[]} />{' '}
          en{' '}
          <Pick label="Rubro" value={f.cat} onChange={set('cat')} any="cualquier rubro" opts={Object.entries(CATEGORIES) as Opt[]} />{' '}
          <Pick label="Experiencia" value={f.exp} onChange={set('exp')} any="con o sin experiencia"
            opts={Object.entries(EXPERIENCES).map(([v, l]): Opt => [v, l, v === 'sin_experiencia' ? l : 'nivel ' + l])} />
          .
        </SentenceTag>
        <div className="refine">
          <input type="search" value={f.q ?? ''} onChange={(e) => set('q')(e.target.value)} placeholder="O escribí un puesto: recepcionista, data entry…" aria-label="Buscar por puesto" />
          <Pick label="Jornada" value={f.jor} onChange={set('jor')} any="cualquier jornada" opts={SCHEDULES.map((s): Opt => [s, s])} />
          <button type="button" className={f.dir ? 'toggle on' : 'toggle'} aria-pressed={!!f.dir} onClick={() => set('dir')(f.dir ? '' : '1')}>Solo con mail directo</button>
        </div>
        <p className="pitch"><b>Mail directo:</b> en esos avisos tu CV le llega a una persona, no a un formulario.</p>
        {intro && <p className="intro">{intro}</p>}
      </section>

      <div className="count" aria-live="polite">
        <p>
          <b>{list.length}</b> {list.length === 1 ? 'aviso vigente' : 'avisos vigentes'}
          {list.length > 0 && !premium && <> · <b>{openCount}</b> {openCount === 1 ? 'abierto' : 'abiertos'} gratis · <b>{list.length - openCount}</b> {list.length - openCount === 1 ? 'recién llegado' : 'recién llegados'}, solo Premium</>}
          {premium && <> · Premium activo: abrís todos</>}
        </p>
        {active && <button className="clear" onClick={() => setF({})}>Borrar filtros</button>}
      </div>

      {list.length ? (
        <div className="grid" key={JSON.stringify(f)}>{list.map((c, i) => <Card key={c.id} c={c} i={i} />)}</div>
      ) : (
        <div className="empty">
          <p>No hay avisos vigentes con esa combinación.</p>
          <button className="btn" onClick={() => setF({})}>Ver todos los avisos</button>
        </div>
      )}
      {!premium && <p className="fine">En el plan gratis, cada aviso se abre {FREE_DELAY_DAYS} días después de publicado. Con Premium lo ves apenas entra.</p>}
    </>
  )
}
