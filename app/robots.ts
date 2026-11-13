import type { MetadataRoute } from 'next'

const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://puestalia.com').replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/cuenta', '/ingresar', '/auth/'] }],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  }
}
