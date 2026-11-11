import { FREE_PER_DAY } from '@/lib/types'
import { Waitlist } from './waitlist'

export const metadata = { title: 'Premium' }
export const dynamic = 'force-dynamic'

export default function Premium() {
  // Enlace del plan de suscripción de Mercado Pago. Mientras no esté cargado se muestra la lista de espera.
  const mp = process.env.MP_SUBSCRIPTION_URL
  const pay = mp && /^https:\/\/(www\.mercadopago\.com(\.ar)?|mpago\.la)\//.test(mp) ? mp : null
  return (
    <article className="job">
      <div className="kicker">Puestalia Premium</div>
      <h1>Todos los avisos, no solo los {FREE_PER_DAY} de hoy.</h1>
      <p className="co">{pay ? 'Pagás con Mercado Pago y cancelás cuando quieras.' : 'Estamos por abrir las suscripciones. Dejá tu mail y te avisamos primero, con precio de lanzamiento.'}</p>
      <dl className="facts">
        <div><dt>Catálogo</dt><dd>Todos los avisos vigentes de los últimos 30 días</dd></div>
        <div><dt>Búsqueda</dt><dd>Filtros completos sobre todo el catálogo</dd></div>
        <div><dt>Postulación</dt><dd>CV guardado y envío en un clic (próximamente)</dd></div>
        <div><dt>Precio</dt><dd>$4.900 por mes · cancelás cuando quieras</dd></div>
      </dl>
      {pay ? (
        <>
          <a className="btn" href={pay} rel="noopener">Suscribirme por $4.900 al mes</a>
          <p className="note">El pago se hace en Mercado Pago. Puestalia no ve ni guarda los datos de tu tarjeta.</p>
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
