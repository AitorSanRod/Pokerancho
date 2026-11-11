import { Biome } from '../maps/mapCommon'
import { IMOVE } from '../incursionMoves'
import { POKEMON } from '../pokemon'
import { foe, IncursionId, IncursionPrizeKind, IncursionTier, RoomKind, weighted, type Incursion } from './types'
import { StarItem } from '../starItems'
import { Tm } from '../tms'

export const CUEVA_HELADA: Incursion = {
  id: IncursionId.CuevaHelada,
  name: 'Cueva Helada',
  description: 'Galerías de hielo y un lago subterráneo donde espera Gyarados.',
  biome: Biome.Cave,
  tier: IncursionTier.Easy,
  minLevel: 20,
  maxLevel: 45,
  rooms: [
    {
      kind: RoomKind.Battle,
      name: 'Entrada helada',
      foes: [
        foe(POKEMON.Seel, 24, [IMOVE.PistolaAgua.id, IMOVE.CantoHelado.id]),
        weighted(
          [foe(POKEMON.Shellder, 30, [IMOVE.CantoHelado.id, IMOVE.NievePolvo.id]), 4],
          [foe(POKEMON.Squirtle, 25, [IMOVE.PistolaAgua.id, IMOVE.AcuaAro.id]), 4],
          [foe(POKEMON.Onix, 22, [IMOVE.TumbaRocas.id, IMOVE.Atadura.id]), 2],
        ),
        weighted(
          [foe(POKEMON.Shellder, 36, [IMOVE.CantoHelado.id, IMOVE.NievePolvo.id]), 5],
          [foe(POKEMON.Tentacool, 30, [IMOVE.PistolaAgua.id, IMOVE.Acido.id]), 5],
        )
      ],
      reward: { money: 300, exp: 150 },
    },
    {
      kind: RoomKind.Battle,
      name: 'Galería de cristal',
      foes: [
        foe(POKEMON.Dewgong, 34, [IMOVE.RayoHielo.id, IMOVE.AcuaAro.id]), 
        foe(POKEMON.Jynx, 35, [IMOVE.Confusion.id, IMOVE.NievePolvo.id, IMOVE.LlantoFalso.id]), 
        foe(POKEMON.Golbat, 21, [IMOVE.Vuelo.id, IMOVE.Mordisco.id])
      ],
      reward: { money: 400, exp: 200 },
    },
    {
      kind: RoomKind.Heal,
      name: 'Manantial templado',
      heal: 0.3
    },
    {
      kind: RoomKind.Battle,
      name: 'Guardián de hielo',
      foes: [
        foe(POKEMON.Cloyster, 34, [IMOVE.Ventisca.id, IMOVE.CantoHelado.id], { hpMult: 2, boss: { areaEvery: 4 } }),
        foe(POKEMON.Shellder, 28, [IMOVE.NievePolvo.id, IMOVE.VeloAurora.id]),
        foe(POKEMON.Shellder, 28, [IMOVE.CantoHelado.id, IMOVE.NievePolvo.id]),
      ],
      reward: { money: 600, exp: 300 },
    },
    {
      kind: RoomKind.Heal,
      name: 'Manantial templado',
      heal: 0.5
    },
    {
      kind: RoomKind.Battle,
      name: 'Lago',
      foes: [
        foe(POKEMON.Glaceon, 33, [IMOVE.RayoAurora.id, IMOVE.DefensaFerrea.id]), 
        weighted(
          [foe(POKEMON.Seadra, 34, [IMOVE.Surf.id, IMOVE.Ciclon.id]), 5],
          [foe(POKEMON.Golbat, 34, [IMOVE.Mordisco.id, IMOVE.Vuelo.id]), 5],
        )
      ],
      reward: { money: 500, exp: 250 },
    },
    {
      kind: RoomKind.Battle,
      name: 'Sala final',
      foes: [
        foe(POKEMON.Gyarados, 37, [IMOVE.Surf.id, IMOVE.Mordisco.id], {
          hpMult: 5,
          boss: { enrage: { fromTurn: 15, every: 6, atk: 1 }, areaEvery: 4, phase: { belowHp: 0.3, moveIds: [IMOVE.Hidrobomba.id, IMOVE.Triturar.id] } },
        }),
      ],
      reward: { money: 1000, exp: 500 },
    },
  ],
  prizes: [
    { kind: IncursionPrizeKind.Money, amount: 15000, chance: 1 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.Stardust, amount: 1, chance: 0.2 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.StarPiece, amount: 1, chance: 0.025 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.CometShard, amount: 1, chance: 0.005 },
    { kind: IncursionPrizeKind.Money, amount: 10000, chance: 0.1 },
    { kind: IncursionPrizeKind.Money, amount: 30000, chance: 0.01 },
    { kind: IncursionPrizeKind.Exp, amount: 5000, chance: 1 },
    { kind: IncursionPrizeKind.Exp, amount: 5000, chance: 0.1 },
    { kind: IncursionPrizeKind.Exp, amount: 10000, chance: 0.01 },
    { kind: IncursionPrizeKind.Tickets, amount: 20, chance: 1 },
    { kind: IncursionPrizeKind.Tickets, amount: 10, chance: 0.1 },
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Magikarp, amount: 3, chance: 0.5 },
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Lapras, amount: 3, chance: 0.05 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.Senuelo, amount: 1, chance: 0.05 },
  ],
  bots: [POKEMON.Raichu, POKEMON.Clefable, POKEMON.Machoke, POKEMON.Kadabra, POKEMON.Ponyta, POKEMON.Magneton, POKEMON.Magmar, POKEMON.Hitmonchan],
}
