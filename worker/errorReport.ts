import { AuthCode } from '../src/game/core/accountRules'
import { parseErrorReport } from '../src/game/core/errorReport'
import { sessionUser } from './auth/session'
import type { Env } from './env'
import { json, readJson, sameOrigin } from './http'

// POST /api/error-report: un error enviado desde la pantalla «Algo ha fallado» (tabla error_reports, ver
// migrations/0014_error_reports.sql). Sin cuenta también vale; con sesión, se apunta de quién es.

/** Bytes como mucho de la petición (mensaje, pila y componente ya recortados caben de sobra) */
const MAX_REQUEST_BYTES = 16_000
/** Letras como mucho del navegador que se guarda */
const MAX_USER_AGENT = 300

export async function errorReportRoute(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Solo POST' }, 405)
  if (!sameOrigin(request)) return json({ code: AuthCode.WrongOrigin }, 403)
  const report = parseErrorReport(await readJson(request, MAX_REQUEST_BYTES))
  if (!report) return json({ error: 'Informe vacío o demasiado grande' }, 400)
  const now = Date.now()
  const user = await sessionUser(env.DB, request, now)
  const repeated = await env.DB.prepare('UPDATE error_reports SET count = count + 1, last_at = ? WHERE active = 1 AND message = ? AND stack = ?')
    .bind(now, report.message, report.stack)
    .run()
  if (repeated.meta.changes === 0) {
    const agent = (request.headers.get('User-Agent') ?? '').slice(0, MAX_USER_AGENT)
    await env.DB.prepare('INSERT INTO error_reports (message, stack, component, user_agent, user_id, first_at, last_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(report.message, report.stack, report.component, agent, user?.id ?? null, now, now)
      .run()
  }
  return json({ ok: true })
}
