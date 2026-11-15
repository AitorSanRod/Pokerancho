import { POKEMON } from '../../data/pokemon'
import { initialState, type GameState, type OwnedMon } from '../core/state'
import { freshMember } from '../incursion/party'
import { createMon } from '../team/mons'
import { RaidRotation } from './online/protocol'
import { raidMoveChoices } from './raidMoves'
import type { RaidEntrant } from './raidRoom'
import { cycleBoss } from './rotationBosses'

// Piezas para los tests de la pestaña Raids, sin depender de los números reales.

export const ROTATION = RaidRotation.Ordered

/** El primer ataque que puede llevar contra el jefe un Pokémon de prueba de ese nivel */
export const raidMove = (level: number): string => raidMoveChoices({ speciesId: POKEMON.Snorlax, level, tmMoves: [] })[0].id

/** Un Pokémon de un jugador para la sala, con su primer ataque */
export function entrant(id: string, level = 50): RaidEntrant {
  const moveId = raidMove(level)
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
  return { s, mon, move: raidMove(mon.level) }
}
