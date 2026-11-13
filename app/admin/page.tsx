import { isAdmin } from '@/lib/auth'
import { Login, Panel } from './ui'
import { Stats } from './stats'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin', robots: { index: false } }

export default async function Admin() {
  if (await isAdmin()) return (<><Stats /><Panel /></>)
  if (!process.env.ADMIN_PASSWORD) return <p className="empty">Ingresá con tu cuenta de admin para ver el panel.</p>
  return <Login />
}
