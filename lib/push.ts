import { createECDH, createHmac, timingSafeEqual } from 'crypto'
import webpush from 'web-push'
import { deletePushSub, isPremium, listJobs, listPushSubs, markPushSent, type PushSub } from './db'
import { CATEGORIES, EXPERIENCES, freeAt, MODALITIES, type Job } from './types'

const secret = () => process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * Claves VAPID para firmar las notificaciones. Si no se cargan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY,
 * se derivan del secreto del sitio: así no hay que crear ni pegar claves nuevas en ningún lado.
 */
export function vapid() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
    return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY }
  if (!secret()) return null
  const priv = createHmac('sha256', secret()).update('puestalia-vapid-v1').digest()
  const ecdh = createECDH('prime256v1')
  ecdh.setPrivateKey(priv)
  return { publicKey: ecdh.getPublicKey().toString('base64url'), privateKey: priv.toString('base64url') }
}

/** Contraseña con la que la tarea programada de Netlify pide el envío. También derivada del secreto. */
export const cronToken = () => (secret() ? createHmac('sha256', secret()).update('puestalia-push-cron').digest('base64url') : '')
export function cronOk(req: Request) {
  const t = cronToken()
  const got = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  return !!t && got.length === t.length && timingSafeEqual(Buffer.from(got), Buffer.from(t))
}

type Payload = { title: string; body: string; url: string; tag?: string }

/** Envía una notificación. Devuelve false si el celular ya no existe (se borra la suscripción). */
export async function send(s: Pick<PushSub, 'endpoint' | 'p256dh' | 'auth'>, p: Payload) {
  const v = vapid()
  if (!v) throw new Error('Falta SESSION_SECRET para firmar las notificaciones.')
  try {
    await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(p), {
      vapidDetails: { subject: (process.env.NEXT_PUBLIC_SITE_URL || 'https://puestalia.com').replace(/\/$/, ''), ...v },
      TTL: 60 * 60 * 24,
      urgency: 'normal',
    })
    return true
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode
    if (code === 404 || code === 410) { await deletePushSub(s.endpoint); return false }
    throw e
  }
}

const matches = (s: PushSub, j: Job) =>
  (!s.cats?.length || s.cats.includes(j.category)) &&
  (!s.mods?.length || (j.modality && s.mods.includes(j.modality))) &&
  (!s.exps?.length || (j.experience && s.exps.includes(j.experience)))

const line = (j: Job) => [j.modality && MODALITIES[j.modality], j.experience && EXPERIENCES[j.experience], CATEGORIES[j.category]].filter(Boolean).join(' · ')

/** Cada cuánto, como mucho, le escribimos a una misma persona. Nada de 30 notificaciones por día. */
const GAP = { premium: 60 * 60000, free: 12 * 3600000 }

/**
 * Recorre los celulares suscriptos y manda, a cada uno, UNA notificación con los avisos nuevos para él.
 * Premium: avisos publicados desde la última notificación. Gratis: avisos que se liberaron gratis desde la última.
 */
export async function runPush(now = new Date()) {
  const [subs, jobs] = await Promise.all([listPushSubs(), listJobs()])
  const premiumOf = new Map<string, boolean>()
  let sent = 0, gone = 0
  for (const s of subs) {
    if (!premiumOf.has(s.user_id)) premiumOf.set(s.user_id, await isPremium(s.user_id))
    const premium = premiumOf.get(s.user_id)!
    const last = new Date(s.last_sent_at ?? s.created_at).getTime()
    if (s.last_sent_at && now.getTime() - last < (premium ? GAP.premium : GAP.free)) continue
    const when = (j: Job) => (premium ? new Date(j.published_at) : freeAt(j)).getTime()
    const fresh = jobs.filter((j) => when(j) > last && when(j) <= now.getTime() && matches(s, j)).sort((a, b) => when(b) - when(a))
    if (!fresh.length) continue
    const p: Payload = fresh.length === 1
      ? { title: premium ? 'Nueva oferta para vos' : 'Se liberó una oferta para vos', body: `${fresh[0].title}\n${line(fresh[0])}`, url: `/empleos/${fresh[0].id}`, tag: 'puestalia' }
      : { title: `${fresh.length} ofertas nuevas para vos`, body: `${fresh[0].title} y ${fresh.length - 1} más`, url: '/?' + new URLSearchParams(Object.entries({ cat: s.cats?.length === 1 ? s.cats[0] : '', mod: s.mods?.length === 1 ? s.mods[0] : '', exp: s.exps?.length === 1 ? s.exps[0] : '' }).filter(([, v]) => v)).toString(), tag: 'puestalia' }
    try {
      if (await send(s, p)) { await markPushSent(s.endpoint, now); sent++ } else gone++
    } catch (e) {
      console.error('push', s.endpoint.slice(0, 40), (e as Error).message)
    }
  }
  return { subs: subs.length, sent, gone }
}
