import { saveSub } from './db'

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

/** Crea la suscripción mensual atada al usuario del sitio y devuelve la dirección de pago. */
export async function createSubscription(userId: string, payerEmail: string, site: string): Promise<string> {
  const p = await call('/preapproval', {
    method: 'POST',
    body: JSON.stringify({
      reason: 'Puestalia Premium', external_reference: userId, payer_email: payerEmail, back_url: site + '/cuenta', status: 'pending',
      auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: PRICE, currency_id: 'ARS' },
    }),
  })
  await saveSub({ user_id: userId, mp_preapproval_id: p.id, status: p.status ?? 'pending', payer_email: payerEmail, next_payment_date: null })
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
