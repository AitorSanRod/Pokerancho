/** Duración legible: "40 s", "12 min", "4 h", "1 h 30 min" */
export function formatMinutes(min: number): string {
  if (min < 1) return `${Math.max(1, Math.round(min * 60))} s`
  if (min < 60) return `${Math.round(min)} min`
  const rest = Math.round(min % 60)
  return rest === 0 ? `${Math.floor(min / 60)} h` : `${Math.floor(min / 60)} h ${rest} min`
}

/** Cuenta atrás de reloj: "12:34", "1:05:00" */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const [h, m, s] = [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60]
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

const COUNT_FORMAT = new Intl.NumberFormat('es-ES', { useGrouping: 'always' })

/** Cantidad con punto de miles, también con cuatro cifras ("2.500"; es-ES por defecto deja "2500" y "25.000") */
export const formatCount = (n: number): string => COUNT_FORMAT.format(n)

/** Dinero: "₽ 12.500" */
export const formatMoney = (n: number): string => `₽ ${formatCount(n)}`

/** Fracción como porcentaje entero, hacia abajo: 0.1 → "10%" */
export const formatPercent = (fraction: number): string => `${Math.floor(fraction * 100)}%`

/** Bono como porcentaje con un decimal si hace falta: 0.025 → "+2,5%" */
export const formatBonus = (fraction: number): string =>
  `+${(fraction * 100).toLocaleString('es-ES', { maximumFractionDigits: 1 })}%`

const TIME_FORMAT = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' })
const DAY_FORMAT = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric' })
const DAY_MS = 24 * 60 * 60 * 1000

/** Día y hora locales de un momento cercano: "hoy 21:15", "mañana 18:00", "vie 21 · 09:30" */
export function formatWhen(ms: number, now = Date.now()): string {
  const day = (t: number) => new Date(t).toDateString()
  const time = TIME_FORMAT.format(ms)
  if (day(ms) === day(now)) return `hoy ${time}`
  if (day(ms) === day(now + DAY_MS)) return `mañana ${time}`
  return `${DAY_FORMAT.format(ms)} · ${time}`
}
