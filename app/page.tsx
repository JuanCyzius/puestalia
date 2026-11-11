import Link from 'next/link'
import { freeIds, isPremium, listJobs } from '@/lib/db'
import { getUser } from '@/lib/session'
import { FREE_PER_DAY, type Filters } from '@/lib/types'
import { Catalog, type CardData } from './catalog'

export const dynamic = 'force-dynamic'

// Es una secuencia real: lo que hace la persona, en orden.
const STEPS = [
  ['Completá la frase', 'Elegís modalidad, rubro y experiencia. Los avisos cambian al instante, sin recargar ni registrarte.'],
  ['Leé la ficha en diez segundos', 'Todos los avisos tienen el mismo orden: horario, sueldo, requisitos. Si la empresa no publicó un dato, dice “No informado”.'],
  ['Postulate en un toque', 'Si la empresa dejó un mail, el botón abre tu correo con destinatario, asunto y mensaje escritos. Adjuntás el CV y enviás.'],
]

export default async function Home({ searchParams }: { searchParams: Promise<Filters> }) {
  const [f, jobs, free, user] = await Promise.all([searchParams, listJobs(), freeIds(), getUser()])
  const premium = await isPremium(user?.id)
  const cards: CardData[] = jobs.map((j) => {
    const open = premium || free.has(j.id)
    return {
      id: j.id, title: j.title, category: j.category, modality: j.modality, experience: j.experience, schedule_type: j.schedule_type,
      published_at: j.published_at, expires_at: j.expires_at, open, free: free.has(j.id),
      company: open ? j.company : null, location: open ? j.location : null, salary: open ? j.salary : null,
    }
  })

  return (
    <>
      <Catalog cards={cards} premium={premium} initial={{ q: f.q, cat: f.cat, mod: f.mod, exp: f.exp, jor: f.jor }} />

      <section className="how">
        <h2>Cómo se usa</h2>
        <ol>
          {STEPS.map(([t, d]) => <li key={t}><h3>{t}</h3><p>{d}</p></li>)}
        </ol>
        <p className="promise">Cada aviso se lee antes de publicarse, enlaza a su fuente y se baja solo a los 30 días. Los que piden plata o datos bancarios no entran.</p>
      </section>

      {!premium && (
        <section className="cta">
          <h2>Los {FREE_PER_DAY} más nuevos son gratis. Con Premium abrís todos.</h2>
          <p>Todos los avisos vigentes de los últimos 30 días, con empresa, contacto y enlace para postularte.</p>
          <Link className="btn" href="/premium">Quiero Premium</Link>
        </section>
      )}
    </>
  )
}
