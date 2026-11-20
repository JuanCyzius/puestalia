import type { Metadata } from 'next'
import Link from 'next/link'
import { listHires } from '@/lib/db'
import { TrustBand } from '../trust'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Quiénes somos',
  description: 'Puestalia es un proyecto argentino que junta en un solo lugar ofertas de trabajo remotas, administrativas y sin experiencia, revisadas y vigentes.',
  alternates: { canonical: '/quienes-somos' },
}

export default async function QuienesSomos() {
  const stories = (await listHires(true).catch(() => [])).filter((h) => h.testimonial).slice(0, 6)
  return (
    <div className="page">
      <p className="kicker">Quiénes somos</p>
      <h1>Buscar trabajo no debería ser un segundo trabajo.</h1>
      <p className="lead">Puestalia nació en Argentina de una bronca simple: para encontrar un aviso que sirva había que recorrer cinco portales, esquivar avisos viejos, repetidos o directamente truchos, y mandar el CV a formularios que nadie lee.</p>

      <h2>Qué hacemos</h2>
      <p>Juntamos en un solo lugar ofertas <b>remotas</b>, <b>administrativas</b> y <b>sin experiencia</b>. Cada aviso se revisa antes de salir, se ordena siempre igual (horario, sueldo, requisitos; si un dato no está, lo decimos) y se baja solo cuando vence. Cuando la empresa lo permite, te mostramos el <b>mail directo</b> para que tu CV le llegue a una persona.</p>

      <h2>Lo que nos importa</h2>
      <ol className="steps3">
        <li><b>Avisos reales</b><br />Si un aviso te pide plata para postularte, no entra. Si ves algo raro, nos escribís y lo bajamos.</li>
        <li><b>Nada de promesas vacías</b><br />No te vamos a decir que conseguís trabajo en X días. Te ayudamos a buscar mejor y más rápido.</li>
        <li><b>Precios claros</b><br />Lo gratis es gratis. Premium y los servicios son pagos únicos, sin débito automático.</li>
      </ol>

      {stories.length > 0 && (
        <>
          <h2>Historias de quienes consiguieron trabajo</h2>
          <div className="stories">{stories.map((s) => <blockquote key={s.id}>“{s.testimonial}”<cite>{s.name} · {s.role}{s.company ? ` en ${s.company}` : ''}</cite></blockquote>)}</div>
        </>
      )}

      <TrustBand />
      <p style={{ marginTop: 24 }}><Link className="btn" href="/empleos">Ver los puestos de hoy</Link></p>
    </div>
  )
}
