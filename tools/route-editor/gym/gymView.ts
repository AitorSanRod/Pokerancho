// Formulario del gimnasio: id, líder (con su GIF si ya lo tiene), medalla y equipo, un Pokémon tras otro.

import { passiveText, typeName, TYPES } from '../catalog'
import { button, esc, label, numInput, optNumInput, select, speciesInput, textInput } from '../fields'
import { moveList } from '../incursion/foeView'
import { BADGE_OPTIONS, isNewGym, leaderSprite } from './gymCatalog'
import { gymIdValue } from './gymCodegen'
import type { GymDraft, GymFoeDraft } from './gymDraft'

function passiveList(f: GymFoeDraft, p: string) {
  const rows = f.passives
    .map(
      (ps, i) => `<div class="passive">
        ${select(`${p}.passives.${i}.type`, ps.type, TYPES.map((t) => [t, typeName(t)]))}
        ${select(`${p}.passives.${i}.level`, String(ps.level), [['1', 'Nivel 1'], ['2', 'Nivel 2']], undefined, 'num')}
        <small>${passiveText(ps.type, ps.level)}</small>
        ${button('remove', '×', `data-list="${p}.passives" data-index="${i}"`, 'icon')}
      </div>`,
    )
    .join('')
  return `<div class="full"><span class="sub">Pasivas</span>${rows}${button('add-passive', '+ Pasiva', `data-list="${p}.passives"`)}</div>`
}

function foeCard(f: GymFoeDraft, i: number, total: number) {
  const p = `team.${i}`
  const data = `data-list="team" data-index="${i}"`
  return `<div class="node kind-Gym">
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

function leaderPreview(d: GymDraft) {
  const gif = leaderSprite(gymIdValue(d))
  return gif ? `<img class="leader-gif" src="${esc(gif)}" alt="" />` : '<small>Sin GIF del líder todavía (ver «Añadir también»)</small>'
}

export function gymForm(d: GymDraft): string {
  return `
  <section class="card">
    <h2>Gimnasio</h2>
    <div class="grid">
      ${label('Id (clave de GymId)', textInput('idKey', d.idKey, 'Carmin'), isNewGym(d.idKey) ? 'nuevo' : 'ya existe: se sustituye')}
      ${label('Valor del id', textInput('idValue', d.idValue, gymIdValue(d) || 'carmin'), 'solo si es nuevo')}
      ${label('Líder', textInput('leader', d.leader, 'Lt. Surge'))}
      ${label('Medalla', select('badge', d.badge, BADGE_OPTIONS))}
      ${label('Nivel máximo para entrar', numInput('maxLevel', d.maxLevel), 'un Pokémon por encima no puede entrar')}
      <div class="full">${leaderPreview(d)}</div>
    </div>
  </section>
  <section class="card">
    <h2>Equipo <small>(los saca en este orden; tu Pokémon no se cura entre medias)</small></h2>
    ${d.team.map((f, i) => foeCard(f, i, d.team.length)).join('')}
    ${button('add-foe', '+ Pokémon', '', 'wide')}
  </section>`
}
