import Link from 'next/link'
import { isPremium, listJobs } from '@/lib/db'
import { PRICE } from '@/lib/mp'
import { getUser } from '@/lib/session'
import { FREE_DELAY_DAYS, freeAt, type Filters } from '@/lib/types'
import { Catalog, type CardData } from './catalog'

export const dynamic = 'force-dynamic'

// Es una secuencia real: lo que hace la persona, en orden.
const STEPS = [
  ['Completá la frase', 'Elegís modalidad, rubro y experiencia. Los avisos cambian al instante, sin recargar ni registrarte.'],
  ['Leé la ficha en diez segundos', 'Todos los avisos tienen el mismo orden: horario, sueldo, requisitos. Si la empresa no publicó un dato, dice “No informado”.'],
  ['Postulate en un toque', 'Si la empresa dejó un mail, el botón abre tu correo con destinatario, asunto y mensaje escritos. Adjuntás el CV y enviás.'],
]

export default async function Home({ searchParams }: { searchParams: Promise<Filters> }) {
  const [f, jobs, user] = await Promise.all([searchParams, listJobs(), getUser()])
  const premium = await isPremium(user?.id)
  const cards: CardData[] = jobs.map((j) => {
    const free_at = freeAt(j)
    const open = premium || free_at.getTime() <= Date.now()
    return {
      id: j.id, title: j.title, category: j.category, modality: j.modality, experience: j.experience, schedule_type: j.schedule_type,
      published_at: j.published_at, expires_at: j.expires_at, free_at: free_at.toISOString(), open, direct: !!j.contact_email,
      company: open ? j.company : null, location: open ? j.location : null, salary: open ? j.salary : null,
    }
  })

  return (
    <>
      <Catalog cards={cards} premium={premium} initial={{ q: f.q, cat: f.cat, mod: f.mod, exp: f.exp, jor: f.jor, dir: f.dir }} />

      <section className="how">
        <h2>Cómo se usa</h2>
        <ol>
          {STEPS.map(([t, d]) => <li key={t}><h3>{t}</h3><p>{d}</p></li>)}
        </ol>
        <p className="promise">Cada aviso se lee antes de publicarse, enlaza a su fuente y se baja solo a los 30 días. Los que piden plata o datos bancarios no entran.</p>
      </section>

      <section className="app-cta">
        <div>
          <h2>Que las ofertas te lleguen al celular</h2>
          <p>Instalá Puestalia como app y activá las notificaciones. Elegís rubro, modalidad y experiencia, y te avisamos solo de lo que te sirve.</p>
        </div>
        <Link className="btn ghost" href={user ? '/cuenta#avisos' : '/ingresar?next=/cuenta%23avisos'}>Activar avisos</Link>
      </section>

      {!premium && (
        <section className="cta">
          <h2>Premium te muestra cada oferta apenas entra. Gratis, {FREE_DELAY_DAYS} días después.</h2>
          <p>Postularte en los primeros días suele pesar: muchos reclutadores leen primero los CV que llegan antes. Pase de 30 días por ${PRICE.toLocaleString('es-AR')}, pago único, sin débito automático.</p>
          <Link className="btn" href="/premium">Quiero verlas primero</Link>
        </section>
      )}
    </>
  )
}
