import type { Metadata } from 'next'
import Link from 'next/link'
import { isPremium, listJobs } from '@/lib/db'
import { PRICE } from '@/lib/mp'
import { money, SERVICES } from '@/lib/services'
import { getUser } from '@/lib/session'
import { FREE_DELAY_DAYS, freeAt } from '@/lib/types'
import { Card } from './catalog'
import { LD, toCards } from './home-view'
import { TrustBand } from './trust'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { alternates: { canonical: '/' } }

const PER_DAY = Math.ceil(PRICE / 30)

/**
 * Inicio: explica en una pantalla qué es Puestalia y la diferencia entre Gratis y Premium,
 * y muestra una muestra de cada lista. El buscador completo vive en /empleos y /gratis.
 */
export default async function Home() {
  const [jobs, user] = await Promise.all([listJobs(), getUser()])
  const premium = await isPremium(user?.id)
  const now = Date.now()
  const fresh = jobs.filter((j) => freeAt(j).getTime() > now)
  const free = jobs.filter((j) => freeAt(j).getTime() <= now)
  const today = jobs.filter((j) => now - new Date(j.published_at).getTime() < 86400000).length

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }} />

      <section className="home-hero">
        <p className="kicker">Oportunidades todos los días</p>
        <h1>Trabajos remotos, administrativos y sin experiencia, en un solo lugar.</h1>
        <p className="sub">Avisos revisados, vigentes y, cuando se puede, con el mail directo del reclutador.</p>
        <form action="/empleos" className="hsearch" role="search">
          <input type="search" name="q" placeholder="¿Qué puesto buscás? Ej.: recepcionista, data entry" aria-label="Buscar puesto" />
          <button className="btn">Buscar</button>
        </form>
        <nav className="quick" aria-label="Atajos">
          <Link href="/trabajo-remoto">Remoto</Link>
          <Link href="/empleos-sin-experiencia">Sin experiencia</Link>
          <Link href="/empleos-administrativos">Administración</Link>
          <Link href="/gratis">Gratis</Link>
        </nav>
        {jobs.length > 0 && (
          <p className="live"><span className="dot" aria-hidden /> {jobs.length} avisos vigentes{today > 0 ? ` · ${today} nuevos en las últimas 24 h` : ''}</p>
        )}
      </section>

      {/* La decisión central de la página: esperar gratis o verlo ya. */}
      <section className="plans2" aria-label="Gratis o Premium">
        <article className="p-free">
          <p className="lbl">Gratis</p>
          <p className="pr">$0</p>
          {jobs.length > 0 && <p className="total">{free.length} de {jobs.length} puestos abiertos</p>}
          <ul>
            <li>Cada aviso se abre <b>{FREE_DELAY_DAYS} días después</b> de publicado</li>
            <li>Empresa, contacto y cómo postularte</li>
            <li>Buscador y filtros completos</li>
          </ul>
          <Link className="btn ghost" href="/gratis">Ver {free.length > 0 ? `los ${free.length} puestos gratis` : 'puestos gratis'}</Link>
        </article>
        <article className="p-prem">
          <p className="lbl">Premium <span>recomendado</span></p>
          <p className="pr">{money(PRICE)} <small>por 30 días</small></p>
          {jobs.length > 0 && (
            <p className="total">Accedés a <b>los {jobs.length} puestos</b> vigentes{fresh.length > 0 ? <>: {free.length} gratis <b>+ {fresh.length} que solo ves con Premium</b></> : ''}.</p>
          )}
          <p className="perday">Todo el mes por <b>menos que dos cafés</b> en un bar porteño: unos <b>${PER_DAY} por día</b>.</p>
          <ul>
            <li>Ves <b>cada aviso apenas entra</b>, sin esperar {FREE_DELAY_DAYS} días</li>
            <li>Te avisamos al <b>celular o la compu</b> cuando entra lo que buscás</li>
            <li>Postulate <b>entre los primeros</b>, cuando más se leen los CV</li>
            <li>Pago único, <b>sin débito automático</b></li>
          </ul>
          {premium
            ? <Link className="btn" href="/empleos">Ya tenés Premium: ver todo</Link>
            : <Link className="btn" href="/premium">Quiero Premium</Link>}
        </article>
      </section>
      <p className="why">¿Por qué importa? Muchos reclutadores leen primero los CV que llegan en los primeros días y, cuando ya tienen candidatos, cierran la búsqueda. Llegar antes no te garantiza el puesto, pero te pone adelante en la fila.</p>

      {fresh.length > 0 && (
        <section className="shelf">
          <div className="shelf-head">
            <h2>Recién llegados {premium ? '' : <span className="pill dark">Premium</span>}</h2>
            <Link href="/empleos">Ver todos →</Link>
          </div>
          <div className="grid">{toCards(fresh.slice(0, 6), premium).map((c, i) => <Card key={c.id} c={c} i={i} />)}</div>
        </section>
      )}

      {free.length > 0 && (
        <section className="shelf">
          <div className="shelf-head">
            <h2>Gratis, ya desbloqueados <span className="pill">Gratis</span></h2>
            <Link href="/gratis">Ver los {free.length} →</Link>
          </div>
          <div className="grid">{toCards(free.slice(0, 6), premium).map((c, i) => <Card key={c.id} c={c} i={i} />)}</div>
        </section>
      )}

      <section className="how2">
        <h2>Así de simple</h2>
        <ol>
          <li><b>Buscá</b> por puesto, o entrá a Remoto, Sin experiencia o Administración.</li>
          <li><b>Leé la ficha</b>: todas tienen el mismo orden (horario, sueldo y requisitos).</li>
          <li><b>Postulate</b>: si hay mail directo, se abre tu correo con el mensaje armado.</li>
        </ol>
      </section>

      <TrustBand />

      <section className="svc-teaser" aria-label="Servicios">
        <Link href="/servicios#cv-express"><b>Te hacemos el CV</b><span>Reescrito, claro y apuntado al puesto que buscás.</span><em>Desde {money(SERVICES['cv-express'].price)} →</em></Link>
        <Link href="/servicios#acompanamiento"><b>Acompañamiento 30 días</b><span>Plan de búsqueda, tips semanales y simulacro de entrevista. Premium incluido.</span><em>{money(SERVICES.acompanamiento.price)} →</em></Link>
        <Link href={user ? '/cuenta#avisos' : '/ingresar?next=/cuenta%23avisos'}><b>Avisos al celular</b><span>Instalá la app y elegí qué querés recibir.</span><em>Activar →</em></Link>
      </section>

      {!premium && (
        <section className="cta">
          <h2>No esperes {FREE_DELAY_DAYS} días para ver la próxima oferta.</h2>
          <p>{money(PRICE)} por 30 días, unos ${PER_DAY} por día. Pago único con Mercado Pago, sin débito automático.</p>
          <Link className="btn" href="/premium">Quiero Premium</Link>
        </section>
      )}
    </>
  )
}
