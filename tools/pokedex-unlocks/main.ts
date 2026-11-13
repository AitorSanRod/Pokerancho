// Pokédex de herramienta: cada especie con si se puede conseguir en el juego y cómo (ver unlocks.ts).

import { dexSections } from '../../src/data/pokedexes'
import { RARITY_INFO, rarityOf, species, sprite } from '../../src/data/species'
import { TYPE_INFO } from '../../src/data/types'
import { Status, STATUS_LABELS, speciesUnlocks, type Source, type SpeciesUnlock } from './unlocks'

const UNLOCKS = new Map(speciesUnlocks().map((u) => [u.id, u]))
const ALL = 'all'

let filter: Status | typeof ALL = ALL
let query = ''
let selected: number | null = null

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

function el(tag: string, className: string, text = ''): HTMLElement {
  const node = document.createElement(tag)
  node.className = className
  node.textContent = text
  return node
}

const pad = (id: number) => `#${String(id).padStart(4, '0')}`

function matches(u: SpeciesUnlock): boolean {
  if (filter !== ALL && u.status !== filter) return false
  const q = query.trim().toLowerCase()
  return q === '' || species(u.id).name.toLowerCase().includes(q) || String(u.id) === q.replace('#', '').replace(/^0+/, '')
}

function renderFilters() {
  const box = $('filters')
  box.replaceChildren()
  const all = [...UNLOCKS.values()]
  const options: [Status | typeof ALL, string, number][] = [
    [ALL, 'Todos', all.length],
    ...Object.values(Status).map((s): [Status, string, number] => [s, STATUS_LABELS[s], all.filter((u) => u.status === s).length]),
  ]
  for (const [value, label, count] of options) {
    const btn = el('button', `chip status-${value}${filter === value ? ' on' : ''}`, `${label} · ${count}`)
    btn.onclick = () => {
      filter = value
      render()
    }
    box.append(btn)
  }
}

function cell(u: SpeciesUnlock): HTMLElement {
  const sp = species(u.id)
  const btn = el('button', `cell status-${u.status}${selected === u.id ? ' on' : ''}`)
  btn.title = `${sp.name}: ${STATUS_LABELS[u.status]}`
  const img = document.createElement('img')
  img.src = sprite.front(u.id)
  img.alt = ''
  img.loading = 'lazy'
  const rarity = el('span', 'rarity')
  rarity.style.background = RARITY_INFO[rarityOf(sp)].color
  btn.append(rarity, img, el('span', 'num', pad(u.id)), el('span', 'name', sp.name))
  btn.onclick = () => {
    selected = u.id
    render()
  }
  return btn
}

function renderDex() {
  const box = $('dex')
  box.replaceChildren()
  for (const section of dexSections()) {
    const shown = section.species.map((sp) => UNLOCKS.get(sp.id)!).filter(matches)
    if (shown.length === 0) continue
    const total = section.species.length
    const ok = section.species.filter((sp) => UNLOCKS.get(sp.id)!.status !== Status.None).length
    const title = `${section.dex?.name ?? 'Nacional'} · ${ok} de ${total} desbloqueables`
    const grid = el('div', 'grid')
    grid.append(...shown.map(cell))
    box.append(el('h2', 'section', title), grid)
  }
  if (!box.hasChildNodes()) box.append(el('p', 'muted', 'Ningún Pokémon con ese filtro.'))
}

function sourceList(title: string, sources: Source[]): HTMLElement[] {
  if (sources.length === 0) return []
  const list = el('ul', 'sources')
  for (const s of sources) {
    const li = el('li', '')
    li.append(el('strong', '', s.where), document.createTextNode(` · ${s.how}`))
    list.append(li)
  }
  return [el('h3', '', title), list]
}

function renderDetail() {
  const box = $('detail')
  if (selected === null) return
  const u = UNLOCKS.get(selected)!
  const sp = species(u.id)
  const img = document.createElement('img')
  img.src = sprite.animated(u.id)
  img.onerror = () => (img.src = sprite.front(u.id))
  img.alt = sp.name
  const types = el('div', 'types')
  for (const t of sp.types) {
    const chip = el('span', 'type', TYPE_INFO[t].name)
    chip.style.background = TYPE_INFO[t].color
    types.append(chip)
  }
  const rarity = RARITY_INFO[rarityOf(sp)]
  box.replaceChildren(
    el('p', 'num', pad(u.id)),
    el('h2', '', sp.name),
    img,
    types,
    el('p', `badge status-${u.status}`, STATUS_LABELS[u.status]),
    el('p', 'muted', `Rareza: ${rarity.name}`),
    ...sourceList('Se ve (y se crea con tickets)', u.seen),
    ...sourceList('Evoluciona desde', u.evolvesFrom),
    ...sourceList('También aparece', u.hints),
  )
  if (u.status === Status.None) box.append(el('p', 'muted', 'No sale en ninguna ruta abierta ni jefe, y no evoluciona de uno que se pueda conseguir.'))
}

function render() {
  renderFilters()
  renderDex()
  renderDetail()
}

$<HTMLInputElement>('search').oninput = (e) => {
  query = (e.target as HTMLInputElement).value
  renderDex()
}
render()
