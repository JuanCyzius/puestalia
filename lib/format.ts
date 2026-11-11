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
