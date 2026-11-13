import Link from 'next/link'
import { isPremium } from '@/lib/db'
import { mpReady, PRICE } from '@/lib/mp'
import { getUser } from '@/lib/session'
import { FREE_PER_DAY } from '@/lib/types'
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
      <h1>Todos los avisos, no solo los {FREE_PER_DAY} de hoy.</h1>
      <p className="co">{mpReady() ? 'Pagás una vez y tenés 30 días. Sin débito automático.' : 'Estamos por abrir los pagos. Dejá tu mail y te avisamos primero.'}</p>
      <dl className="facts">
        <div><dt>Catálogo</dt><dd>Todos los avisos vigentes de los últimos 30 días</dd></div>
        <div><dt>Datos</dt><dd>Empresa, contacto y enlace en cada aviso</dd></div>
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
