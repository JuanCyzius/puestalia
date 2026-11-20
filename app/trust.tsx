import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { publicStats } from '@/lib/db'

const stats = unstable_cache(() => publicStats().catch(() => null), ['public-stats'], { revalidate: 600 })
const n = (v: number) => v.toLocaleString('es-AR')

/**
 * Franja de confianza. Solo números reales de la base, y solo cuando ya dicen algo:
 * mientras un número es chico no se muestra y en su lugar va un hecho verificable del servicio.
 */
export async function TrustBand({ cta = true }: { cta?: boolean }) {
  const s = await stats()
  const items: { big: string; small: string }[] = []
  if (s && s.hires >= 10) items.push({ big: n(s.hires), small: 'personas nos contaron que consiguieron trabajo' })
  if (s && s.total >= 50) items.push({ big: n(s.total), small: 'avisos publicados y revisados' })
  if (s && s.week >= 20) items.push({ big: n(s.week), small: 'avisos nuevos en los últimos 7 días' })
  if (s && s.live >= 10 && s.directPct >= 20) items.push({ big: s.directPct + '%', small: 'de los avisos vigentes tienen mail directo' })
  const facts = [
    { big: 'A mano', small: 'cada aviso se revisa antes de publicarse' },
    { big: '30 días', small: 'como máximo online: los vencidos se bajan solos' },
    { big: '$0', small: 'te cobra un aviso serio para postularte' },
    { big: 'Sin débito', small: 'Premium es un pago único, sin renovación automática' },
  ]
  for (const f of facts) if (items.length < 4) items.push(f)
  return (
    <section className="trust" aria-label="Por qué Puestalia">
      <dl>{items.map((i) => <div key={i.small}><dt>{i.big}</dt><dd>{i.small}</dd></div>)}</dl>
      {cta && <p className="trust-cta">¿Conseguiste trabajo con un aviso de Puestalia? <Link href="/consegui-trabajo">Contanos</Link> y sumá tu historia.</p>}
    </section>
  )
}
