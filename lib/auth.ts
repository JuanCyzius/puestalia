import { createHmac, timingSafeEqual } from 'crypto'
import { cookies, headers } from 'next/headers'

export const adminToken = () => createHmac('sha256', process.env.ADMIN_PASSWORD || '').update('puestalia-admin').digest('hex')

const eq = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

/** Admin = cookie del panel, o el token de carga en la cabecera Authorization (para conector o bot). */
export async function isAdmin() {
  if (!process.env.ADMIN_PASSWORD) return false
  const c = (await cookies()).get('adm')?.value
  if (c && eq(c, adminToken())) return true
  const t = process.env.INGEST_TOKEN
  const h = (await headers()).get('authorization')
  return !!(t && h && eq(h, 'Bearer ' + t))
}

export const checkPassword = (p: string) => !!process.env.ADMIN_PASSWORD && eq(p, process.env.ADMIN_PASSWORD)
