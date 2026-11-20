import type { Metadata } from 'next'
import Link from 'next/link'
import { money, SERVICES, type ServiceId } from '@/lib/services'
import { TrustBand } from '../trust'

export const metadata: Metadata = {
  title: 'Te armamos el CV y te acompañamos en tu búsqueda',
  description: 'CV profesional reescrito, carta de presentación, LinkedIn y acompañamiento de 30 días para postularte mejor. Pago único con Mercado Pago.',
  alternates: { canonical: '/servicios' },
}

const FAQ = [
  ['¿Me garantizan que voy a conseguir trabajo?', 'No. Nadie serio puede garantizarlo: la decisión es de cada empresa. Lo que hacemos es que tu CV se entienda rápido, que te postules a lo que de verdad encaja con vos y que llegues mejor preparado a las entrevistas.'],
  ['¿Cómo les mando mi CV?', 'Lo subís en el formulario del pedido (PDF, Word o foto). Si no tenés CV, contanos tu experiencia y estudios y lo armamos desde cero.'],
  ['¿Cómo lo recibo?', 'Por mail, en PDF y en Word, dentro del plazo de cada servicio (días hábiles). Si querés cambios, respondés ese mail.'],
  ['¿Se cobra algo más después?', 'No. Es un pago único con Mercado Pago, sin débito automático.'],
  ['¿Y si me arrepiento?', 'Tenés 10 días para arrepentirte de una compra online. Si todavía no empezamos tu pedido, te devolvemos el total.'],
]

export default function Servicios() {
  return (
    <div className="page">
      <p className="kicker">Servicios</p>
      <h1>Tu CV listo para pasar el primer filtro.</h1>
      <p className="lead">Un reclutador mira cada CV unos pocos segundos. Te lo dejamos claro, ordenado y apuntado al puesto que buscás. Y si querés, te acompañamos un mes entero en la búsqueda.</p>

      <div className="plans">
        {(Object.keys(SERVICES) as ServiceId[]).map((id) => {
          const s = SERVICES[id]
          return (
            <article key={id} className={s.featured ? 'plan featured' : 'plan'} id={id}>
              {s.featured && <span className="badge">El más elegido</span>}
              <h3>{s.name}</h3>
              <p className="price">{money(s.price)} <small>pago único</small></p>
              <p className="tag-line">{s.tagline}</p>
              <ul>{s.includes.map((i) => <li key={i}>{i}</li>)}</ul>
              <p className="when">{s.delivery}</p>
              <Link className={s.featured ? 'btn' : 'btn ghost'} href={`/servicios/pedir?p=${id}`}>Pedir {s.name}</Link>
            </article>
          )
        })}
      </div>
      <p className="honest">No prometemos conseguirte trabajo: eso depende de cada empresa. Prometemos un CV claro, una búsqueda ordenada y devoluciones honestas.</p>

      <h2>Cómo funciona</h2>
      <ol className="steps3">
        <li><b>Elegís el servicio</b><br />Completás un formulario corto y subís tu CV (o nos contás tu experiencia).</li>
        <li><b>Pagás con Mercado Pago</b><br />Pago único, con el medio que prefieras.</li>
        <li><b>Lo trabajamos</b><br />Lo reescribimos pensando en el puesto que buscás.</li>
        <li><b>Te llega por mail</b><br />En PDF y Word. Si querés cambios, respondés el mail.</li>
      </ol>

      <h2>Preguntas frecuentes</h2>
      <div className="faq">{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>

      <TrustBand />
    </div>
  )
}
