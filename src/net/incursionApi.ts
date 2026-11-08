import type { IncursionRequest, IncursionResponse } from '../game/incursion/online/protocol'

/** Dirección del servidor de incursiones (worker/incursion.ts) */
const INCURSION_API = '/api/incursion'
/** Milisegundos reales que se espera al servidor antes de darlo por perdido */
const REQUEST_TIMEOUT_MS = 8_000

/** Error de red o del servidor: sin él (p. ej. con `npm run dev`), las incursiones se juegan en local con bots */
export class IncursionApiError extends Error {}

export async function postIncursion(req: IncursionRequest): Promise<IncursionResponse> {
  let res: Response
  try {
    res = await fetch(INCURSION_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (e) {
    throw new IncursionApiError(`Sin conexión con el servidor de incursiones: ${String(e)}`)
  }
  const body = res.ok && res.headers.get('content-type')?.includes('application/json') ? ((await res.json()) as IncursionResponse) : null
  if (!body) throw new IncursionApiError(`El servidor de incursiones respondió ${res.status}`)
  return body
}
