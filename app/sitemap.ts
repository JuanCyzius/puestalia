import type { MetadataRoute } from 'next'
import { listJobs } from '@/lib/db'
import { isFreeNow } from '@/lib/types'
import { LANDINGS } from '@/lib/landings'

export const revalidate = 3600

const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://puestalia.com').replace(/\/$/, '')

/** Mapa del sitio para Google: inicio, páginas por tema y avisos vigentes ya abiertos. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await listJobs().catch(() => [])
  const now = new Date()
  return [
    { url: `${site}/`, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    ...Object.keys(LANDINGS).map((slug) => ({ url: `${site}/${slug}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.9 })),
    { url: `${site}/premium`, changeFrequency: 'monthly', priority: 0.5 },
    ...jobs.filter(isFreeNow).map((j) => ({ url: `${site}/empleos/${j.id}`, lastModified: new Date(j.published_at), changeFrequency: 'weekly' as const, priority: 0.7 })),
  ]
}
