import Link from 'next/link'
import { isPremium, listJobs } from '@/lib/db'
import { PRICE } from '@/lib/mp'
import { getUser } from '@/lib/session'
import { FREE_DELAY_DAYS, freeAt, type Filters, type Job } from '@/lib/types'
import { Catalog, type CardData } from './catalog'
import { TrustBand } from './trust'
import { money } from '@/lib/services'

const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://puestalia.com').replace(/\/$/, '')
export const LD = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': site + '/#org', name: 'Puestalia', url: site + '/', logo: site + '/icon-512.png', description: 'Avisos de empleo remotos, administrativos y sin experiencia en Argentina.' },
    { '@type': 'WebSite', '@id': site + '/#web', name: 'Puestalia', url: site + '/', inLanguage: 'es-AR', publisher: { '@id': site + '/#org' },
      potentialAction: { '@type': 'SearchAction', target: site + '/empleos?q={search_term_string}', 'query-input': 'required name=search_term_string' } },
  ],
}

/** Arma las tarjetas: a quien no es Premium no le llegan empresa, lugar ni sueldo de los avisos recién llegados. */
export function toCards(jobs: Job[], premium: boolean): CardData[] {
  return jobs.map((j) => {
    const free_at = freeAt(j)
    const open = premium || free_at.getTime() <= Date.now()
    return {
      id: j.id, title: j.title, category: j.category, modality: j.modality, experience: j.experience, schedule_type: j.schedule_type,
      published_at: j.published_at, expires_at: j.expires_at, free_at: free_at.toISOString(), open, direct: !!j.contact_email,
      company: open ? j.company : null, location: open ? j.location : null, salary: open ? j.salary : null,
    }
  })
}

/** Listado con buscador y filtros: /empleos, /gratis y las páginas por tema. */
export async function HomeView({ f, preset, landing, ld, onlyFree, path }: { f: Filters; preset?: Filters; landing?: { h1: string; intro: string }; ld?: boolean; onlyFree?: boolean; path?: string }) {
  const [all, user] = await Promise.all([listJobs(), getUser()])
  const jobs = onlyFree ? all.filter((j) => freeAt(j).getTime() <= Date.now()) : all
  const premium = await isPremium(user?.id)
  const cards = toCards(jobs, premium)
  return (
    <>
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }} />}
      <Catalog cards={cards} premium={premium} preset={preset} path={path} title={landing?.h1} intro={landing?.intro}
        initial={{ q: f.q, cat: f.cat ?? preset?.cat, mod: f.mod ?? preset?.mod, exp: f.exp ?? preset?.exp, jor: f.jor, dir: f.dir }} />
      {!premium && <PremiumStrip />}
      <TrustBand />
    </>
  )
}

/** Recordatorio corto de Premium debajo de los listados. */
export function PremiumStrip() {
  return (
    <section className="pstrip">
      <p><b>¿Querés ver los avisos apenas entran?</b> Con Premium no esperás {FREE_DELAY_DAYS} días: {money(PRICE)} por 30 días, unos ${Math.ceil(PRICE / 30)} por día. Pago único.</p>
      <Link className="btn sm" href="/premium">Quiero Premium</Link>
    </section>
  )
}
