import { FREE_PER_DAY } from '@/lib/types'
import { Waitlist } from './waitlist'

export const metadata = { title: 'Premium' }

export default function Premium() {
  return (
    <article className="job">
      <div className="kicker">Puestalia Premium</div>
      <h1>Todos los avisos, no solo los {FREE_PER_DAY} de hoy.</h1>
      <p className="co">Estamos por abrir las suscripciones. Dejá tu mail y te avisamos primero, con precio de lanzamiento.</p>
      <dl className="facts">
        <div><dt>Catálogo</dt><dd>Todos los avisos vigentes de los últimos 30 días</dd></div>
        <div><dt>Búsqueda</dt><dd>Filtros completos sobre todo el catálogo</dd></div>
        <div><dt>Postulación</dt><dd>CV guardado y envío en un clic (próximamente)</dd></div>
        <div><dt>Precio</dt><dd>$4.900 por mes · cancelás cuando quieras</dd></div>
      </dl>
      <Waitlist />
      <p className="note">Solo usamos tu mail para avisarte del lanzamiento. Podés pedir la baja cuando quieras.</p>
    </article>
  )
}
