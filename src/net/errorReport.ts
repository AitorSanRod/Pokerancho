import type { ErrorReport } from '../game/core/errorReport'
import { postJson } from './apiFetch'

// Enviar un error de la pantalla «Algo ha fallado» al servidor (worker/errorReport.ts), para poder leerlo y arreglarlo.

const ERROR_REPORT_API = '/api/error-report'

/** true si el servidor lo ha guardado; false sin conexión o sin servidor */
export async function sendErrorReport(report: ErrorReport): Promise<boolean> {
  try {
    const res = await postJson(ERROR_REPORT_API, report)
    return res.ok
  } catch {
    return false
  }
}
