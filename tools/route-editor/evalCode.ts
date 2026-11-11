// Evaluar el código pegado (una ruta, una incursión) con los mismos ayudantes y diccionarios de los datos del juego.
// No es un entorno aislado: es para pegar código propio.

import { missing } from './catalog'

/** Diccionario que, para una clave que no tiene, devuelve `onMissing(clave)` (por defecto, la clave marcada como desconocida) */
export const lenient = (dict: Record<string, unknown>, onMissing: (key: string) => unknown = missing) =>
  new Proxy(dict, { get: (d, k) => (typeof k === 'string' && !(k in d) ? onMissing(k) : d[k as string]) })

/**
 * Evalúa el texto como un objeto. El ámbito responde a cualquier nombre: el de un ayudante, o lo que diga `unknown`
 * para el resto (p. ej. las constantes de imagen de las rutas)
 */
export function evaluate<T>(text: string, helpers: Record<string, unknown>, unknown: (name: string) => unknown): T {
  const body = text.trim().replace(/[,;]\s*$/, '')
  const scope = new Proxy({} as Record<PropertyKey, unknown>, {
    has: (_, k) => typeof k === 'string',
    get: (_, k) => (typeof k === 'string' ? (k in helpers ? helpers[k] : unknown(k)) : undefined),
  })
  try {
    return new Function('scope', `with (scope) { return (${body}) }`)(scope) as T
  } catch (e) {
    throw new Error(`No se puede leer el código: ${(e as Error).message}`)
  }
}

const COMMENT_LINE = /^\s*(?:\{\s*)?\/\/\s*(.*)$/

/** Primer comentario `// …` (con sus líneas seguidas), para el campo «Comentario en el código» */
export function leadingComment(text: string): string {
  const lines = text.split('\n')
  const start = lines.findIndex((l) => COMMENT_LINE.test(l))
  if (start < 0) return ''
  const block: string[] = []
  for (const line of lines.slice(start)) {
    const m = COMMENT_LINE.exec(line)
    if (!m || (block.length && line.includes('{'))) break
    block.push(m[1].trim())
  }
  return block.join(' ').trim()
}
