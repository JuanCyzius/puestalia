'use client'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES, DAYS_LIVE, EXPERIENCES, FREE_PER_DAY, MODALITIES, SCHEDULES, type Filters } from '@/lib/types'
import { ago, left } from '@/lib/format'

/** Lo que llega al navegador. En los avisos bloqueados, empresa, ubicación y salario nunca salen del servidor. */
export type CardData = {
  id: string; title: string; category: string; modality: keyof typeof MODALITIES | null
  experience: keyof typeof EXPERIENCES | null; schedule_type: string | null
  published_at: string; expires_at: string; open: boolean; free: boolean
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
        {!c.open ? <span className="tag lock">Premium</span> : c.free ? <span className="tag free">Gratis hoy</span> : null}
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
      <div className="life">
        <div className="bar"><span style={{ width: `${Math.min(100, (days / DAYS_LIVE) * 100)}%` }} /></div>
        <div className="meta"><span suppressHydrationWarning>{ago(c.published_at)}</span><span suppressHydrationWarning>{left(c.expires_at)}</span></div>
      </div>
      <span className="go">{c.open ? 'Ver aviso' : 'Desbloquear'} <b aria-hidden>→</b></span>
    </>
  )
  const style = { '--i': Math.min(i, 11) } as React.CSSProperties
  return c.open
    ? <Link className="card" style={style} href={`/empleos/${c.id}`}>{inner}</Link>
    : <Link className="card locked" style={style} href="/premium">{inner}</Link>
}

export function Catalog({ cards, initial, premium = false }: { cards: CardData[]; initial: Filters; premium?: boolean }) {
  const [f, setF] = useState<Filters>(initial)
  const set = (k: keyof Filters) => (v: string) => setF((p) => ({ ...p, [k]: v || undefined }))
  const active = Object.values(f).some(Boolean)

  // La búsqueda queda en la dirección, así se puede compartir o guardar.
  useEffect(() => {
    const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString()
    history.replaceState(null, '', qs ? '/?' + qs : '/')
  }, [f])

  const list = useMemo(() => {
    const words = norm(f.q ?? '').split(/\s+/).filter(Boolean)
    return cards.filter((c) => {
      if (f.cat && c.category !== f.cat) return false
      if (f.mod && c.modality !== f.mod) return false
      if (f.exp && c.experience !== f.exp) return false
      if (f.jor && c.schedule_type !== f.jor) return false
      if (!words.length) return true
      const hay = norm([c.title, CATEGORIES[c.category], c.modality && MODALITIES[c.modality], c.experience && EXPERIENCES[c.experience], c.schedule_type, c.company, c.location].filter(Boolean).join(' '))
      return words.every((w) => hay.includes(w))
    })
  }, [cards, f])
  const openCount = list.filter((c) => c.open).length

  return (
    <>
      <section className="hero">
        <p className="kicker">Oportunidades todos los días</p>
        <h1 className="sentence">
          Busco trabajo{' '}
          <Pick label="Modalidad" value={f.mod} onChange={set('mod')} any="en cualquier modalidad" opts={Object.entries(MODALITIES) as Opt[]} />{' '}
          en{' '}
          <Pick label="Rubro" value={f.cat} onChange={set('cat')} any="cualquier rubro" opts={Object.entries(CATEGORIES) as Opt[]} />{' '}
          <Pick label="Experiencia" value={f.exp} onChange={set('exp')} any="con o sin experiencia"
            opts={Object.entries(EXPERIENCES).map(([v, l]): Opt => [v, l, v === 'sin_experiencia' ? l : 'nivel ' + l])} />
          .
        </h1>
        <div className="refine">
          <input type="search" value={f.q ?? ''} onChange={(e) => set('q')(e.target.value)} placeholder="O escribí un puesto: recepcionista, data entry…" aria-label="Buscar por puesto" />
          <Pick label="Jornada" value={f.jor} onChange={set('jor')} any="cualquier jornada" opts={SCHEDULES.map((s): Opt => [s, s])} />
        </div>
      </section>

      <div className="count" aria-live="polite">
        <p>
          <b>{list.length}</b> {list.length === 1 ? 'aviso vigente' : 'avisos vigentes'}
          {list.length > 0 && !premium && <> · <b>{openCount}</b> {openCount === 1 ? 'se abre' : 'se abren'} gratis hoy</>}
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
      {!premium && <p className="fine">Mostramos gratis los {FREE_PER_DAY} avisos más nuevos. Los demás se abren con Premium.</p>}
    </>
  )
}
