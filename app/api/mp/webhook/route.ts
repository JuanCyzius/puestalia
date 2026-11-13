import { createHmac, timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { syncFromPayment, syncPayment, syncSubscription } from '@/lib/mp'

/** Firma de Mercado Pago. Se valida solo si MP_WEBHOOK_SECRET está cargada. */
function signed(req: Request, dataId: string) {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) return true
  const parts = Object.fromEntries((req.headers.get('x-signature') ?? '').split(',').map((p) => p.trim().split('=') as [string, string]))
  if (!parts.ts || !parts.v1) return false
  const manifest = `id:${dataId.toLowerCase()};request-id:${req.headers.get('x-request-id') ?? ''};ts:${parts.ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')
  return expected.length === parts.v1.length && timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1))
}

/**
 * Aviso de Mercado Pago: hubo un pago del pase (o cambió una suscripción vieja).
 * Nunca se confía en el contenido del aviso: siempre se vuelve a consultar el estado real por API,
 * así que un aviso sin firma válida no puede dar Premium a nadie. Por eso se procesa igual y solo se registra.
 */
export async function POST(req: Request) {
  const q = new URL(req.url).searchParams
  const body = await req.json().catch(() => ({}))
  const type = String(body.type ?? q.get('type') ?? q.get('topic') ?? '')
  const id = String(body.data?.id ?? q.get('data.id') ?? q.get('id') ?? '')
  if (!id) return NextResponse.json({ ok: true })
  if (!signed(req, id)) console.warn('webhook mp sin firma válida', type, id)
  try {
    if (type === 'payment') await syncPayment(id)
    else if (type === 'subscription_preapproval' || type === 'preapproval') await syncSubscription(id)
    else if (type === 'subscription_authorized_payment' || type === 'authorized_payment') await syncFromPayment(id)
  } catch (e) {
    console.error('webhook mp', type, id, (e as Error).message)
    return NextResponse.json({ error: 'No se pudo sincronizar' }, { status: 500 }) // Mercado Pago reintenta
  }
  return NextResponse.json({ ok: true })
}
