import type { Metadata } from 'next'
import type { Filters } from '@/lib/types'
import { HomeView } from '../home-view'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: { absolute: 'Empleos gratis: avisos abiertos para postularte ya · Puestalia' },
  description: 'Todos los avisos de empleo ya desbloqueados en Puestalia: remotos, administrativos y sin experiencia, gratis y listos para postularte.',
  alternates: { canonical: '/gratis' },
}

export default async function Gratis({ searchParams }: { searchParams: Promise<Filters> }) {
  return <HomeView f={await searchParams} path="/gratis" onlyFree landing={{ h1: 'Gratis · ya desbloqueados', intro: 'Todos los avisos que ya están abiertos para cualquiera: empresa, contacto y cómo postularte, sin pagar nada. Cada aviso nuevo se suma acá 3 días después de publicado; con Premium los ves apenas entran.' }} />
}
