import { Biome } from '../maps/mapCommon'
import { IMOVE } from '../incursionMoves'
import { POKEMON } from '../pokemon'
import { foe, IncursionId, IncursionPrizeKind, IncursionTier, RoomKind, type Incursion } from './types'
import { StarItem } from '../starItems'

// Incursión de prueba: corta, de nivel bajo y con una sala de cada tipo, para probar el modo entero sin esperar.

export const PRUEBA: Incursion = {
  id: IncursionId.Prueba,
  name: 'Incursión de prueba',
  description: 'Corta y de nivel bajo, con una sala de cada tipo. Para probar el modo.',
  biome: Biome.Forest,
  tier: IncursionTier.Easy,
  minLevel: 5,
  maxLevel: 20,
  rooms: [
    {
      kind: RoomKind.Battle,
      name: 'Claro del bosque',
      foes: [foe(POKEMON.Caterpie, 6, [IMOVE.Tackle.id]), foe(POKEMON.Weedle, 6, [IMOVE.FuryCutter.id, IMOVE.Toxic.id])],
      reward: { money: 50, exp: 30 },
    },
    { kind: RoomKind.Heal, name: 'Fuente', heal: 0.5 },
    { kind: RoomKind.Regroup, name: 'Antes de la cueva' },
    { kind: RoomKind.Revive, name: 'Altar', hp: 0.5 },
    {
      kind: RoomKind.Battle,
      name: 'Guarida de Onix',
      foes: [foe(POKEMON.Onix, 12, [IMOVE.RockThrow.id, IMOVE.SandAttack.id], { hpMult: 3, boss: { enrage: { fromTurn: 8, every: 4, atk: 1 }, areaEvery: 3 } })],
      reward: { money: 100, exp: 60 },
    },
  ],
  prizes: [
    { kind: IncursionPrizeKind.Money, amount: 200, chance: 1 },
    { kind: IncursionPrizeKind.Tickets, amount: 1, chance: 1 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.Stardust, amount: 1, chance: 0.1 },
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Onix, amount: 1, chance: 0.5 },
  ],
  bots: [POKEMON.Pikachu, POKEMON.Clefairy, POKEMON.Geodude, POKEMON.Oddish, POKEMON.Machop],
}
