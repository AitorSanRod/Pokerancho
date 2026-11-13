// Campos de un rival de incursión: especie, nivel, ataques, PS extra, pasivas y mecánicas de jefe.

import { passiveText, typeName, TYPES } from '../catalog'
import { button, checkbox, esc, label, numInput, optNumInput, select, speciesInput } from '../fields'
import { moveText } from './incCatalog'

/** En las incursiones las pasivas de los rivales cuentan enteras (game/incursion/fighter.ts) */
const INCURSION_PASSIVE_SCALE = 1
import type { FoeDraft } from './incDraft'

/** Lista de ataques (claves de IMOVE) con buscador y lo que es cada uno al lado */
export function moveList(moves: string[], path: string) {
  const rows = moves
    .map(
      (m, i) => `<div class="move">
        <input type="text" list="move-list" data-bind="${path}.${i}" data-type="text" data-rerender value="${esc(m)}" placeholder="Placaje" />
        <small>${esc(moveText(m) || (m ? 'no es un ataque' : ''))}</small>
        ${button('remove', '×', `data-list="${path}" data-index="${i}"`, 'icon')}
      </div>`,
    )
    .join('')
  return `<div class="moves">${rows}${button('add-move', '+ Ataque', `data-list="${path}"`)}</div>`
}

function passiveList(f: FoeDraft, p: string) {
  const rows = f.passives
    .map(
      (ps, i) => `<div class="passive">
        ${select(`${p}.passives.${i}.type`, ps.type, TYPES.map((t) => [t, typeName(t)]))}
        ${select(`${p}.passives.${i}.level`, String(ps.level), [['1', 'Nivel 1'], ['2', 'Nivel 2']], undefined, 'num')}
        <small>${passiveText(ps.type, ps.level, INCURSION_PASSIVE_SCALE)}</small>
        ${button('remove', '×', `data-list="${p}.passives" data-index="${i}"`, 'icon')}
      </div>`,
    )
    .join('')
  return `<div class="full"><span class="sub">Pasivas</span>${rows}${button('add-passive', '+ Pasiva', `data-list="${p}.passives"`)}</div>`
}

function bossFields(f: FoeDraft, p: string) {
  const { enrage, areaEvery, phase } = f.boss
  const b = `${p}.boss`
  const enrageFields = enrage.on
    ? label('Desde el turno', numInput(`${b}.enrage.fromTurn`, enrage.fromTurn)) +
      label('Cada (turnos)', numInput(`${b}.enrage.every`, enrage.every)) +
      label('Etapas de Ataque', numInput(`${b}.enrage.atk`, enrage.atk))
    : ''
  const phaseFields = phase.on
    ? label('Por debajo de (% PS)', numInput(`${b}.phase.belowHp`, phase.belowHp)) +
      `<div class="full"><span class="sub">Ataques de la segunda fase</span>${moveList(phase.moves, `${b}.phase.moves`)}</div>`
    : ''
  return `<div class="full boss-box grid">
    ${label('Golpe a todo el grupo cada (turnos)', optNumInput(`${b}.areaEvery`, areaEvery, 'nunca'))}
    <div class="full">${checkbox(`${b}.enrage.on`, enrage.on, 'Furia: su Ataque sube con los turnos')}</div>${enrageFields}
    <div class="full">${checkbox(`${b}.phase.on`, phase.on, 'Segunda fase: cambia de ataques con pocos PS')}</div>${phaseFields}
  </div>`
}

/** Los campos de un rival; `p` es la ruta del rival en el borrador */
export function foeFields(f: FoeDraft, p: string) {
  return `
    ${label('Pokémon', speciesInput(`${p}.species`, f.species))}
    ${label('Nivel', numInput(`${p}.level`, f.level))}
    ${label('Multiplicador de PS', optNumInput(`${p}.hpMult`, f.hpMult, '1', 0.5), 'los jefes, ~5')}
    <div class="full"><span class="sub">Ataques <small>(usa el que tenga sentido en cada turno)</small></span>${moveList(f.moves, `${p}.moves`)}</div>
    ${passiveList(f, p)}
    <div class="full">${checkbox(`${p}.isBoss`, f.isBoss, 'Jefe (mecánicas especiales)')}</div>
    ${f.isBoss ? bossFields(f, p) : ''}`
}
