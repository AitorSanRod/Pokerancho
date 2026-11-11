// Editor de rutas e incursiones: formulario visual que escribe el código para pegarlo en los datos del juego.
// Se abre con `npm run dev` en http://localhost:5173/tools/route-editor/

import { DICTS, spriteOf, SPECIES_KEYS } from './catalog'
import { esc } from './fields'
import { MOVE_KEYS, moveText } from './incursion/incCatalog'
import { INCURSION_MODE } from './incursion/incursionMode'
import type { EditorMode } from './mode'
import { setupPaste } from './pasteDialog'
import { getAt, listAt, setAt } from './paths'
import { ROUTE_MODE } from './routeMode'

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const form = $<HTMLDivElement>('form')
const code = $<HTMLPreElement>('code')
const codeHint = $<HTMLParagraphElement>('code-hint')
const extra = $<HTMLPreElement>('extra')
const issues = $<HTMLUListElement>('issues')
const summary = $<HTMLParagraphElement>('summary')
const loadSelect = $<HTMLSelectElement>('load')
const modeSelect = $<HTMLSelectElement>('mode')
const writeButton = $<HTMLButtonElement>('write')

const MODES: Record<string, EditorMode> = { route: ROUTE_MODE, incursion: INCURSION_MODE }
const MODE_KEY = 'route-editor-mode'

let modeId = readMode()
const mode = () => MODES[modeId]

function readMode() {
  try {
    const saved = localStorage.getItem(MODE_KEY) ?? ''
    return saved in MODES ? saved : 'route'
  } catch {
    return 'route'
  }
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
  const m = mode()
  m.save()
  code.textContent = m.code()
  codeHint.innerHTML = m.codeHint()
  const more = m.extra()
  extra.textContent = more
  extra.parentElement!.hidden = !more
  const list = m.issues()
  issues.innerHTML = list.length ? list.map((i) => `<li>${esc(i)}</li>`).join('') : '<li class="ok">Todo cuadra</li>'
  summary.textContent = m.summary()
  for (const el of form.querySelectorAll<HTMLElement>('[data-sum]')) {
    const total = (listAt(m.root(), el.dataset.sum!) as { chance: number }[]).reduce((s, e) => s + (Number(e.chance) || 0), 0)
    el.textContent = `Suma: ${total}%`
    el.classList.toggle('bad', total !== 100)
  }
  for (const img of form.querySelectorAll<HTMLImageElement>('[data-sprite]')) img.src = spriteOf(String(getAt(m.root(), img.dataset.sprite!)))
}

function setupLoad() {
  const options = mode()
    .gameOptions()
    .map(([v, name]) => `<option value="${esc(v)}">${esc(name)}</option>`)
  loadSelect.innerHTML = `<option value="">Cargar ${mode().label.toLowerCase()} del juego…</option>${options.join('')}`
}

function render() {
  form.innerHTML = mode().form()
  refresh()
}

function switchMode() {
  modeSelect.value = modeId
  $<HTMLButtonElement>('reset').textContent = `${mode().label} nueva`
  writeButton.hidden = !mode().write
  setupLoad()
  render()
}

form.addEventListener('input', (e) => {
  const el = e.target as HTMLInputElement
  if (!el.dataset.bind) return
  setAt(mode().root(), el.dataset.bind, readValue(el))
  refresh()
})
form.addEventListener('change', (e) => {
  if ((e.target as HTMLElement).dataset.rerender !== undefined) render()
})
form.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-action]')
  if (!btn) return
  mode().act(btn.dataset.action!, btn.dataset)
  render()
})

modeSelect.addEventListener('change', () => {
  modeId = modeSelect.value
  try {
    localStorage.setItem(MODE_KEY, modeId)
  } catch {
    // Sin almacenamiento: al recargar se abre el modo por defecto
  }
  switchMode()
})
loadSelect.addEventListener('change', () => {
  const value = loadSelect.value
  loadSelect.value = ''
  if (value && mode().loadGame(value)) render()
})

function setupLists() {
  const datalist = (id: string, opts: [string, string][]) =>
    `<datalist id="${id}">${opts.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('')}</datalist>`
  document.body.insertAdjacentHTML(
    'beforeend',
    datalist('species-list', SPECIES_KEYS.map((k) => [k, ''])) +
      datalist('route-ids', Object.keys(DICTS.RouteId).map((k) => [k, ''])) +
      datalist('move-list', MOVE_KEYS.map((k) => [k, moveText(k)])),
  )
}

async function copy(btn: HTMLButtonElement, text: string) {
  await navigator.clipboard.writeText(text)
  const before = btn.textContent
  btn.textContent = 'Copiado'
  setTimeout(() => (btn.textContent = before), 1200)
}

$<HTMLButtonElement>('copy').addEventListener('click', (e) => copy(e.currentTarget as HTMLButtonElement, code.textContent ?? ''))
$<HTMLButtonElement>('copy-extra').addEventListener('click', (e) => copy(e.currentTarget as HTMLButtonElement, extra.textContent ?? ''))
/** Escribe el código en los ficheros del juego, solo si no hay avisos y tras confirmarlo */
async function writeToGame() {
  const m = mode()
  if (!m.write) return
  if (m.issues().length) return alert('Antes de guardar, resuelve los avisos.')
  if (!confirm(`¿Guardar en el juego?\n${codeHint.textContent}`)) return
  writeButton.disabled = true
  try {
    alert(await m.write())
  } catch (e) {
    alert(`No se ha guardado: ${(e as Error).message}`)
  } finally {
    writeButton.disabled = false
  }
}

writeButton.addEventListener('click', writeToGame)
$<HTMLButtonElement>('reset').addEventListener('click', () => {
  if (!confirm(`¿Empezar ${mode().label.toLowerCase()} nueva? Se pierde lo que hay en el formulario.`)) return
  mode().reset()
  render()
})

setupLists()
setupPaste(mode, render)
switchMode()
