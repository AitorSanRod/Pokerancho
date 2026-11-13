// Modo «Gimnasio»: escribe la entrada de un gimnasio (líder, medalla y equipo) para GYMS de src/data/gyms.ts.

import type { GymId } from '../../../src/data/gyms'
import { editorMode } from '../mode'
import { duplicateItem, listAt, moveItem, removeItem } from '../paths'
import { GYM_ENTRIES, GYMS } from './gymCatalog'
import { gymIssues, gymSummary } from './gymChecks'
import { gymCode, gymCodeHint, gymExtra } from './gymCodegen'
import { emptyGym, emptyGymFoe, fromGym, loadGymDraft, saveGymDraft, type GymDraft } from './gymDraft'
import { parseGym } from './gymPaste'
import { gymForm } from './gymView'
import { writeGym } from './gymWrite'

function fromGame(key: string): GymDraft | null {
  const entry = GYM_ENTRIES.find(([k]) => k === key)
  if (!entry) return null
  const gym = GYMS[entry[1] as GymId]
  if (!confirm(`¿Cargar el gimnasio de ${gym.leader}? Se pierde lo que hay en el formulario.`)) return null
  return fromGym(entry[0], entry[1], gym)
}

const push = (item: () => unknown) => (d: GymDraft, { list }: DOMStringMap) => listAt(d, list!).push(item())

export const GYM_MODE = editorMode<GymDraft>({
  label: 'Gimnasio',
  newLabel: 'Gimnasio nuevo',
  empty: emptyGym,
  load: loadGymDraft,
  save: saveGymDraft,
  form: gymForm,
  code: gymCode,
  extra: gymExtra,
  codeHint: gymCodeHint,
  issues: gymIssues,
  summary: gymSummary,
  actions: {
    'add-foe': (d) => d.team.push(emptyGymFoe()),
    'add-move': push(() => ''),
    'add-passive': push(() => ({ type: 'normal', level: 1 })),
    remove: removeItem,
    up: (d, data) => moveItem(d, data, -1),
    down: (d, data) => moveItem(d, data, 1),
    duplicate: (d, data) => duplicateItem(d, data),
  },
  gameOptions: () => GYM_ENTRIES.map(([k, v]) => [k, `${GYMS[v as GymId].leader} (${k})`]),
  fromGame,
  parse: parseGym,
  write: writeGym,
  pasteHint:
    'Pega la entrada del gimnasio tal cual está en <code>GYMS</code> de <code>src/data/gyms.ts</code> (desde <code>[GymId.X]: {</code> hasta su <code>},</code>) o solo su objeto. Se pierde lo que hay en el formulario.',
})
