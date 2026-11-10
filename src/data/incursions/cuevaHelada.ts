import { Biome } from '../maps/mapCommon'
import { IMOVE } from '../incursionMoves'
import { POKEMON } from '../pokemon'
import { foe, IncursionId, IncursionPrizeKind, IncursionTier, RoomKind, type Incursion } from './types'
import { StarItem } from '../starItems'

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
      foes: [foe(POKEMON.Seel, 21, [IMOVE.WaterGun.id, IMOVE.IceShard.id]), foe(POKEMON.Shellder, 21, [IMOVE.IceShard.id, IMOVE.PowderSnow.id]), foe(POKEMON.Zubat, 20, [IMOVE.Gust.id, IMOVE.ConfuseRay.id])],
      reward: { money: 300, exp: 150 },
    },
    {
      kind: RoomKind.Battle,
      name: 'Galería de cristal',
      foes: [foe(POKEMON.Dewgong, 26, [IMOVE.IceBeam.id, IMOVE.AquaRing.id]), foe(POKEMON.Jynx, 25, [IMOVE.Confusion.id, IMOVE.PowderSnow.id, IMOVE.FakeTears.id]), foe(POKEMON.Golbat, 25, [IMOVE.Fly.id, IMOVE.Bite.id])],
      reward: { money: 400, exp: 200 },
    },
    { 
      kind: RoomKind.Heal, 
      name: 'Manantial templado', 
      heal: 0.5 
    },
    {
      kind: RoomKind.Battle,
      name: 'Guardián de hielo',
      foes: [
        foe(POKEMON.Cloyster, 31, [IMOVE.Blizzard.id, IMOVE.IceShard.id], { hpMult: 2, boss: { areaEvery: 4 } }),
        foe(POKEMON.Shellder, 28, [IMOVE.PowderSnow.id, IMOVE.AuroraVeil.id]),
        foe(POKEMON.Shellder, 28, [IMOVE.IceShard.id, IMOVE.PowderSnow.id]),
      ],
      reward: { money: 600, exp: 300 },
    },
    { kind: RoomKind.Regroup, name: 'Antes del lago' },
    {
      kind: RoomKind.Battle,
      name: 'Orilla del lago',
      foes: [foe(POKEMON.Seadra, 34, [IMOVE.Surf.id, IMOVE.Twister.id]), foe(POKEMON.Tentacool, 33, [IMOVE.Acid.id, IMOVE.Toxic.id]), foe(POKEMON.Golbat, 34, [IMOVE.Bite.id, IMOVE.Fly.id])],
      reward: { money: 500, exp: 250 },
    },
    {
      kind: RoomKind.Battle,
      name: 'Lago subterráneo',
      foes: [
        foe(POKEMON.Gyarados, 37, [IMOVE.Surf.id, IMOVE.Bite.id], {
          hpMult: 6,
          boss: { enrage: { fromTurn: 15, every: 6, atk: 1 }, areaEvery: 4, phase: { belowHp: 0.5, moveIds: [IMOVE.HydroPump.id, IMOVE.Crunch.id] } },
        }),
      ],
      reward: { money: 1000, exp: 500 },
    },
  ],
  prizes: [
    { kind: IncursionPrizeKind.Money, amount: 20000, chance: 1 },
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
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Gyarados, amount: 3, chance: 0.1 },
  ],
  bots: [POKEMON.Raichu, POKEMON.Clefable, POKEMON.Machoke, POKEMON.Kadabra, POKEMON.Ponyta, POKEMON.Magneton, POKEMON.Magmar, POKEMON.Hitmonchan],
}
