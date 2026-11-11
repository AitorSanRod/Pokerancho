// Pegar una incursión tal cual está en su fichero (con o sin los imports y el `export const X: Incursion =`). Lo que no
// existe en los diccionarios (un IncursionId nuevo, un ataque mal escrito) se carga con su nombre para los avisos.

import { foe, oneOf, weighted, type Incursion } from '../../../src/data/incursions'
import { IMOVE } from '../../../src/data/incursionMoves'
import { DICTS, missing } from '../catalog'
import { evaluate, leadingComment, lenient } from '../evalCode'
import { INC_DICTS } from './incCatalog'
import { fromIncursion, type IncursionDraft } from './incDraft'

const HELPERS: Record<string, unknown> = {
  foe,
  oneOf,
  weighted,
  POKEMON: lenient(DICTS.POKEMON),
  Biome: lenient(DICTS.Biome),
  // `IMOVE.Desconocido.id`: el ataque que no existe se queda con su nombre
  IMOVE: lenient(IMOVE, (key) => ({ id: missing(key) })),
  ...Object.fromEntries(Object.entries(INC_DICTS).map(([name, dict]) => [name, lenient(dict)])),
}

/** El objeto de la incursión: lo que va tras `= ` si se pega el fichero entero, sin imports */
function objectText(text: string): string {
  const assigned = /:\s*Incursion\s*=\s*/.exec(text)
  return assigned ? text.slice(assigned.index + assigned[0].length) : text
}

export function parseIncursion(text: string): IncursionDraft {
  const inc = evaluate<Incursion>(objectText(text), HELPERS, (name) => {
    throw new Error(`no se conoce «${name}»`)
  })
  if (!inc || typeof inc !== 'object' || !Array.isArray(inc.rooms)) throw new Error('No parece una incursión: falta `rooms: [ … ]`')
  const draft = fromIncursion({ ...inc, prizes: inc.prizes ?? [], bots: inc.bots ?? [] })
  draft.comment = leadingComment(text.replace(/^import .*$/gm, ''))
  return draft
}
