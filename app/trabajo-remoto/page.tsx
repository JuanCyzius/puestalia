import type { Metadata } from 'next'
import { LANDINGS } from '@/lib/landings'
import type { Filters } from '@/lib/types'
import { HomeView } from '../home-view'

const L = LANDINGS['trabajo-remoto']
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: { absolute: L.title + ' · Puestalia' },
  description: L.description,
  alternates: { canonical: '/trabajo-remoto' },
  openGraph: { title: L.title, description: L.description, url: '/trabajo-remoto', siteName: 'Puestalia', locale: 'es_AR', type: 'website', images: ['/opengraph-image.jpg'] },
}

export default async function Page({ searchParams }: { searchParams: Promise<Filters> }) {
  return <HomeView f={await searchParams} preset={L.filters} landing={L} />
}
