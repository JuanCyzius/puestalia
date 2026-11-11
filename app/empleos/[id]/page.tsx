import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { freeIds, getJob } from '@/lib/db'
import { CATEGORIES, EXPERIENCES, MODALITIES } from '@/lib/types'
import { dmy, left } from '@/lib/format'
import { Apply } from './apply'

export const dynamic = 'force-dynamic'
type P = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const j = await getJob((await params).id)
  return j ? { title: j.title, description: `${j.title} · ${MODALITIES[j.modality!] ?? ''} · Aviso vigente en Puestalia` } : {}
}

export default async function JobPage({ params }: P) {
  const { id } = await params
  const j = await getJob(id)
  if (!j) notFound() // vencido o inexistente: deja de estar disponible a la hora exacta de vencimiento
  const open = (await freeIds()).has(j.id)

  if (!open)
    return (
      <article className="job">
        <div className="kicker">Aviso Premium</div>
        <h1>{j.title}</h1>
        <p className="co">{CATEGORIES[j.category]} · {j.modality ? MODALITIES[j.modality] : 'Modalidad no informada'}</p>
        <section className="cta">
          <h2>Este aviso ya salió de los gratuitos de hoy.</h2>
          <p>Con Premium ves la ficha completa, la empresa y cómo postularte, en este y en todos los avisos vigentes.</p>
          <Link className="btn" href="/premium">Quiero Premium</Link>
        </section>
      </article>
    )

  const F = ({ k, v }: { k: string; v: string | null | undefined }) => (
    <div><dt>{k}</dt><dd className={v ? '' : 'na'}>{v || 'No informado'}</dd></div>
  )
  const ld = {
    '@context': 'https://schema.org', '@type': 'JobPosting', title: j.title, description: j.description,
    datePosted: j.published_at, validThrough: j.expires_at,
    hiringOrganization: j.company ? { '@type': 'Organization', name: j.company } : undefined,
    jobLocationType: j.modality === 'remoto' ? 'TELECOMMUTE' : undefined,
    applicantLocationRequirements: j.modality === 'remoto' ? { '@type': 'Country', name: 'Argentina' } : undefined,
    jobLocation: j.location ? { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: j.location, addressCountry: 'AR' } } : undefined,
  }

  return (
    <article className="job">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <div className="kicker">{CATEGORIES[j.category] ?? 'Otros'} · {left(j.expires_at)}</div>
      <h1>{j.title}</h1>
      <div className="co">{j.company ?? 'Empresa confidencial'}</div>
      <dl className="facts">
        <F k="Ubicación" v={j.location} />
        <F k="Modalidad" v={j.modality && MODALITIES[j.modality]} />
        <F k="Jornada" v={j.schedule_type} />
        <F k="Horarios" v={j.hours} />
        <F k="Salario" v={j.salary} />
        <F k="Experiencia" v={j.experience && EXPERIENCES[j.experience]} />
        <F k="Estudios" v={j.education} />
      </dl>
      <h2>El puesto</h2>
      <p>{j.description}</p>
      {j.requirements && (<><h2>Requisitos</h2><p>{j.requirements}</p></>)}
      {j.benefits && (<><h2>Beneficios</h2><p>{j.benefits}</p></>)}
      <p className="note">
        Publicado en Puestalia el {dmy(j.published_at)}
        {j.source_published_at && ` · Aviso original del ${dmy(j.source_published_at + 'T12:00:00-03:00')}`}
        {j.source && ` · Fuente: ${j.source}`}
      </p>
      <Apply title={j.title} email={j.contact_email} url={j.apply_url} />
      <p className="note">Puestalia no es el empleador. Nunca pagues ni des datos bancarios para postularte.</p>
    </article>
  )
}
