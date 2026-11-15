// Todas las peticiones al servidor pasan por aquí: así ninguna se queda colgada para siempre con mala cobertura.

/** Milisegundos reales que se espera al servidor antes de darlo por perdido */
export const API_TIMEOUT_MS = 10_000

/** `fetch` que se rinde a los `timeoutMs` (con un error de red, como si no hubiera conexión) */
export function apiFetch(input: string, init: RequestInit = {}, timeoutMs = API_TIMEOUT_MS): Promise<Response> {
  return fetch(input, { ...init, signal: init.signal ?? AbortSignal.timeout(timeoutMs) })
}

/** POST con un cuerpo JSON */
export const postJson = (input: string, body: unknown, init: RequestInit = {}, timeoutMs?: number): Promise<Response> =>
  apiFetch(input, { ...init, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, timeoutMs)

/** Para las que mueven la partida entera (subirla, bajarla, intercambios): con mala cobertura tardan más */
export const SLOW_REQUEST_MS = 25_000
