import { Biome } from '../maps/mapCommon'
import { POKEMON } from '../pokemon'
import { foe, IncursionId, IncursionPrizeKind, IncursionTier, RoomKind, type Incursion } from './types'

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
      foes: [foe(POKEMON.Seel, 21, 'water-gun'), foe(POKEMON.Shellder, 21, 'powder-snow'), foe(POKEMON.Zubat, 20, 'gust')],
      reward: { money: 300, exp: 150 },
    },
    {
      kind: RoomKind.Battle,
      name: 'Galería de cristal',
      foes: [foe(POKEMON.Dewgong, 26, 'ice-beam'), foe(POKEMON.Jynx, 25, 'confuse-ray'), foe(POKEMON.Golbat, 25, 'fly')],
      reward: { money: 400, exp: 200 },
    },
    { kind: RoomKind.Heal, name: 'Manantial templado', heal: 0.4 },
    {
      kind: RoomKind.Battle,
      name: 'Guardián de hielo',
      foes: [
        foe(POKEMON.Cloyster, 31, 'blizzard', { hpMult: 2.5, boss: { areaEvery: 4 } }),
        foe(POKEMON.Shellder, 28, 'aurora-veil'),
        foe(POKEMON.Shellder, 28, 'powder-snow'),
      ],
      reward: { money: 600, exp: 300 },
    },
    { kind: RoomKind.Regroup, name: 'Antes del lago' },
    {
      kind: RoomKind.Battle,
      name: 'Orilla del lago',
      foes: [foe(POKEMON.Seadra, 34, 'surf'), foe(POKEMON.Tentacool, 33, 'toxic'), foe(POKEMON.Golbat, 34, 'bite')],
      reward: { money: 500, exp: 250 },
    },
    {
      kind: RoomKind.Battle,
      name: 'Lago subterráneo',
      foes: [
        foe(POKEMON.Gyarados, 37, 'surf', {
          hpMult: 6,
          boss: { enrage: { fromTurn: 15, every: 3, atk: 0.2 }, areaEvery: 4, phase: { belowHp: 0.5, moveId: 'hydro-pump' } },
        }),
      ],
      reward: { money: 1000, exp: 500 },
    },
  ],
  prizes: [
    { kind: IncursionPrizeKind.Money, amount: 3000, chance: 1 },
    { kind: IncursionPrizeKind.Exp, amount: 1500, chance: 1 },
    { kind: IncursionPrizeKind.Tickets, amount: 2, chance: 1 },
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Magikarp, amount: 3, chance: 0.5 },
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Lapras, amount: 1, chance: 0.25 },
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Gyarados, amount: 1, chance: 0.1 },
  ],
  bots: [POKEMON.Raichu, POKEMON.Clefable, POKEMON.Machoke, POKEMON.Kadabra, POKEMON.Ponyta, POKEMON.Magneton, POKEMON.Magmar, POKEMON.Hitmonchan],
}
