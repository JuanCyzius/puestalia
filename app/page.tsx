import type { Metadata } from 'next'
import type { Filters } from '@/lib/types'
import { HomeView } from './home-view'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { alternates: { canonical: '/' } }

export default async function Home({ searchParams }: { searchParams: Promise<Filters> }) {
  return <HomeView f={await searchParams} ld />
}
