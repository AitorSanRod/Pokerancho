// Modo «Ruta»: escribe el objeto de una ruta para `routes` de src/data/maps/kantoMaps.ts.

import { KANTO } from './catalog'
import { draftIssues, draftSummary } from './checks'
import { extraCode, routeCode } from './codegen'
import { emptyNode, emptyRoute, fromRoute, isChain, loadDraft, saveDraft, type NodeDraft, type RouteDraft } from './draft'
import { editorMode } from './mode'
import { nodeCard } from './nodeView'
import { parsePasted } from './paste'
import { duplicateItem, listAt, moveItem, removeItem } from './paths'
import { routeSection } from './routeView'

/** id libre para una parada nueva: la siguiente letra que no esté usada */
function freeNodeId(d: RouteDraft) {
  const used = new Set(d.nodes.map((n) => n.id))
  for (let i = 0; ; i++) {
    const id = i < 26 ? String.fromCharCode(97 + i) : `n${i}`
    if (!used.has(id)) return id
  }
}

function form(d: RouteDraft) {
  const nodes = d.nodes.map((n, i) => nodeCard(n, i, d.nodes.length, d.biome)).join('')
  return `${routeSection(d)}
    <section class="card"><h2>Paradas <small>(en orden; un camino sin bifurcaciones)</small></h2>${nodes}
    <button type="button" data-action="add-node" class="wide">+ Parada</button></section>`
}

function fromGame(id: string): RouteDraft | null {
  const r = KANTO.routes.find((x) => x.id === id)
  if (!r || !confirm(`¿Cargar «${r.name}»? Se pierde lo que hay en el formulario.`)) return null
  if (!isChain(r)) alert('Esta ruta tiene bifurcaciones: el editor la carga como un camino único.')
  return fromRoute(r)
}

export const ROUTE_MODE = editorMode<RouteDraft>({
  label: 'Ruta',
  empty: emptyRoute,
  load: loadDraft,
  save: saveDraft,
  form,
  code: routeCode,
  extra: extraCode,
  codeHint: () =>
    'Pégalo dentro de <code>routes: [ … ]</code> de <code>src/data/maps/kantoMaps.ts</code>, en lugar de la ruta antigua si la estás editando.',
  issues: draftIssues,
  summary: draftSummary,
  actions: {
    'add-node': (d) => d.nodes.push(emptyNode(freeNodeId(d))),
    'add-enc': (d, { list }) => listAt(d, list!).push({ species: '', chance: 0 }),
    'add-passive': (d, { list }) => listAt(d, list!).push({ type: 'normal', level: 1 }),
    remove: removeItem,
    up: (d, data) => moveItem(d, data, -1),
    down: (d, data) => moveItem(d, data, 1),
    duplicate: (d, data) =>
      duplicateItem<NodeDraft>(d, data, (c) => ({ ...c, id: freeNodeId(d), kind: c.kind === 'Start' ? 'Wild' : c.kind, steps: c.steps || 20 })),
  },
  gameOptions: () => KANTO.routes.map((r) => [r.id, r.name]),
  fromGame,
  parse: parsePasted,
  pasteHint:
    'Pega el objeto entero de la ruta, desde su <code>{</code> hasta su <code>}</code>, como está en <code>kantoMaps.ts</code>. Se pierde lo que hay en el formulario.',
})
