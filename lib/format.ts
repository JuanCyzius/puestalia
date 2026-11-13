export function ago(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
  if (h < 1) return 'Recién publicado'
  if (h < 24) return `Hace ${h} h`
  const d = Math.floor(h / 24)
  return d === 1 ? 'Ayer' : `Hace ${d} días`
}

export function left(iso: string) {
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
  return d <= 1 ? 'Vence hoy' : `Vence en ${d} días`
}

export const dmy = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })

/** Cuánto falta para una fecha: "2 d 5 h", "5 h", "20 min". */
export function until(iso: string) {
  const m = Math.max(1, Math.ceil((new Date(iso).getTime() - Date.now()) / 60000))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60), d = Math.floor(h / 24)
  return d ? (h % 24 ? `${d} d ${h % 24} h` : `${d} d`) : `${h} h`
}

export const dayHour = (iso: string) => new Date(iso).toLocaleString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Argentina/Buenos_Aires' }) + ' h'
