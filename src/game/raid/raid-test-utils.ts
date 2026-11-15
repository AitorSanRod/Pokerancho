import { POKEMON } from '../../data/pokemon'
import { initialState, type GameState, type OwnedMon } from '../core/state'
import { freshMember } from '../incursion/party'
import { repertoire } from '../incursion/repertoire'
import { createMon } from '../team/mons'
import { RaidRotation } from './online/protocol'
import type { RaidEntrant } from './raidRoom'
import { cycleBoss } from './rotationBosses'

// Piezas para los tests de la pestaña Raids, sin depender de los números reales.

export const ROTATION = RaidRotation.Ordered

/** Un Pokémon de un jugador para la sala, con su primer ataque */
export function entrant(id: string, level = 50): RaidEntrant {
  const moveId = repertoire(POKEMON.Snorlax, level)[0].id
  return { member: freshMember({ id, speciesId: POKEMON.Snorlax, level, stars: 0, moveId }), trainer: id }
}

/** Partida con un Pokémon en el rancho que puede ir contra el jefe del ciclo */
export function raidReady(cycle: number): { s: GameState; mon: OwnedMon; move: string } {
  const s = initialState()
  s.tutorial = null
  const level = Math.max(cycleBoss(ROTATION, cycle).minLevel ?? 1, cycleBoss(ROTATION, cycle).level)
  const mon = createMon(POKEMON.Snorlax, level, 0)
  s.owned.push(mon)
  s.activeUid = mon.uid
  return { s, mon, move: repertoire(mon.speciesId, mon.level)[0].id }
}
