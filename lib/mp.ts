import { savePass, saveSub } from './db'

const API = 'https://api.mercadopago.com'
export const PRICE = Number(process.env.MP_PRICE) || 4900
export const mpReady = () => !!process.env.MP_ACCESS_TOKEN

async function call(path: string, init?: RequestInit) {
  const t = process.env.MP_ACCESS_TOKEN
  if (!t) throw new Error('Falta MP_ACCESS_TOKEN en las variables de entorno.')
  const r = await fetch(API + path, { ...init, headers: { authorization: 'Bearer ' + t, 'content-type': 'application/json' }, cache: 'no-store' })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.message || 'Mercado Pago respondió ' + r.status)
  return j
}

/**
 * Crea el pago único del pase de 30 días (Checkout Pro) y devuelve la dirección de pago.
 * No genera ningún débito automático: para seguir, la persona vuelve a pagar.
 */
export async function createPass(userId: string, email: string, site: string): Promise<string> {
  const p = await call('/checkout/preferences', {
    method: 'POST',
    body: JSON.stringify({
      items: [{ id: 'pase-30', title: 'Puestalia Premium · 30 días', description: 'Acceso a todos los avisos por 30 días. Pago único, sin renovación automática.', quantity: 1, unit_price: PRICE, currency_id: 'ARS' }],
      external_reference: userId,
      metadata: { kind: 'pase30', user_id: userId },
      payer: { email },
      back_urls: { success: site + '/cuenta', pending: site + '/cuenta', failure: site + '/cuenta' },
      auto_return: 'approved',
      notification_url: site + '/api/mp/webhook?source_news=webhooks',
      statement_descriptor: 'PUESTALIA',
    }),
  })
  return p.init_point
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Pregunta a Mercado Pago el estado real de una suscripción y lo guarda. Nunca se confía en lo que trae el aviso. */
export async function syncSubscription(preapprovalId: string, expectUser?: string) {
  const p = await call('/preapproval/' + encodeURIComponent(preapprovalId))
  if (!UUID.test(p.external_reference ?? '')) return null
  if (expectUser && p.external_reference !== expectUser) return null
  await saveSub({ user_id: p.external_reference, mp_preapproval_id: p.id, status: p.status, payer_email: p.payer_email ?? null, next_payment_date: p.next_payment_date ?? null })
  return p.status as string
}

export async function syncFromPayment(authorizedPaymentId: string) {
  const a = await call('/authorized_payments/' + encodeURIComponent(authorizedPaymentId))
  return a.preapproval_id ? syncSubscription(a.preapproval_id) : null
}

export async function cancelSubscription(preapprovalId: string) {
  await call('/preapproval/' + encodeURIComponent(preapprovalId), { method: 'PUT', body: JSON.stringify({ status: 'cancelled' }) })
  return syncSubscription(preapprovalId)
}

/** Pregunta a Mercado Pago el estado real de un pago del pase y lo guarda. */
export async function syncPayment(paymentId: string, expectUser?: string) {
  const p = await call('/v1/payments/' + encodeURIComponent(paymentId))
  const user = String(p.external_reference ?? '')
  if (!UUID.test(user) || (expectUser && user !== expectUser)) return null
  // Solo cuentan los pagos creados por Puestalia para el pase (la marca la pone el servidor al crear el pago).
  if (p.metadata?.kind !== 'pase30' || p.currency_id !== 'ARS') return null
  await savePass({ mp_payment_id: String(p.id), user_id: user, status: p.status, amount: p.transaction_amount ?? null, approved_at: p.date_approved ?? null })
  return p.status as string
}
