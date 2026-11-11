import type { Metadata } from 'next'
import Link from 'next/link'
import { demo } from '@/lib/db'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'Puestalia · Empleos remotos, administrativos y sin experiencia', template: '%s · Puestalia' },
  description: 'Avisos de empleo nuevos todos los días en Argentina: remotos, administrativos y sin experiencia. Revisados, vigentes y listos para postularte en un toque.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Montserrat:wght@700;800&display=swap" />
      </head>
      <body>
        {demo && <div className="demo">Modo demo: avisos ficticios de ejemplo. Conectá Supabase para publicar avisos reales.</div>}
        <header className="top">
          <Link href="/" className="logo" aria-label="Puestalia, inicio"><img src="/logo.png" alt="Puestalia" width={152} height={38} /></Link>
          <nav>
            <Link href="/?mod=remoto">Remoto</Link>
            <Link href="/?exp=sin_experiencia">Sin experiencia</Link>
            <Link href="/?cat=administracion">Administración</Link>
            <Link href="/premium" className="btn sm">Premium</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="foot">
          <p><b>Puestalia · Oportunidades todos los días.</b> Difunde avisos de empleo publicados por empresas y consultoras. No somos el empleador ni intervenimos en la selección.</p>
          <p>Ningún aviso serio te pide plata para postularte. Si ves algo raro, escribinos y lo bajamos.</p>
        </footer>
      </body>
    </html>
  )
}
