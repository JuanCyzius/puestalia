import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSub } from '@/lib/db'
import { mpReady, PRICE, syncSubscription } from '@/lib/mp'
import { getUser } from '@/lib/session'
import { dmy } from '@/lib/format'
import { Cancel, ChangePassword, Logout, Subscribe } from './ui'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Mi cuenta', robots: { index: false } }

export default async function Cuenta({ searchParams }: { searchParams: Promise<{ preapproval_id?: string }> }) {
  const user = await getUser()
  if (!user) redirect('/ingresar?next=/cuenta')
  // Al volver de Mercado Pago se consulta el estado en el momento, sin esperar el aviso.
  const back = (await searchParams).preapproval_id
  let sub = await getSub(user.id)
  const pending = back ?? (sub?.status === 'pending' ? sub.mp_preapproval_id : null)
  if (pending && mpReady()) {
    await syncSubscription(pending, user.id).catch(() => null)
    sub = await getSub(user.id)
  }
  const premium = sub?.status === 'authorized'
  const price = '$' + PRICE.toLocaleString('es-AR')

  return (
    <article className="job">
      <p className="kicker">Mi cuenta</p>
      <h1>{premium ? 'Tenés Premium activo.' : 'Estás en el plan gratuito.'}</h1>
      <p className="co">{user.email}</p>
      <dl className="facts">
        <div><dt>Plan</dt><dd>{premium ? 'Premium' : 'Gratuito'}</dd></div>
        <div><dt>Acceso</dt><dd>{premium ? 'Todos los avisos vigentes' : 'Los 8 avisos más nuevos'}</dd></div>
        {premium && <div><dt>Precio</dt><dd>{price} por mes</dd></div>}
        {premium && sub?.next_payment_date && <div><dt>Próximo cobro</dt><dd>{dmy(sub.next_payment_date)}</dd></div>}
      </dl>
      {back && !premium && <p className="msg err">Mercado Pago todavía no confirmó el pago. Si lo completaste, recargá esta página en un minuto.</p>}
      {premium ? (
        <>
          <p><Link className="btn" href="/">Ver todos los avisos</Link></p>
          <h2>Suscripción</h2>
          <p>Se debita todos los meses desde tu cuenta de Mercado Pago. Podés cancelarla acá cuando quieras.</p>
          <div style={{ marginTop: 14 }}><Cancel /></div>
        </>
      ) : mpReady() ? (
        <>
          <h2>Pasate a Premium</h2>
          <p>Todos los avisos vigentes de los últimos 30 días, con empresa, contacto y enlace para postularte.</p>
          <Subscribe email={sub?.payer_email ?? user.email} price={price} />
        </>
      ) : (
        <p className="note">Las suscripciones todavía no están abiertas.</p>
      )}
      <h2>Acceso</h2>
      <ChangePassword />
      <p style={{ marginTop: 20 }}><Logout /></p>
    </article>
  )
}
