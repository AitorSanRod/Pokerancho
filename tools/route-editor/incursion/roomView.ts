// Tarjeta de una sala de incursión y, en las de combate, sus plazas de rival (fijas o al azar entre varias opciones).

import { button, label, numInput, select, textInput } from '../fields'
import { MAX_ROOM_FOES, ROOM_LABELS } from './incCatalog'
import type { RoomDraft, SlotDraft } from './incDraft'
import { foeFields } from './foeView'

function slotCard(s: SlotDraft, p: string, j: number) {
  const random = s.options.length > 1
  const options = s.options
    .map((o, k) => {
      const op = `${p}.options.${k}`
      const head = random
        ? `<header><b>Opción ${k + 1}</b>${label('Peso', numInput(`${op}.weight`, o.weight))}<span class="spacer"></span>
            ${button('remove', '×', `data-list="${p}.options" data-index="${k}"`, 'icon danger')}</header>`
        : ''
      return `<div class="option">${head}<div class="grid">${foeFields(o.foe, `${op}.foe`)}</div></div>`
    })
    .join('')
  const list = p.slice(0, p.lastIndexOf('.'))
  return `<div class="slot">
    <header>
      <b>Rival ${j + 1}</b><small>${random ? 'sale uno al azar según su peso' : ''}</small><span class="spacer"></span>
      ${button('add-option', '+ Alternativa al azar', `data-list="${p}.options"`)}
      ${button('duplicate', 'Duplicar', `data-list="${list}" data-index="${j}"`)}
      ${button('remove', '×', `data-list="${list}" data-index="${j}"`, 'icon danger')}
    </header>${options}
  </div>`
}

function battleFields(r: RoomDraft, p: string) {
  const slots = r.slots.map((s, j) => slotCard(s, `${p}.slots.${j}`, j)).join('')
  const add = r.slots.length < MAX_ROOM_FOES ? button('add-slot', '+ Rival', `data-list="${p}.slots"`, 'wide') : ''
  return `
    ${label('Dinero (₽) al superarla', numInput(`${p}.reward.money`, r.reward.money))}
    ${label('EXP al superarla', numInput(`${p}.reward.exp`, r.reward.exp))}
    <div class="full">${slots}${add}</div>`
}

function kindFields(r: RoomDraft, p: string) {
  if (r.kind === 'Battle') return battleFields(r, p)
  if (r.kind === 'Heal') return label('% de PS que recuperan', numInput(`${p}.percent`, r.percent))
  if (r.kind === 'Revive') return label('% de PS con que se levantan', numInput(`${p}.percent`, r.percent))
  return ''
}

export function roomCard(r: RoomDraft, i: number, count: number) {
  const p = `rooms.${i}`
  const at = `data-list="rooms" data-index="${i}"`
  return `<article class="node room-${r.kind}">
    <header>
      <b>${i + 1}</b>
      ${select(`${p}.kind`, r.kind, Object.entries(ROOM_LABELS))}
      <span class="spacer"></span>
      ${button('up', '↑', at, 'icon')}${button('down', '↓', at, 'icon')}
      ${button('duplicate', 'Duplicar', at)}${count > 1 ? button('remove', '×', at, 'icon danger') : ''}
    </header>
    <div class="grid">
      ${label('Nombre', textInput(`${p}.name`, r.name, 'Entrada helada'))}
      ${kindFields(r, p)}
    </div>
  </article>`
}
