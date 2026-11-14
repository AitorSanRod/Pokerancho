// En la tarjeta de una parada de entrenador o de gimnasio: el dibujo de quien la defiende y su equipo, con nivel.

import { GYMS, type GymFoe } from '../../src/data/gyms'
import { TRAINERS } from '../../src/data/trainers'
import { LEADER_SPRITES } from '../../src/ui/route/gym/leaderSprites'
import { TRAINER_SPRITES } from '../../src/ui/route/gym/trainerSprites'
import { DICTS, spriteById } from './catalog'
import type { NodeDraft } from './draft'
import { esc } from './fields'

function strip(name: string, image: string | undefined, team: GymFoe[]) {
  const foes = team.map((f) => `<figure><img src="${esc(spriteById(f.speciesId))}" alt="" />Nv. ${f.level}${f.statMult && f.statMult !== 1 ? ` ×${f.statMult}` : ''}</figure>`)
  const who = image ? `<img class="trainer" src="${esc(image)}" alt="${esc(name)}" title="${esc(name)}" />` : `<b>${esc(name)}</b>`
  return `<div class="full foe-strip">${who}${foes.join('')}</div>`
}

/** Quién espera en la parada y su equipo; vacío si la parada no es de entrenador ni de gimnasio */
export function stopTeam(n: NodeDraft): string {
  if (n.kind === 'Trainer') {
    const id = DICTS.TrainerId[n.trainer as keyof typeof DICTS.TrainerId]
    const t = id && TRAINERS[id]
    return t ? strip(t.name, TRAINER_SPRITES[t.look], t.team) : ''
  }
  if (n.kind === 'Gym') {
    const id = DICTS.GymId[n.gym as keyof typeof DICTS.GymId]
    const g = id && GYMS[id]
    return g ? strip(g.leader, LEADER_SPRITES[id], g.team) : ''
  }
  return ''
}
