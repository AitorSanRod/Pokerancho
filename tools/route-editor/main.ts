// Editor de rutas: formulario visual que escribe el objeto de la ruta para pegarlo en src/data/maps/kantoMaps.ts.
// Se abre con `npm run dev` en http://localhost:5173/tools/route-editor/

import { DICTS, KANTO, spriteOf, SPECIES_KEYS } from './catalog'
import { draftIssues, draftSummary } from './checks'
import { extraCode, routeCode } from './codegen'
import { emptyNode, emptyRoute, fromRoute, isChain, loadDraft, saveDraft, type RouteDraft } from './draft'
import { esc } from './fields'
import { nodeCard } from './nodeView'
import { setupPaste } from './paste'
import { routeSection } from './routeView'

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const form = $<HTMLDivElement>('form')
const code = $<HTMLPreElement>('code')
const extra = $<HTMLPreElement>('extra')
const issues = $<HTMLUListElement>('issues')
const summary = $<HTMLParagraphElement>('summary')
const loadSelect = $<HTMLSelectElement>('load')

let draft: RouteDraft = loadDraft()

type Bag = Record<string, unknown>
const parts = (path: string) => path.split('.')
const get = (path: string): unknown => parts(path).reduce<unknown>((o, k) => (o as Bag)[k], draft)
const listAt = (path: string) => get(path) as unknown[]

function set(path: string, value: unknown) {
  const keys = parts(path)
  const parent = keys.slice(0, -1).reduce<unknown>((o, k) => (o as Bag)[k], draft) as Bag
  parent[keys[keys.length - 1]] = value
}

function readValue(el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): unknown {
  const type = el.dataset.type
  if (type === 'bool') return (el as HTMLInputElement).checked
  if (type === 'num') return Number(el.value) || 0
  if (type === 'optnum') return el.value === '' ? null : Number(el.value)
  return el.value.trim() === '' ? '' : el.value
}

/** Código, avisos, sumas y sprites: lo que cambia al escribir sin repintar el formulario */
function refresh() {
  saveDraft(draft)
  code.textContent = routeCode(draft)
  const more = extraCode(draft)
  extra.textContent = more
  extra.parentElement!.hidden = !more
  const list = draftIssues(draft)
  issues.innerHTML = list.length ? list.map((i) => `<li>${esc(i)}</li>`).join('') : '<li class="ok">Todo cuadra</li>'
  summary.textContent = draftSummary(draft)
  for (const el of form.querySelectorAll<HTMLElement>('[data-sum]')) {
    const total = (listAt(el.dataset.sum!) as { chance: number }[]).reduce((s, e) => s + (Number(e.chance) || 0), 0)
    el.textContent = `Suma: ${total}%`
    el.classList.toggle('bad', total !== 100)
  }
  for (const img of form.querySelectorAll<HTMLImageElement>('[data-sprite]')) img.src = spriteOf(String(get(img.dataset.sprite!)))
}

function render() {
  const nodes = draft.nodes.map((n, i) => nodeCard(n, i, draft.nodes.length, draft.biome)).join('')
  form.innerHTML = `${routeSection(draft)}
    <section class="card"><h2>Paradas <small>(en orden; un camino sin bifurcaciones)</small></h2>${nodes}
    <button type="button" data-action="add-node" class="wide">+ Parada</button></section>`
  refresh()
}

/** id libre para una parada nueva: la siguiente letra que no esté usada */
function freeNodeId() {
  const used = new Set(draft.nodes.map((n) => n.id))
  for (let i = 0; ; i++) {
    const id = i < 26 ? String.fromCharCode(97 + i) : `n${i}`
    if (!used.has(id)) return id
  }
}

const ACTIONS: Record<string, (data: DOMStringMap) => void> = {
  'add-node': () => draft.nodes.push(emptyNode(freeNodeId())),
  'add-enc': ({ list }) => listAt(list!).push({ species: '', chance: 0 }),
  'add-passive': ({ list }) => listAt(list!).push({ type: 'normal', level: 1 }),
  remove: ({ list, index }) => listAt(list!).splice(Number(index), 1),
  duplicate: ({ index }) => {
    const copy = structuredClone(draft.nodes[Number(index)])
    draft.nodes.splice(Number(index) + 1, 0, { ...copy, id: freeNodeId(), kind: copy.kind === 'Start' ? 'Wild' : copy.kind, steps: copy.steps || 20 })
  },
  up: ({ index }) => move(Number(index), -1),
  down: ({ index }) => move(Number(index), 1),
}

function move(i: number, by: number) {
  const j = i + by
  if (j < 0 || j >= draft.nodes.length) return
  ;[draft.nodes[i], draft.nodes[j]] = [draft.nodes[j], draft.nodes[i]]
}

form.addEventListener('input', (e) => {
  const el = e.target as HTMLInputElement
  if (!el.dataset.bind) return
  set(el.dataset.bind, readValue(el))
  refresh()
})
form.addEventListener('change', (e) => {
  if ((e.target as HTMLElement).dataset.rerender !== undefined) render()
})
form.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-action]')
  if (!btn) return
  ACTIONS[btn.dataset.action!](btn.dataset)
  render()
})

function setupLoad() {
  const options = KANTO.routes.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`)
  loadSelect.innerHTML = `<option value="">Cargar una ruta del juego…</option>${options.join('')}`
  loadSelect.addEventListener('change', () => {
    const r = KANTO.routes.find((x) => x.id === loadSelect.value)
    loadSelect.value = ''
    if (!r || !confirm(`¿Cargar «${r.name}»? Se pierde lo que hay en el formulario.`)) return
    if (!isChain(r)) alert('Esta ruta tiene bifurcaciones: el editor la carga como un camino único.')
    draft = fromRoute(r)
    render()
  })
}

function setupLists() {
  const speciesOpts = SPECIES_KEYS.map((k) => `<option value="${k}"></option>`).join('')
  const routeOpts = Object.keys(DICTS.RouteId).map((k) => `<option value="${k}"></option>`).join('')
  document.body.insertAdjacentHTML('beforeend', `<datalist id="species-list">${speciesOpts}</datalist><datalist id="route-ids">${routeOpts}</datalist>`)
}

async function copy(btn: HTMLButtonElement, text: string) {
  await navigator.clipboard.writeText(text)
  const before = btn.textContent
  btn.textContent = 'Copiado'
  setTimeout(() => (btn.textContent = before), 1200)
}

$<HTMLButtonElement>('copy').addEventListener('click', (e) => copy(e.currentTarget as HTMLButtonElement, code.textContent ?? ''))
$<HTMLButtonElement>('copy-extra').addEventListener('click', (e) => copy(e.currentTarget as HTMLButtonElement, extra.textContent ?? ''))
$<HTMLButtonElement>('reset').addEventListener('click', () => {
  if (!confirm('¿Empezar una ruta nueva? Se pierde lo que hay en el formulario.')) return
  draft = emptyRoute()
  render()
})

setupLists()
setupLoad()
setupPaste((d) => {
  draft = d
  render()
})
render()
