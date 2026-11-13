import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Puestalia · Empleos todos los días',
    short_name: 'Puestalia',
    description: 'Ofertas de empleo remotas, administrativas y sin experiencia en Argentina. Te avisamos cuando entran.',
    lang: 'es-AR',
    start_url: '/?app=1',
    scope: '/',
    display: 'standalone',
    background_color: '#F7F7F2',
    theme_color: '#172C3C',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
