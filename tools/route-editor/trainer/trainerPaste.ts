// Pegar un entrenador tal cual está en TRAINERS de src/data/trainers.ts: `Joven1: { … },` o solo su objeto. Lo que no
// existe en los diccionarios (un ataque mal escrito) se carga con su nombre para los avisos.

import { IMOVE } from '../../../src/data/incursionMoves'
import type { Trainer } from '../../../src/data/trainers'
import { DICTS, missing } from '../catalog'
import { evaluate, lenient } from '../evalCode'
import { fromTrainer, type TrainerDraft } from './trainerDraft'

const HELPERS: Record<string, unknown> = {
  POKEMON: lenient(DICTS.POKEMON),
  TrainerClass: lenient(DICTS.TrainerClass),
  TrainerName: lenient(DICTS.TrainerName),
  Gender: lenient(DICTS.Gender),
  IMOVE: lenient(IMOVE, (key) => ({ id: missing(key) })),
}

/** `Joven1: {` (o, como antes, `[TrainerId.Joven1]: {`), con comentarios encima */
const ENTRY = /^\s*(?:\/\/[^\n]*\n\s*)*(?:\[TrainerId\.(\w+)\]|([A-Z]\w*))\s*:\s*/

export function parseTrainer(text: string): TrainerDraft {
  const entry = ENTRY.exec(text)
  const body = entry ? text.slice(entry[0].length) : text
  const trainer = evaluate<Trainer>(body, HELPERS, (name) => {
    throw new Error(`no se conoce «${name}»`)
  })
  if (!trainer || typeof trainer !== 'object' || !Array.isArray(trainer.team)) throw new Error('No parece un entrenador: falta `team: [ … ]`')
  return fromTrainer(entry?.[1] ?? entry?.[2] ?? '', trainer)
}
