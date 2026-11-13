import type { Metadata } from 'next'
import { LANDINGS } from '@/lib/landings'
import type { Filters } from '@/lib/types'
import { HomeView } from '../home-view'

const L = LANDINGS['empleos-sin-experiencia']
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: { absolute: L.title + ' · Puestalia' },
  description: L.description,
  alternates: { canonical: '/empleos-sin-experiencia' },
  openGraph: { title: L.title, description: L.description, url: '/empleos-sin-experiencia', siteName: 'Puestalia', locale: 'es_AR', type: 'website', images: ['/opengraph-image.jpg'] },
}

export default async function Page({ searchParams }: { searchParams: Promise<Filters> }) {
  return <HomeView f={await searchParams} preset={L.filters} landing={L} />
}
