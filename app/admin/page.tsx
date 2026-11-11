import { isAdmin } from '@/lib/auth'
import { Login, Panel } from './ui'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin', robots: { index: false } }

export default async function Admin() {
  if (!process.env.ADMIN_PASSWORD) return <p className="empty">Definí ADMIN_PASSWORD en las variables de entorno para habilitar el panel.</p>
  return (await isAdmin()) ? <Panel /> : <Login />
}
