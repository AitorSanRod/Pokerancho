// Formulario del equipo de un líder o de un entrenador: una tarjeta por Pokémon, en el orden en que los saca.

import { PASSIVE_LEVEL_OPTS, passiveText, typeName, TYPES } from '../catalog'
import { button, label, numInput, optNumInput, select, speciesInput } from '../fields'
import { moveList } from '../incursion/foeView'
import type { FoeDraft } from './teamDraft'

function passiveList(f: FoeDraft, p: string) {
  const rows = f.passives
    .map(
      (ps, i) => `<div class="passive">
        ${select(`${p}.passives.${i}.type`, ps.type, TYPES.map((t) => [t, typeName(t)]))}
        ${select(`${p}.passives.${i}.level`, String(ps.level), PASSIVE_LEVEL_OPTS, undefined, 'num')}
        <small>${passiveText(ps.type, ps.level)}</small>
        ${button('remove', '×', `data-list="${p}.passives" data-index="${i}"`, 'icon')}
      </div>`,
    )
    .join('')
  return `<div class="full"><span class="sub">Pasivas</span>${rows}${button('add-passive', '+ Pasiva', `data-list="${p}.passives"`)}</div>`
}

function foeCard(f: FoeDraft, i: number, total: number, kindClass: string) {
  const p = `team.${i}`
  const data = `data-list="team" data-index="${i}"`
  return `<div class="node ${kindClass}">
    <header>
      <b>Pokémon ${i + 1}</b><small>${i === 0 ? 'sale el primero' : ''}</small><span class="spacer"></span>
      ${i > 0 ? button('up', '↑', data, 'icon') : ''}${i < total - 1 ? button('down', '↓', data, 'icon') : ''}
      ${button('duplicate', 'Duplicar', data)}${button('remove', '×', data, 'icon danger')}
    </header>
    <div class="grid">
      ${label('Pokémon', speciesInput(`${p}.species`, f.species))}
      ${label('Nivel', numInput(`${p}.level`, f.level))}
      ${label('Multiplicador de stats', optNumInput(`${p}.statMult`, f.statMult, '1', 0.05), '1.2 = +20 %')}
      <div class="full"><span class="sub">Ataques <small>(de daño; en cada turno usa el que más daño espera hacer. Sin ninguno, el suyo de siempre)</small></span>${moveList(f.moves, `${p}.moves`)}</div>
      ${passiveList(f, p)}
    </div>
  </div>`
}

/** Sección del equipo; `kindClass` es el color de las tarjetas (`kind-Gym`, `kind-Trainer`) */
export function teamSection(team: FoeDraft[], kindClass: string) {
  return `<section class="card">
    <h2>Equipo <small>(los saca en este orden; tu Pokémon no se cura entre medias)</small></h2>
    ${team.map((f, i) => foeCard(f, i, team.length, kindClass)).join('')}
    ${button('add-foe', '+ Pokémon', '', 'wide')}
  </section>`
}
