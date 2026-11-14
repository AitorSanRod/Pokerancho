// Modo «Entrenador»: escribe la entrada de un entrenador (nombre, aspecto y equipo) para TRAINERS de src/data/trainers.ts.

import type { TrainerId } from '../../../src/data/trainers'
import { editorMode } from '../mode'
import { duplicateItem, listAt, moveItem, removeItem } from '../paths'
import { emptyFoe } from '../team/teamDraft'
import { TRAINER_ENTRIES, TRAINERS } from './trainerCatalog'
import { trainerIssues, trainerSummary } from './trainerChecks'
import { trainerCode, trainerCodeHint, trainerExtra } from './trainerCodegen'
import { emptyTrainer, fromTrainer, loadTrainerDraft, saveTrainerDraft, type TrainerDraft } from './trainerDraft'
import { parseTrainer } from './trainerPaste'
import { trainerForm } from './trainerView'
import { writeTrainer } from './trainerWrite'

function fromGame(key: string): TrainerDraft | null {
  const entry = TRAINER_ENTRIES.find(([k]) => k === key)
  if (!entry) return null
  const trainer = TRAINERS[entry[1] as TrainerId]
  if (!confirm(`¿Cargar a ${trainer.name} (${key})? Se pierde lo que hay en el formulario.`)) return null
  return fromTrainer(entry[0], entry[1], trainer)
}

const push = (item: () => unknown) => (d: TrainerDraft, { list }: DOMStringMap) => listAt(d, list!).push(item())

export const TRAINER_MODE = editorMode<TrainerDraft>({
  label: 'Entrenador',
  newLabel: 'Entrenador nuevo',
  empty: emptyTrainer,
  load: loadTrainerDraft,
  save: saveTrainerDraft,
  form: trainerForm,
  code: trainerCode,
  extra: trainerExtra,
  codeHint: trainerCodeHint,
  issues: trainerIssues,
  summary: trainerSummary,
  actions: {
    'add-foe': (d) => d.team.push(emptyFoe(d.team.at(-1)?.level)),
    'add-move': push(() => ''),
    'add-passive': push(() => ({ type: 'normal', level: 1 })),
    remove: removeItem,
    up: (d, data) => moveItem(d, data, -1),
    down: (d, data) => moveItem(d, data, 1),
    duplicate: (d, data) => duplicateItem(d, data),
  },
  gameOptions: () => TRAINER_ENTRIES.map(([k, v]) => [k, `${TRAINERS[v as TrainerId].name} (${k})`]),
  fromGame,
  parse: parseTrainer,
  write: writeTrainer,
  pasteHint:
    'Pega la entrada del entrenador tal cual está en <code>TRAINERS</code> de <code>src/data/trainers.ts</code> (desde <code>[TrainerId.X]: {</code> hasta su <code>},</code>) o solo su objeto. Se pierde lo que hay en el formulario.',
})
