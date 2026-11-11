import type { ErrorReport } from '../game/core/errorReport'

// Enviar un error de la pantalla «Algo ha fallado» al servidor (worker/errorReport.ts), para poder leerlo y arreglarlo.

const ERROR_REPORT_API = '/api/error-report'
const REQUEST_TIMEOUT_MS = 8_000

/** true si el servidor lo ha guardado; false sin conexión o sin servidor */
export async function sendErrorReport(report: ErrorReport): Promise<boolean> {
  try {
    const res = await fetch(ERROR_REPORT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    return res.ok
  } catch {
    return false
  }
}
