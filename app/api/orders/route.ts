import { NextResponse } from 'next/server'
import { createOrder, ordersReady, uploadCv } from '@/lib/db'
import { createServicePayment, mpReady } from '@/lib/mp'
import { isService, SERVICES } from '@/lib/services'
import { getUser, siteUrl } from '@/lib/session'

const OK_TYPES = /\.(pdf|docx?|odt|jpe?g|png)$/i
const str = (v: FormDataEntryValue | null, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/** Crea el pedido de un servicio (con el CV si lo suben) y devuelve a dónde ir a pagar. */
export async function POST(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Ingresá a tu cuenta para hacer el pedido.' }, { status: 401 })
  if (!mpReady() || !(await ordersReady())) return NextResponse.json({ error: 'Los pedidos todavía no están habilitados. Probá más tarde.' }, { status: 503 })
  const f = await req.formData().catch(() => null)
  if (!f) return NextResponse.json({ error: 'No llegaron los datos del formulario.' }, { status: 400 })
  const product = f.get('product')
  if (!isService(product)) return NextResponse.json({ error: 'Elegí un servicio.' }, { status: 400 })
  const name = str(f.get('name'), 120), phone = str(f.get('phone'), 40), target = str(f.get('target'), 200), notes = str(f.get('notes'), 3000)
  if (name.length < 2) return NextResponse.json({ error: 'Poné tu nombre.' }, { status: 400 })
  if (target.length < 3) return NextResponse.json({ error: 'Contanos qué puesto buscás.' }, { status: 400 })
  const file = f.get('cv')
  let cv_path: string | null = null
  if (file instanceof File && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'El CV pesa más de 5 MB. Probá con un PDF más liviano.' }, { status: 400 })
    if (!OK_TYPES.test(file.name)) return NextResponse.json({ error: 'Subí el CV en PDF, Word o imagen.' }, { status: 400 })
    try { cv_path = await uploadCv(user.id, file) } catch (e) { return NextResponse.json({ error: 'No se pudo subir el CV: ' + (e as Error).message }, { status: 500 }) }
  } else if (notes.length < 20) {
    return NextResponse.json({ error: 'Subí tu CV o, si no tenés, contanos en "Algo más" tu experiencia y estudios.' }, { status: 400 })
  }
  try {
    const order = await createOrder({ user_id: user.id, email: user.email, name, phone: phone || null, product, price: SERVICES[product].price, target, notes: notes || null, cv_path })
    return NextResponse.json({ url: await createServicePayment(order, siteUrl()) })
  } catch (e) {
    return NextResponse.json({ error: 'No se pudo crear el pedido: ' + (e as Error).message }, { status: 502 })
  }
}
