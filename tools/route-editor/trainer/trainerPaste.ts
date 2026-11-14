// Pegar un entrenador tal cual está en TRAINERS de src/data/trainers.ts: `[TrainerId.X]: { … },` o solo su objeto. Lo
// que no existe en los diccionarios (un ataque mal escrito) se carga con su nombre para los avisos.

import { IMOVE } from '../../../src/data/incursionMoves'
import type { Trainer } from '../../../src/data/trainers'
import { DICTS, missing } from '../catalog'
import { evaluate, lenient } from '../evalCode'
import { trainerIdOf } from './trainerCatalog'
import { fromTrainer, type TrainerDraft } from './trainerDraft'

const HELPERS: Record<string, unknown> = {
  POKEMON: lenient(DICTS.POKEMON),
  TrainerLook: lenient(DICTS.TrainerLook),
  IMOVE: lenient(IMOVE, (key) => ({ id: missing(key) })),
}

const ENTRY = /^\s*(?:\/\/[^\n]*\n\s*)*\[TrainerId\.(\w+)\]\s*:\s*/

export function parseTrainer(text: string): TrainerDraft {
  const entry = ENTRY.exec(text)
  const body = entry ? text.slice(entry[0].length) : text
  const trainer = evaluate<Trainer>(body, HELPERS, (name) => {
    throw new Error(`no se conoce «${name}»`)
  })
  if (!trainer || typeof trainer !== 'object' || !Array.isArray(trainer.team)) throw new Error('No parece un entrenador: falta `team: [ … ]`')
  const idKey = entry?.[1] ?? ''
  const known = DICTS.TrainerId[idKey as keyof typeof DICTS.TrainerId]
  return fromTrainer(idKey, known ?? trainerIdOf(idKey, ''), trainer)
}
