// Formulario de una incursión: datos generales, salas, premios al terminarla y bots.

import { DICTS } from '../catalog'
import { button, checkbox, label, numInput, select, speciesInput, textArea, textInput } from '../fields'
import { INC_DICTS, PRIZE_LABELS, STAR_OPTIONS, TIER_OPTIONS, TM_OPTIONS } from './incCatalog'
import type { IncursionDraft, PrizeDraft } from './incDraft'
import { roomCard } from './roomView'

const opts = (dict: Record<string, unknown>): [string, string][] => Object.keys(dict).map((k) => [k, k])

function idFields(d: IncursionDraft) {
  const isNew = d.idKey !== '' && !(d.idKey in INC_DICTS.IncursionId)
  const input = `<input type="text" data-bind="idKey" data-type="text" data-rerender value="${d.idKey}" placeholder="CuevaHelada" />`
  return (
    label('Id (clave de IncursionId)', input, isNew ? 'nueva' : '') +
    (isNew ? label('Valor del IncursionId nuevo', textInput('idValue', d.idValue, 'se guarda en la partida: cueva-helada')) : '')
  )
}

function generalSection(d: IncursionDraft) {
  return `<section class="card">
    <h2>Incursión</h2>
    <div class="grid">
      ${idFields(d)}
      ${label('Nombre', textInput('name', d.name, 'Cueva Helada'))}
      <div class="full">${label('Descripción', textArea('description', d.description))}</div>
      <div class="full">${checkbox('free', d.free, 'Gratuita: sin llave, y lo ganado solo se cobra la primera vez')}</div>
      <div class="full">${label('Comentario en el código', textInput('comment', d.comment), 'opcional')}</div>
      ${label('Bioma (fondo)', select('biome', d.biome, opts(DICTS.Biome)))}
      ${label('Dificultad', select('tier', d.tier, TIER_OPTIONS))}
      ${label('Nivel mínimo para entrar', numInput('minLevel', d.minLevel))}
      ${label('Nivel máximo para entrar', numInput('maxLevel', d.maxLevel))}
    </div>
  </section>`
}

function prizeWhat(p: PrizeDraft, path: string) {
  if (p.kind === 'Pieces') return speciesInput(`${path}.species`, p.species)
  if (p.kind === 'StarItem') return select(`${path}.item`, p.item, STAR_OPTIONS)
  if (p.kind === 'Tm') return select(`${path}.tm`, p.tm, TM_OPTIONS)
  return ''
}

function prizesSection(d: IncursionDraft) {
  const rows = d.prizes
    .map((p, i) => {
      const path = `prizes.${i}`
      return `<div class="prize">
        ${select(`${path}.kind`, p.kind, Object.entries(PRIZE_LABELS))}
        ${prizeWhat(p, path)}
        <span class="chance">× ${numInput(`${path}.amount`, p.amount)}</span>
        <span class="chance">${numInput(`${path}.chance`, p.chance, 0.1)}%</span>
        ${button('remove', '×', `data-list="prizes" data-index="${i}"`, 'icon')}
      </div>`
    })
    .join('')
  return `<section class="card">
    <h2>Premios al terminarla <small>(para cada uno; cada línea se tira por separado con su probabilidad)</small></h2>
    <div class="encounters">${rows}${button('add-prize', '+ Premio', 'data-list="prizes"')}</div>
  </section>`
}

function botsSection(d: IncursionDraft) {
  const rows = d.bots
    .map((b, i) => `<div class="enc">${speciesInput(`bots.${i}`, b)}${button('remove', '×', `data-list="bots" data-index="${i}"`, 'icon')}</div>`)
    .join('')
  return `<section class="card">
    <h2>Bots <small>(especies que pueden llevar los que completan el grupo)</small></h2>
    <div class="encounters">${rows}${button('add-bot', '+ Pokémon', 'data-list="bots"')}</div>
  </section>`
}

export function incursionForm(d: IncursionDraft) {
  const rooms = d.rooms.map((r, i) => roomCard(r, i, d.rooms.length)).join('')
  return `${generalSection(d)}
    <section class="card"><h2>Salas <small>(en orden)</small></h2>${rooms}
    <button type="button" data-action="add-room" class="wide">+ Sala</button></section>
    ${prizesSection(d)}
    ${botsSection(d)}`
}
