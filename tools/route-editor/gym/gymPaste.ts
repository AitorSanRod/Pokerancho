// Pegar un gimnasio tal cual está en GYMS de src/data/gyms.ts: `[GymId.Celeste]: { … },` o solo su objeto. Lo que no
// existe en los diccionarios (un ataque mal escrito) se carga con su nombre para los avisos.

import type { Gym } from '../../../src/data/gyms'
import { IMOVE } from '../../../src/data/incursionMoves'
import { DICTS, missing } from '../catalog'
import { evaluate, lenient } from '../evalCode'
import { fromGym, type GymDraft } from './gymDraft'
import { gymIdValue } from './gymCodegen'

const HELPERS: Record<string, unknown> = {
  POKEMON: lenient(DICTS.POKEMON),
  Badge: lenient(DICTS.Badge),
  // `IMOVE.Desconocido.id`: el ataque que no existe se queda con su nombre
  IMOVE: lenient(IMOVE, (key) => ({ id: missing(key) })),
}

const ENTRY = /^\s*\[GymId\.(\w+)\]\s*:\s*/

export function parseGym(text: string): GymDraft {
  const entry = ENTRY.exec(text)
  const body = entry ? text.slice(entry[0].length) : text
  const gym = evaluate<Gym>(body, HELPERS, (name) => {
    throw new Error(`no se conoce «${name}»`)
  })
  if (!gym || typeof gym !== 'object' || !Array.isArray(gym.team)) throw new Error('No parece un gimnasio: falta `team: [ … ]`')
  const draft = fromGym(entry?.[1] ?? '', '', gym)
  draft.idValue = DICTS.GymId[draft.idKey as keyof typeof DICTS.GymId] ?? gymIdValue(draft)
  return draft
}
