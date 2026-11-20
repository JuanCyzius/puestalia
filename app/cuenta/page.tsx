import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPasses, getSub, listOrders, listPushSubs, PASS_DAYS, premiumUntil } from '@/lib/db'
import { SERVICES, type ServiceId } from '@/lib/services'
import { mpReady, PRICE, syncPayment } from '@/lib/mp'
import { getUser } from '@/lib/session'
import { dmy } from '@/lib/format'
import { BuyPass, Cancel, ChangePassword, Logout } from './ui'
import { Avisos } from './avisos'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mi cuenta', robots: { index: false } }

const STATUS: Record<string, string> = { pending: 'Esperando el pago', paid: 'Pagado · en cola', in_progress: 'En proceso', delivered: 'Entregado', cancelled: 'Cancelado' }
const daysLeft = (d: Date) => Math.max(1, Math.ceil((d.getTime() - Date.now()) / 86400000))

export default async function Cuenta({ searchParams }: { searchParams: Promise<{ payment_id?: string; collection_id?: string; status?: string; pedido?: string }> }) {
  const user = await getUser()
  if (!user) redirect('/ingresar?next=/cuenta')
  // Al volver de Mercado Pago se consulta el pago en el momento, sin esperar el aviso.
  const sp = await searchParams
  const back = sp.payment_id ?? sp.collection_id
  if (back && /^\d+$/.test(back) && mpReady()) await syncPayment(back, user.id).catch(() => null)

  const until = await premiumUntil(user.id)
  const sub = await getSub(user.id)
  const oldSub = sub?.status === 'authorized' // suscripción con débito de antes del cambio
  const premium = !!until || oldSub
  const waiting = (await getPasses(user.id).catch(() => [])).some((p) => p.status === 'pending' || p.status === 'in_process')
  const price = '$' + PRICE.toLocaleString('es-AR')
  const orders = await listOrders(user.id).catch(() => [])
  const saved = (await listPushSubs(user.id).catch(() => [])).map((s) => ({ endpoint: s.endpoint, cats: s.cats, mods: s.mods, exps: s.exps }))

  return (
    <article className="job">
      <p className="kicker">Mi cuenta</p>
      <h1>{premium ? 'Tenés Premium activo.' : 'Estás en el plan gratuito.'}</h1>
      <p className="co">{user.email}</p>
      <dl className="facts">
        <div><dt>Plan</dt><dd>{premium ? 'Premium' : 'Gratuito'}</dd></div>
        <div><dt>Acceso</dt><dd>{premium ? 'Cada aviso apenas entra' : 'Cada aviso 3 días después de publicado'}</dd></div>
        {until && <div><dt>Premium hasta</dt><dd>{dmy(until.toISOString())} · {daysLeft(until)} {daysLeft(until) === 1 ? 'día' : 'días'}</dd></div>}
        {until && <div><dt>Renovación</dt><dd>No se renueva sola</dd></div>}
      </dl>
      {back && sp.status === 'rejected' && !waiting && <p className="msg err">Mercado Pago no aprobó el pago. Podés intentar de nuevo con otro medio.</p>}
      {waiting && !premium && <p className="msg">Tu pago está pendiente. Si pagaste en efectivo, Mercado Pago puede tardar unas horas en acreditarlo; cuando lo haga, Premium se activa solo.</p>}

      {premium && <p><Link className="btn" href="/">Ver todos los avisos</Link></p>}

      {mpReady() ? (
        <>
          <h2>{until ? 'Sumar 30 días más' : `Premium por ${PASS_DAYS} días`}</h2>
          <p>
            {until
              ? `Si comprás otro pase, los ${PASS_DAYS} días se suman al final del que tenés: no perdés ningún día.`
              : `Pagás una sola vez ${price} y tenés ${PASS_DAYS} días de acceso a todos los avisos. No hay débito automático: si querés seguir, volvés a pagar.`}
          </p>
          <BuyPass price={price} again={!!until} />
        </>
      ) : (
        !premium && <p className="note">Los pagos todavía no están abiertos.</p>
      )}

      {oldSub && (
        <>
          <h2>Suscripción con débito</h2>
          <p>Tenés una suscripción de antes con débito mensual. Podés cancelarla acá cuando quieras.</p>
          <div style={{ marginTop: 14 }}><Cancel /></div>
        </>
      )}

      {sp.pedido === 'ok' && <p className="msg">¡Listo! Recibimos el pago de tu pedido. Te escribimos por mail dentro del plazo del servicio.</p>}
      {sp.pedido === 'pendiente' && <p className="msg">Tu pago está pendiente. Cuando Mercado Pago lo acredite, arrancamos con tu pedido.</p>}
      {sp.pedido === 'error' && <p className="msg err">Mercado Pago no aprobó el pago del pedido. Podés intentar de nuevo desde Servicios.</p>}
      {orders.length > 0 && (
        <>
          <h2 id="pedidos">Mis pedidos</h2>
          <ul className="orders">
            {orders.map((o) => (
              <li key={o.id}><b>{SERVICES[o.product as ServiceId]?.name ?? o.product}</b> · {dmy(o.created_at)} · <span className={'st st-' + o.status}>{STATUS[o.status] ?? o.status}</span></li>
            ))}
          </ul>
        </>
      )}

      <h2 id="avisos">Avisos en el celular y la compu</h2>
      <Avisos saved={saved} premium={premium} />

      <h2>Acceso</h2>
      <ChangePassword />
      <p style={{ marginTop: 20 }}><Logout /></p>
    </article>
  )
}
