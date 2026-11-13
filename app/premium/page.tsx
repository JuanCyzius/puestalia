import Link from 'next/link'
import { isPremium } from '@/lib/db'
import { mpReady, PRICE } from '@/lib/mp'
import { getUser } from '@/lib/session'
import { FREE_DELAY_DAYS } from '@/lib/types'
import { Waitlist } from './waitlist'

export const metadata = { title: 'Premium' }
export const dynamic = 'force-dynamic'

export default async function Premium() {
  const user = await getUser()
  const premium = await isPremium(user?.id)
  const price = '$' + PRICE.toLocaleString('es-AR')
  return (
    <article className="job">
      <p className="kicker">Puestalia Premium</p>
      <h1>Cada oferta apenas entra, no {FREE_DELAY_DAYS} días después.</h1>
      <p className="co">{mpReady() ? 'Pagás una vez y tenés 30 días. Sin débito automático.' : 'Estamos por abrir los pagos. Dejá tu mail y te avisamos primero.'}</p>
      <dl className="facts">
        <div><dt>Con Premium</dt><dd>Ves cada aviso en el momento en que lo publicamos, y te avisamos al celular</dd></div>
        <div><dt>Gratis</dt><dd>Cada aviso se abre {FREE_DELAY_DAYS} días (72 horas) después de publicado</dd></div>
        <div><dt>Precio</dt><dd>{price} por 30 días, pago único</dd></div>
        <div><dt>Renovación</dt><dd>No se renueva sola: si querés seguir, volvés a pagar</dd></div>
      </dl>
      {premium ? (
        <p><Link className="btn" href="/">Ya tenés Premium: ver los avisos</Link></p>
      ) : mpReady() ? (
        <>
          <p><Link className="btn" href={user ? '/cuenta' : '/ingresar?next=/cuenta'}>Pagar {price} · 30 días</Link></p>
          <p className="note">{user ? 'Seguís en tu cuenta y de ahí a Mercado Pago.' : 'Primero ingresás con tu mail, así sabemos a quién darle el acceso.'} Puestalia no ve ni guarda los datos de tu tarjeta.</p>
        </>
      ) : (
        <>
          <Waitlist />
          <p className="note">Solo usamos tu mail para avisarte del lanzamiento. Podés pedir la baja cuando quieras.</p>
        </>
      )}
    </article>
  )
}
