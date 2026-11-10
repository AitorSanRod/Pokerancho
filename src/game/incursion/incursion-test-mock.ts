import { POKEMON } from '../../data/pokemon'
import { SUPPORT_MOVES } from '../../data/supportMoves'
import { IncursionId, IncursionPrizeKind, IncursionTier, RoomKind, type Incursion, type IncursionRoom } from '../../data/incursions/types'
import { Biome } from '../../data/maps/mapCommon'

export * from '../../data/incursions/types'

/**
 * Incursiones de mentira para los tests de la partida y del servidor, para no depender de las de verdad:
 * `vi.mock('../../data/incursions', () => import('./incursion-test-mock'))`. Dos salas fáciles con una de reorganizar
 * en medio
 */
const easy = { speciesId: POKEMON.Caterpie, level: 1, moveId: SUPPORT_MOVES.bug.id }
const room: IncursionRoom = { kind: RoomKind.Battle, name: 'Sala', foes: [easy], reward: { money: 10, exp: 20 } }

export const TEST_INCURSION: Incursion = {
  id: IncursionId.Prueba,
  name: 'Prueba',
  description: '',
  biome: Biome.Cave,
  tier: IncursionTier.Easy,
  minLevel: 10,
  maxLevel: 40,
  rooms: [room, { kind: RoomKind.Regroup, name: 'Reorganizar' }, room],
  prizes: [{ kind: IncursionPrizeKind.Money, amount: 100, chance: 1 }],
  bots: [POKEMON.Snorlax],
}

export const INCURSIONS: Incursion[] = [TEST_INCURSION]

export const incursion = (): Incursion => TEST_INCURSION
