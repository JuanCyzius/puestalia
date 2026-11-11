import { createClient } from '@supabase/supabase-js'
import { DAYS_LIVE, FREE_PER_DAY, type Filters, type Job, type JobDraft } from './types'
import { seedJobs } from './seed'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
/** Sin credenciales de Supabase la web usa avisos de ejemplo en memoria. */
export const demo = !url || !key
const sb = demo ? null : createClient(url!, key!, { auth: { persistSession: false } })

const g = globalThis as unknown as { __jobs?: Job[]; __wait?: string[] }
const mem = () => (g.__jobs ??= seedJobs())

const norm = (s: string | null) =>
  (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()

/** Huella para detectar el mismo aviso cargado dos veces. */
export const fingerprint = (d: Pick<JobDraft, 'company' | 'title' | 'location'>) =>
  [norm(d.company), norm(d.title), norm(d.location)].join('|')

/** Vence a los 30 días de publicado, o antes si la fuente informa fecha de cierre. */
export function expiry(publishedAt: Date, closingDate: string | null) {
  const max = new Date(publishedAt.getTime() + DAYS_LIVE * 86400000)
  if (!closingDate) return max
  const close = new Date(closingDate + 'T23:59:59-03:00')
  return isNaN(close.getTime()) || close > max ? max : close
}

const vigente = (j: Job) => j.status === 'active' && new Date(j.expires_at) > new Date()
/** Visible en el sitio: vigente y con su hora de salida ya cumplida (los programados todavía no se ven). */
const live = (j: Job) => vigente(j) && new Date(j.published_at) <= new Date()

export async function listJobs(f: Filters = {}): Promise<Job[]> {
  if (!sb) {
    const q = norm(f.q ?? '')
    return mem()
      .filter(live)
      .filter((j) => !f.cat || j.category === f.cat)
      .filter((j) => !f.mod || j.modality === f.mod)
      .filter((j) => !f.exp || j.experience === f.exp)
      .filter((j) => !f.jor || j.schedule_type === f.jor)
      .filter((j) => {
        if (!q) return true
        const hay = norm([j.title, j.company, j.description, j.requirements, j.location, j.modality, j.experience?.replace('_', ' ')].join(' '))
        return q.split(' ').every((w) => hay.includes(w))
      })
      .sort((a, b) => b.published_at.localeCompare(a.published_at))
  }
  let q = sb.from('jobs').select('*').eq('status', 'active').gt('expires_at', new Date().toISOString()).lte('published_at', new Date().toISOString())
  if (f.cat) q = q.eq('category', f.cat)
  if (f.mod) q = q.eq('modality', f.mod)
  if (f.exp) q = q.eq('experience', f.exp)
  if (f.jor) q = q.eq('schedule_type', f.jor)
  if (f.q) q = q.textSearch('fts', f.q, { type: 'websearch', config: 'spanish' })
  const { data, error } = await q.order('published_at', { ascending: false }).limit(300)
  if (error) throw new Error(error.message)
  return data as Job[]
}

/** Los avisos que cualquiera puede abrir sin pagar: los 8 más recientes. */
export async function freeIds(): Promise<Set<string>> {
  if (!sb) return new Set((await listJobs()).slice(0, FREE_PER_DAY).map((j) => j.id))
  const { data, error } = await sb.from('jobs').select('id').eq('status', 'active')
    .gt('expires_at', new Date().toISOString()).lte('published_at', new Date().toISOString()).order('published_at', { ascending: false }).limit(FREE_PER_DAY)
  if (error) throw new Error(error.message)
  return new Set(data.map((r) => r.id as string))
}

export async function getJob(id: string): Promise<Job | null> {
  if (!sb) return mem().find((j) => j.id === id && live(j)) ?? null
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const { data } = await sb.from('jobs').select('*').eq('id', id).eq('status', 'active')
    .gt('expires_at', new Date().toISOString()).lte('published_at', new Date().toISOString()).maybeSingle()
  return (data as Job) ?? null
}

export class DuplicateError extends Error {}

export async function createJob(d: JobDraft, force = false, when?: Date): Promise<Job> {
  const now = when ?? new Date()
  const fp = fingerprint(d)
  const row = { ...d, published_at: now.toISOString(), expires_at: expiry(now, d.closing_date).toISOString(), status: 'active' as const, fingerprint: fp }
  if (!sb) {
    if (!force && mem().some((j) => vigente(j) && j.fingerprint === fp)) throw new DuplicateError()
    const job: Job = { ...row, id: 'n' + Date.now() }
    mem().push(job)
    return job
  }
  if (!force) {
    const { data } = await sb.from('jobs').select('id').eq('fingerprint', fp).eq('status', 'active').gt('expires_at', new Date().toISOString()).limit(1)
    if (data?.length) throw new DuplicateError()
  }
  const { data, error } = await sb.from('jobs').insert(row).select().single()
  if (error) throw new Error(error.message)
  return data as Job
}

export async function addWaitlist(email: string) {
  if (!sb) { (g.__wait ??= []).push(email); return }
  const { error } = await sb.from('waitlist').upsert({ email }, { onConflict: 'email' })
  if (error) throw new Error(error.message)
}

// ---------- Etapa 2: cuentas y suscripciones ----------

export type Sub = { user_id: string; mp_preapproval_id: string | null; status: string; payer_email: string | null; next_payment_date: string | null }

/** Manda el mail con el enlace de ingreso (lo envía Supabase). */
export async function sendLoginLink(email: string, redirectTo: string) {
  if (!sb) throw new Error('El ingreso necesita la base de datos conectada.')
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo, shouldCreateUser: true } })
  if (error) throw new Error(error.message)
}

/** Valida contra Supabase el token que trae el enlace del mail. */
export async function userFromAccessToken(token: string) {
  if (!sb) return null
  const { data, error } = await sb.auth.getUser(token)
  return error || !data.user?.email ? null : { id: data.user.id, email: data.user.email }
}

export async function getSub(userId: string): Promise<Sub | null> {
  if (!sb) return null
  const { data } = await sb.from('subscriptions').select('*').eq('user_id', userId).maybeSingle()
  return (data as Sub) ?? null
}

export async function saveSub(s: Sub) {
  if (!sb) return
  const cur = await getSub(s.user_id)
  // Una suscripción vieja cancelada no pisa a una nueva que está activa.
  if (cur && cur.status === 'authorized' && cur.mp_preapproval_id !== s.mp_preapproval_id && s.status !== 'authorized') return
  const { error } = await sb.from('subscriptions').upsert({ ...s, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) throw new Error(error.message)
}

/** Premium = Mercado Pago informa la suscripción como autorizada. */
export async function isPremium(userId: string | undefined) {
  if (!userId) return false
  return (await getSub(userId))?.status === 'authorized'
}

// ---------- Cuentas con mail y contraseña ----------

/** Cliente aparte para iniciar sesión: así la sesión del usuario nunca queda pegada al cliente del servidor. */
const authClient = () => createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } })

/** Crea la cuenta ya confirmada, sin enviar ningún mail. Devuelve null si el mail ya está registrado. */
export async function registerUser(email: string, password: string, name?: string) {
  if (!sb) throw new Error('Las cuentas necesitan la base de datos conectada.')
  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: name ? { name } : {} })
  if (error) {
    if (/already|registered|exists/i.test(error.message)) return null
    throw new Error(error.message)
  }
  return { id: data.user.id, email }
}

export async function loginUser(email: string, password: string) {
  if (!sb) throw new Error('Las cuentas necesitan la base de datos conectada.')
  const { data, error } = await authClient().auth.signInWithPassword({ email, password })
  return error || !data.user?.email ? null : { id: data.user.id, email: data.user.email }
}

export async function setPassword(userId: string, password: string) {
  if (!sb) throw new Error('Las cuentas necesitan la base de datos conectada.')
  const { error } = await sb.auth.admin.updateUserById(userId, { password })
  if (error) throw new Error(error.message)
}

// ---------- Publicación escalonada ----------

const rnd = (a: number, b: number) => a + Math.random() * (b - a)

/**
 * Próxima hora libre de la cola. Cada aviso sale después del anterior con una pausa irregular:
 * a veces pegado (2 a 10 minutos) y a veces separado (25 a 75), así 20 avisos se reparten en unas 12 horas.
 * Entre las 0 y las 7 de Argentina no sale nada: pasa a la mañana.
 */
export async function nextSlot(): Promise<Date> {
  const now = Date.now()
  let last = now
  if (!sb) last = Math.max(now, ...mem().filter(vigente).map((j) => new Date(j.published_at).getTime()))
  else {
    const { data } = await sb.from('jobs').select('published_at').gt('published_at', new Date(now).toISOString()).order('published_at', { ascending: false }).limit(1)
    if (data?.[0]) last = new Date(data[0].published_at).getTime()
  }
  const gap = last === now ? rnd(2, 8) : Math.random() < 0.35 ? rnd(2, 10) : rnd(25, 75)
  const t = new Date(last + gap * 60000)
  const hourAR = (t.getUTCHours() + 21) % 24
  if (hourAR < 7) { t.setUTCHours(t.getUTCHours() + (7 - hourAR), Math.floor(rnd(0, 20)), 0, 0) }
  return t
}

/** Avisos vigentes para el panel, incluidos los programados que todavía no salieron. */
export async function listAdminJobs(): Promise<Job[]> {
  if (!sb) return mem().filter(vigente).sort((a, b) => b.published_at.localeCompare(a.published_at)).slice(0, 40)
  const { data, error } = await sb.from('jobs').select('*').eq('status', 'active').gt('expires_at', new Date().toISOString()).order('published_at', { ascending: false }).limit(40)
  if (error) throw new Error(error.message)
  return data as Job[]
}

/** Adelanta la salida de un aviso programado a este momento. */
export async function publishNow(id: string) {
  const now = new Date()
  if (!sb) { const j = mem().find((x) => x.id === id); if (j && new Date(j.published_at) > now) { j.published_at = now.toISOString(); j.expires_at = expiry(now, j.closing_date).toISOString() } return }
  const { data } = await sb.from('jobs').select('closing_date,published_at').eq('id', id).maybeSingle()
  if (!data || new Date(data.published_at) <= now) return
  const { error } = await sb.from('jobs').update({ published_at: now.toISOString(), expires_at: expiry(now, data.closing_date).toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
}
