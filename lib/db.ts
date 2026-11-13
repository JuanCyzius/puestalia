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

// ---------- Etapa 3: pase de 30 días (pago único) ----------

export const PASS_DAYS = 30
export type Pass = { mp_payment_id: string; user_id: string; status: string; amount: number | null; starts_at: string | null; ends_at: string | null }

export async function getPasses(userId: string): Promise<Pass[]> {
  if (!sb) return []
  const { data, error } = await sb.from('passes').select('*').eq('user_id', userId).order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as Pass[]) ?? []
}

/** Revisa que la tabla exista antes de mandar a alguien a pagar. */
export async function passesReady() {
  if (!sb) return false
  const { error } = await sb.from('passes').select('mp_payment_id', { head: true, count: 'exact' }).limit(1)
  return !error
}

/** Hasta cuándo tiene Premium por pases aprobados (null si no tiene). */
export async function premiumUntil(userId: string): Promise<Date | null> {
  const ends = (await getPasses(userId).catch(() => []))
    .filter((p) => p.status === 'approved' && p.ends_at)
    .map((p) => new Date(p.ends_at!).getTime())
  const max = ends.length ? Math.max(...ends) : 0
  return max > Date.now() ? new Date(max) : null
}

/**
 * Guarda el estado de un pago. Si se aprueba por primera vez, suma 30 días:
 * desde hoy, o desde que termina el pase vigente si todavía le quedan días.
 */
export async function savePass(p: { mp_payment_id: string; user_id: string; status: string; amount: number | null; approved_at: string | null }) {
  if (!sb) return
  const all = await getPasses(p.user_id)
  const cur = all.find((x) => x.mp_payment_id === p.mp_payment_id)
  let starts_at = cur?.starts_at ?? null
  let ends_at = cur?.ends_at ?? null
  if (p.status === 'approved' && !ends_at) {
    const prevEnd = Math.max(0, ...all.filter((x) => x.mp_payment_id !== p.mp_payment_id && x.status === 'approved' && x.ends_at).map((x) => new Date(x.ends_at!).getTime()))
    const start = Math.max(Date.now(), prevEnd)
    starts_at = new Date(start).toISOString()
    ends_at = new Date(start + PASS_DAYS * 86400000).toISOString()
  }
  const { error } = await sb.from('passes').upsert(
    { mp_payment_id: p.mp_payment_id, user_id: p.user_id, status: p.status, amount: p.amount, starts_at, ends_at, updated_at: new Date().toISOString() },
    { onConflict: 'mp_payment_id' },
  )
  if (error) throw new Error(error.message)
}

/** Premium = pase de 30 días vigente (o una suscripción vieja que siga autorizada). */
export async function isPremium(userId: string | undefined) {
  if (!userId) return false
  if (await premiumUntil(userId)) return true
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

export const INSTANT = 4 // cuántos salen al instante al empezar una tanda

/**
 * Hora de salida para un aviso que se suma a la cola.
 * - Los primeros 4 de una tanda salen al instante.
 * - El resto se reparte con pausas que van creciendo: empiezan en unos 4 minutos y se estiran
 *   de a poco hasta un tope de 25, con algo de azar. Así salen más seguidos al principio y
 *   más espaciados al final: 20 avisos tardan cerca de 4 horas.
 * - Entre las 0 y las 7 de Argentina no sale nada: pasa a la mañana.
 */
export async function nextSlot(): Promise<Date> {
  const now = Date.now()
  const since = now - 20 * 60000
  let times: number[]
  if (!sb) times = mem().filter(vigente).map((j) => new Date(j.published_at).getTime()).filter((t) => t > since)
  else {
    const { data } = await sb.from('jobs').select('published_at').eq('status', 'active').gt('published_at', new Date(since).toISOString()).limit(500)
    times = (data ?? []).map((r) => new Date(r.published_at as string).getTime())
  }
  const pending = times.filter((t) => t > now)
  const recent = times.length - pending.length
  if (!pending.length && recent < INSTANT) return new Date(now)
  const gap = Math.min(25, 4 * Math.pow(1.15, pending.length)) * rnd(0.7, 1.3)
  const t = new Date(Math.max(now, ...pending) + gap * 60000)
  const hourAR = (t.getUTCHours() + 21) % 24
  if (hourAR < 7) t.setUTCHours(t.getUTCHours() + (7 - hourAR), Math.floor(rnd(0, 20)), 0, 0)
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
