import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { isService, money, SERVICES } from '@/lib/services'
import { getUser } from '@/lib/session'
import { OrderForm } from './form'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Hacer un pedido', robots: { index: false } }

export default async function Pedir({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams
  const product = isService(p) ? p : 'cv-pro'
  const user = await getUser()
  if (!user) redirect(`/ingresar?next=${encodeURIComponent('/servicios/pedir?p=' + product)}`)
  return (
    <div className="page">
      <p className="kicker">Pedido</p>
      <h1>{SERVICES[product].name} · {money(SERVICES[product].price)}</h1>
      <p className="lead">Completá esto y te llevamos a Mercado Pago. Lo recibís en {user.email}.</p>
      <OrderForm initial={product} options={Object.fromEntries(Object.entries(SERVICES).map(([k, v]) => [k, `${v.name} · ${money(v.price)}`]))} />
    </div>
  )
}
