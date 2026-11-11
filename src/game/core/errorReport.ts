// Errores que envían los jugadores desde la pantalla «Algo ha fallado» (worker/errorReport.ts): lo que manda la app y
// lo que acepta el servidor.

/** Letras como mucho del mensaje del error; lo que pase se corta */
export const MAX_ERROR_MESSAGE = 500
/** Letras como mucho de la pila (dónde falló); lo que pase se corta */
export const MAX_ERROR_STACK = 4_000
/** Letras como mucho de la pantalla en la que estaba (el componente de React) */
export const MAX_ERROR_COMPONENT = 2_000

export interface ErrorReport {
  message: string
  stack: string
  /** Componentes de React por los que pasó el error; vacío si no se sabe */
  component: string
}

const text = (v: unknown, max: number): string => (typeof v === 'string' ? v.slice(0, max) : '')

/** El informe con buena forma y recortado; null si no trae ni mensaje ni pila */
export function parseErrorReport(v: unknown): ErrorReport | null {
  const body = (typeof v === 'object' && v !== null ? v : {}) as Record<string, unknown>
  const report = {
    message: text(body.message, MAX_ERROR_MESSAGE).trim(),
    stack: text(body.stack, MAX_ERROR_STACK).trim(),
    component: text(body.component, MAX_ERROR_COMPONENT).trim(),
  }
  return report.message || report.stack ? report : null
}
