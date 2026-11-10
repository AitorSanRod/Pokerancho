import { IncursionId, IncursionTier, RoomKind, type Incursion, type IncursionFoe, type IncursionRoom } from '../../data/incursions'
import { Biome } from '../../data/maps/mapCommon'
import { POKEMON } from '../../data/pokemon'
import { Rarity } from '../../data/species'
import { DAMAGE_BY_TYPE, EffectKind, effectOf, IMOVE, type IncursionMove } from '../../data/incursionMoves'
import type { Battlefield } from './battlefield'
import type { IncursionEvent } from './events'
import { foeFighter, partyFighter, type GroupFighter, type MemberState } from './fighter'
import { freshMember } from './party'
import { noTurnOrders, type TurnOrders } from './tapWindow'

// Piezas para los tests de incursiones, sin depender de las incursiones ni de los números reales.

export const LEVEL = 30
export const HIT = DAMAGE_BY_TYPE.normal[Rarity.Common].id

/** El primer movimiento de apoyo que haya de ese tipo de efecto */
export function moveWith(kind: EffectKind): IncursionMove {
  const mv = Object.values(IMOVE).find((m) => effectOf(m, kind))
  if (!mv) throw new Error(`No hay movimiento de ${kind}`)
  return mv
}

export const member = (id: string, moveId = HIT, speciesId: number = POKEMON.Snorlax, level = LEVEL): MemberState =>
  freshMember({ id, speciesId, level, stars: 0, moveId })

export const ally = (id: string, moveId = HIT, speciesId?: number): GroupFighter => partyFighter(member(id, moveId, speciesId))

export const enemy = (id: string, extra: Partial<IncursionFoe> = {}): GroupFighter =>
  foeFighter({ speciesId: POKEMON.Rattata, level: LEVEL, moveIds: [HIT], ...extra }, id)

export function field(party: GroupFighter[], foes: GroupFighter[], revives = 0): { bf: Battlefield; events: IncursionEvent[] } {
  const events: IncursionEvent[] = []
  return { bf: { party, foes, revives, turn: 1, falls: 0, passives: [], boosted: [], log: (e) => events.push(e) }, events }
}

/** Ventanas de toques que se cierran sin que nadie potencie su ataque */
export const NO_TAPS = (): TurnOrders => noTurnOrders()

export const battleRoom = (foes: IncursionFoe[], money = 10, exp = 20): IncursionRoom => ({
  kind: RoomKind.Battle,
  name: 'Sala',
  foes,
  reward: { money, exp },
})

/** Un rival que cae de un golpe y apenas pega */
export const weakFoe = (): IncursionFoe => ({ speciesId: POKEMON.Caterpie, level: 1, moveIds: [moveWith(EffectKind.Raise).id] })

export const testIncursion = (rooms: IncursionRoom[], prizes: Incursion['prizes'] = []): Incursion => ({
  id: IncursionId.CuevaHelada,
  name: 'Prueba',
  description: '',
  biome: Biome.Cave,
  tier: IncursionTier.Easy,
  minLevel: 1,
  maxLevel: 100,
  rooms,
  prizes,
  bots: [POKEMON.Snorlax],
})
