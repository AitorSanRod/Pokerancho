// Modo «Incursión»: escribe el fichero de una incursión para src/data/incursions/.

import { editorMode } from '../mode'
import { duplicateItem, listAt, moveItem, removeItem } from '../paths'
import { INCURSIONS } from './incCatalog'
import { incursionIssues, incursionSummary } from './incChecks'
import { incursionCode, incursionCodeHint, incursionExtra } from './incCodegen'
import { emptyFoe, emptyIncursion, emptyPrize, emptyRoom, emptySlot, fromIncursion, loadIncursionDraft, saveIncursionDraft, type IncursionDraft } from './incDraft'
import { parseIncursion } from './incPaste'
import { incursionForm } from './incView'
import { writeIncursion } from './incWrite'

function fromGame(id: string): IncursionDraft | null {
  const inc = INCURSIONS.find((i) => i.id === id)
  if (!inc || !confirm(`¿Cargar «${inc.name}»? Se pierde lo que hay en el formulario.`)) return null
  return fromIncursion(inc)
}

const push = (item: () => unknown) => (d: IncursionDraft, { list }: DOMStringMap) => listAt(d, list!).push(item())

export const INCURSION_MODE = editorMode<IncursionDraft>({
  label: 'Incursión',
  empty: emptyIncursion,
  load: loadIncursionDraft,
  save: saveIncursionDraft,
  form: incursionForm,
  code: incursionCode,
  extra: incursionExtra,
  codeHint: incursionCodeHint,
  issues: incursionIssues,
  summary: incursionSummary,
  actions: {
    'add-room': (d) => d.rooms.push(emptyRoom()),
    'add-slot': push(emptySlot),
    'add-option': push(() => ({ foe: emptyFoe(), weight: 1 })),
    'add-move': push(() => ''),
    'add-passive': push(() => ({ type: 'normal', level: 1 })),
    'add-prize': push(emptyPrize),
    'add-bot': push(() => ''),
    remove: removeItem,
    up: (d, data) => moveItem(d, data, -1),
    down: (d, data) => moveItem(d, data, 1),
    duplicate: (d, data) => duplicateItem(d, data),
  },
  gameOptions: () => INCURSIONS.map((i) => [i.id, i.name]),
  fromGame,
  parse: parseIncursion,
  write: writeIncursion,
  pasteHint:
    'Pega el fichero de la incursión (o solo su objeto, desde su <code>{</code> hasta su <code>}</code>), como está en <code>src/data/incursions/</code>. Se pierde lo que hay en el formulario.',
})
