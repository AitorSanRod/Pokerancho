// Modo «Entrenador»: escribe la entrada de un entrenador (clase, nombre y equipo) para TRAINERS de src/data/trainers.ts.

import type { TrainerId } from '../../../src/data/trainers'
import { DICTS, keyOf } from '../catalog'
import { editorMode } from '../mode'
import { duplicateItem, listAt, moveItem, removeItem } from '../paths'
import { emptyFoe } from '../team/teamDraft'
import { fixedWho, trainerIdentity } from '../../../src/game/run/trainerIdentity'
import { classTitles, TRAINER_KEYS, TRAINERS } from './trainerCatalog'
import { trainerIssues, trainerSummary } from './trainerChecks'
import { trainerCode, trainerCodeHint, trainerExtra } from './trainerCodegen'
import { emptyTrainer, fromTrainer, loadTrainerDraft, saveTrainerDraft, type TrainerDraft } from './trainerDraft'
import { parseTrainer } from './trainerPaste'
import { trainerForm } from './trainerView'
import { writeTrainer } from './trainerWrite'

/** Cómo se llama en la lista: su nombre fijo o los títulos de su clase */
function shownName(id: TrainerId): string {
  const t = TRAINERS[id]
  return t.name ? trainerIdentity(t, fixedWho(t)).name : classTitles(keyOf(DICTS.TrainerClass, t.trainerClass))
}

function fromGame(key: string): TrainerDraft | null {
  const id = TRAINER_KEYS.find((k) => k === key)
  if (!id) return null
  if (!confirm(`¿Cargar a ${shownName(id)} (${key})? Se pierde lo que hay en el formulario.`)) return null
  return fromTrainer(id, TRAINERS[id])
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
  gameOptions: () => TRAINER_KEYS.map((k) => [k, `${shownName(k)} (${k})`]),
  fromGame,
  parse: parseTrainer,
  write: writeTrainer,
  pasteHint:
    'Pega la entrada del entrenador tal cual está en <code>TRAINERS</code> de <code>src/data/trainers.ts</code> (desde <code>Joven1: {</code> hasta su <code>},</code>) o solo su objeto. Se pierde lo que hay en el formulario.',
})
