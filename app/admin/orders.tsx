'use client'
import { useCallback, useEffect, useState } from 'react'
import { money, SERVICES, type ServiceId } from '@/lib/services'

type O = { id: string; email: string; name: string; phone: string | null; product: string; price: number; target: string | null; notes: string | null; cv_url: string | null; status: string; created_at: string; paid_at: string | null }
type H = { id: string; name: string; role: string; company: string | null; testimonial: string | null; can_publish: boolean; approved: boolean; created_at: string }

const post = (url: string, body: unknown) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
const when = (iso: string) => new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })
const LABEL: Record<string, string> = { pending: 'Sin pagar', paid: 'Pagado: por hacer', in_progress: 'En proceso', delivered: 'Entregado', cancelled: 'Cancelado' }

/** Pedidos de CV y acompañamiento: qué hay que hacer, con el CV para descargar y el mail para entregar. */
export function Orders() {
  const [list, setList] = useState<O[] | null>(null)
  const [all, setAll] = useState(false)
  const load = useCallback(() => fetch('/api/admin/orders').then((r) => r.json()).then((d) => setList(Array.isArray(d) ? d : [])).catch(() => setList([])), [])
  useEffect(() => { load() }, [load])
  const set = async (id: string, status: string) => { await post('/api/admin/orders', { id, status }); load() }
  if (!list) return null
  const todo = list.filter((o) => o.status === 'paid' || o.status === 'in_progress')
  const shown = all ? list : todo
  return (
    <section className="adm-box" aria-label="Pedidos">
      <div className="adm-head"><h2>Pedidos {todo.length > 0 && <span className="pill">{todo.length} por hacer</span>}</h2>
        <button className="clear" onClick={() => setAll(!all)}>{all ? 'Ver solo por hacer' : `Ver todos (${list.length})`}</button></div>
      {shown.length === 0 && <p className="note">{all ? 'Todavía no hay pedidos.' : 'No hay pedidos pagados pendientes.'}</p>}
      {shown.map((o) => (
        <article key={o.id} className="order">
          <p><b>{SERVICES[o.product as ServiceId]?.name ?? o.product}</b> · {money(Number(o.price))} · <span className={'st st-' + o.status}>{LABEL[o.status] ?? o.status}</span> · {when(o.paid_at ?? o.created_at)}</p>
          <p>{o.name} · <a href={`mailto:${o.email}?subject=${encodeURIComponent('Tu pedido en Puestalia')}`}>{o.email}</a>{o.phone && <> · <a href={`https://wa.me/${o.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">WhatsApp {o.phone}</a></>}</p>
          <p><b>Busca:</b> {o.target}</p>
          {o.notes && <p className="notes">{o.notes}</p>}
          <div className="row">
            {o.cv_url && <a className="btn sm ghost" href={o.cv_url} target="_blank" rel="noreferrer">Descargar CV</a>}
            {o.status === 'paid' && <button className="btn sm ghost" onClick={() => set(o.id, 'in_progress')}>Empezar</button>}
            {(o.status === 'paid' || o.status === 'in_progress') && <button className="btn sm" onClick={() => set(o.id, 'delivered')}>Marcar entregado</button>}
          </div>
        </article>
      ))}
    </section>
  )
}

/** Historias de "conseguí trabajo": se publican solo si la persona autorizó y vos aprobás. */
export function Hires() {
  const [list, setList] = useState<H[] | null>(null)
  const load = useCallback(() => fetch('/api/admin/hires').then((r) => r.json()).then((d) => setList(Array.isArray(d) ? d : [])).catch(() => setList([])), [])
  useEffect(() => { load() }, [load])
  if (!list || list.length === 0) return null
  return (
    <section className="adm-box" aria-label="Historias">
      <div className="adm-head"><h2>Conseguí trabajo <span className="pill">{list.length} en total</span></h2></div>
      {list.slice(0, 20).map((h) => (
        <article key={h.id} className="order">
          <p><b>{h.name}</b> · {h.role}{h.company ? ` en ${h.company}` : ''} · {when(h.created_at)}</p>
          {h.testimonial && <p className="notes">“{h.testimonial}”</p>}
          <div className="row">
            {h.can_publish
              ? <button className={h.approved ? 'btn sm ghost' : 'btn sm'} onClick={async () => { await post('/api/admin/hires', { id: h.id, approved: !h.approved }); load() }}>{h.approved ? 'Ocultar de la web' : 'Publicar en la web'}</button>
              : <span className="note">No autorizó publicarlo (igual suma al contador).</span>}
          </div>
        </article>
      ))}
    </section>
  )
}
