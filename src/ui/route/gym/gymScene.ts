import { GYMS, type GymId } from '../../../data/gyms'
import { node, NodeKind, route } from '../../../data/maps'
import { species } from '../../../data/species'
import type { Run } from '../../../game/core/state'

/** Lo que se ve del combate contra el líder: quién es, cuántos Pokémon tiene y cuál ha sacado */
export interface GymScene {
  gymId: GymId
  leader: string
  /** Su Pokémon en combate (posición en su equipo) */
  index: number
  total: number
  foeName: string
}

/** El combate contra el líder en curso, si la ruta está en su parada de gimnasio; null si no */
export function gymScene(run: Run): GymScene | null {
  const n = node(route(run.routeId), run.path[run.stop])
  if (n.kind !== NodeKind.Gym || !n.gym || !run.gym) return null
  const gym = GYMS[n.gym]
  const foe = gym.team[run.gym.index]
  return { gymId: n.gym, leader: gym.leader, index: run.gym.index, total: gym.team.length, foeName: species(foe.speciesId).name }
}

/** Lo que anuncia al sacar a su Pokémon */
export const sendOutText = (g: GymScene): string => (g.index === 0 ? `¡${g.leader} te reta!` : `¡${g.leader} saca a ${g.foeName}!`)
