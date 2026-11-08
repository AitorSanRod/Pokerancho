import { IncursionId, IncursionTier, RoomKind, type Incursion, type IncursionFoe, type IncursionRoom } from '../../data/incursions'
import { Biome } from '../../data/maps/mapCommon'
import { typeMove } from '../../data/moves'
import { POKEMON } from '../../data/pokemon'
import { Rarity } from '../../data/species'
import { MoveKind, SUPPORT_MOVES, type SupportMove } from '../../data/supportMoves'
import type { Battlefield } from './battlefield'
import type { IncursionEvent } from './events'
import { foeFighter, partyFighter, type GroupFighter, type MemberState } from './fighter'
import { freshMember } from './party'

// Piezas para los tests de incursiones, sin depender de las incursiones ni de los números reales.

export const LEVEL = 30
export const HIT = typeMove('normal', Rarity.Common).id

/** El primer movimiento de apoyo que haya de ese tipo de efecto */
export function supportOf<K extends SupportMove['kind']>(kind: K): Extract<SupportMove, { kind: K }> {
  const mv = Object.values(SUPPORT_MOVES).find((m) => m.kind === kind)
  if (!mv) throw new Error(`No hay movimiento de ${kind}`)
  return mv as Extract<SupportMove, { kind: K }>
}

export const member = (id: string, moveId = HIT, speciesId: number = POKEMON.Snorlax, level = LEVEL): MemberState =>
  freshMember({ id, speciesId, level, stars: 0, moveId })

export const ally = (id: string, moveId = HIT, speciesId?: number): GroupFighter => partyFighter(member(id, moveId, speciesId), LEVEL)

export const enemy = (id: string, extra: Partial<IncursionFoe> = {}): GroupFighter =>
  foeFighter({ speciesId: POKEMON.Rattata, levelDelta: 0, moveId: HIT, ...extra }, id, LEVEL)

export function field(party: GroupFighter[], foes: GroupFighter[], revives = 0): { bf: Battlefield; events: IncursionEvent[] } {
  const events: IncursionEvent[] = []
  return { bf: { party, foes, revives, turn: 1, falls: 0, passives: [], log: (e) => events.push(e) }, events }
}

export const battleRoom = (foes: IncursionFoe[], money = 10, exp = 20): IncursionRoom => ({
  kind: RoomKind.Battle,
  name: 'Sala',
  foes,
  reward: { money, exp },
})

/** Un rival que cae de un golpe y apenas pega */
export const weakFoe = (): IncursionFoe => ({ speciesId: POKEMON.Caterpie, levelDelta: -LEVEL + 1, moveId: supportOf(MoveKind.Boost).id })

export const testIncursion = (rooms: IncursionRoom[], prizes: Incursion['prizes'] = []): Incursion => ({
  id: IncursionId.CuevaHelada,
  name: 'Prueba',
  description: '',
  biome: Biome.Cave,
  tier: IncursionTier.Easy,
  minLevel: 1,
  maxLevel: 100,
  levels: [1, 100],
  rooms,
  prizes,
  bots: [POKEMON.Snorlax],
})
