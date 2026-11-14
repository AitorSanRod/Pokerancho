// Formulario del gimnasio: id, líder (con su GIF si ya lo tiene), medalla y equipo, un Pokémon tras otro.

import { esc, label, numInput, select, textInput } from '../fields'
import { teamSection } from '../team/teamView'
import { BADGE_OPTIONS, isNewGym, leaderSprite } from './gymCatalog'
import { gymIdValue } from './gymCodegen'
import type { GymDraft } from './gymDraft'

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
  ${teamSection(d.team, 'kind-Gym')}`
}
