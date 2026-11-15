// Cupo de correos (tabla mail_log, migrations/0017_mail_log.sql): todos los del día y los de cada conexión por hora.

/** Correos al día como mucho entre todas las cuentas: por debajo de los 300 del plan gratuito de Brevo */
export const MAIL_DAILY_CAP = 250
/** Correos por hora como mucho desde una misma IP (crear cuentas o pedir enlaces sin parar) */
export const MAIL_PER_IP_PER_HOUR = 5

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

/** Si se puede mandar un correo más ahora desde esa IP (sin IP, p. ej. en local, solo cuenta el cupo del día) */
export async function mailAllowed(db: D1Database, ip: string, now: number): Promise<boolean> {
  const day = await db.prepare('SELECT COUNT(*) AS n FROM mail_log WHERE sent_at >= ?').bind(now - DAY_MS).first<number>('n')
  if ((day ?? 0) >= MAIL_DAILY_CAP) return false
  if (!ip) return true
  const hour = await db.prepare('SELECT COUNT(*) AS n FROM mail_log WHERE ip = ? AND sent_at >= ?').bind(ip, now - HOUR_MS).first<number>('n')
  return (hour ?? 0) < MAIL_PER_IP_PER_HOUR
}

export async function logMail(db: D1Database, ip: string, now: number) {
  await db.prepare('INSERT INTO mail_log (ip, sent_at) VALUES (?, ?)').bind(ip, now).run()
}

/** Borra los apuntes que ya no cuentan para ningún cupo */
export async function pruneMailLog(db: D1Database, now: number) {
  await db.prepare('DELETE FROM mail_log WHERE sent_at < ?').bind(now - DAY_MS).run()
}
