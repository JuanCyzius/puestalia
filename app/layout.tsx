import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { demo } from '@/lib/db'
import { getUser } from '@/lib/session'
import { InstallButton, NewJobsWatcher, Presence, PwaSetup } from './pwa'
import { isAdminEmail } from '@/lib/auth'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'Puestalia · Empleos remotos, administrativos y sin experiencia', template: '%s · Puestalia' },
  description: 'Avisos de empleo nuevos todos los días en Argentina: remotos, administrativos y sin experiencia. Revisados, vigentes y listos para postularte en un toque.',
  applicationName: 'Puestalia',
  appleWebApp: { capable: true, title: 'Puestalia', statusBarStyle: 'default' },
  icons: { apple: '/apple-touch-icon.png' },
  openGraph: {
    type: 'website', siteName: 'Puestalia', locale: 'es_AR', url: '/',
    title: 'Puestalia · Empleos remotos, administrativos y sin experiencia',
    description: 'Avisos de empleo nuevos todos los días en Argentina, revisados y vigentes. Postulate por mail directo.',
  },
  twitter: { card: 'summary_large_image' },
  // Verificación de Google Search Console por etiqueta (opcional): variable GOOGLE_SITE_VERIFICATION en Netlify.
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
}

export const viewport: Viewport = { themeColor: '#172C3C' }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  return (
    <html lang="es-AR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Montserrat:wght@700;800&display=swap" />
      </head>
      <body>
        <PwaSetup />
        <Presence />
        <NewJobsWatcher />
        {demo && <div className="demo">Modo demo: avisos ficticios de ejemplo. Conectá Supabase para publicar avisos reales.</div>}
        <header className="top">
          <Link href="/" className="logo" aria-label="Puestalia, inicio"><img src="/logo.png" alt="Puestalia" width={152} height={38} /></Link>
          <nav>
            <Link href="/trabajo-remoto">Remoto</Link>
            <Link href="/empleos-sin-experiencia">Sin experiencia</Link>
            <Link href="/empleos-administrativos">Administración</Link>
            {isAdminEmail(user?.email) && <Link href="/admin" className="acct">Admin</Link>}
            <InstallButton className="acct install" />
            <Link href={user ? '/cuenta' : '/ingresar'} className="acct">{user ? 'Mi cuenta' : 'Ingresar'}</Link>
            <Link href="/premium" className="btn sm">Premium</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="foot">
          <p><b>Puestalia · Oportunidades todos los días.</b> Difunde avisos de empleo publicados por empresas y consultoras. No somos el empleador ni intervenimos en la selección.</p>
          <p>Ningún aviso serio te pide plata para postularte. Si ves algo raro, escribinos y lo bajamos.</p>
          <nav aria-label="Empleos por tema">
            <Link href="/trabajo-remoto">Trabajo remoto</Link>
            <Link href="/empleos-sin-experiencia">Empleos sin experiencia</Link>
            <Link href="/empleos-administrativos">Empleos administrativos</Link>
            <Link href="/premium">Premium</Link>
          </nav>
        </footer>
      </body>
    </html>
  )
}
