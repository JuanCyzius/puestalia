import type { Metadata } from 'next'
import type { Filters } from '@/lib/types'
import { HomeView } from '../home-view'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Puestos de trabajo',
  description: 'Todos los puestos de trabajo vigentes en Puestalia: remotos, administrativos y sin experiencia, revisados y con la vigencia a la vista.',
  alternates: { canonical: '/' },
}

export default async function Empleos({ searchParams }: { searchParams: Promise<Filters> }) {
  return <HomeView f={await searchParams} path="/empleos" landing={{ h1: 'Puestos de trabajo', intro: 'Todos los avisos vigentes, del más nuevo al más viejo. Filtrá por modalidad, rubro y experiencia.' }} />
}
