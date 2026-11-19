import { Biome } from '../maps/mapCommon'
import { IMOVE } from '../incursionMoves'
import { POKEMON } from '../pokemon'
import { PokeType } from '../types'
import { foe, IncursionId, IncursionPrizeKind, IncursionTier, oneOf, RoomKind, weighted, type Incursion } from './types'
import { StarItem } from '../starItems'
import { Tm } from '../tms'

export const VOLCAN_CANELA: Incursion = {
  id: IncursionId.VolcanCanela,
  name: 'Volcán Canela',
  description: 'Ríos de lava y Pokémon de fuego. En el corazón del volcán arde Moltres.',
  biome: Biome.MtMoon,
  tier: IncursionTier.Hard,
  minLevel: 45,
  maxLevel: 70,
  rooms: [
    {
      kind: RoomKind.Battle,
      name: 'Ladera',
      foes: [
        foe(POKEMON.Ponyta, 50, [IMOVE.Ascuas.id, IMOVE.Pisoton.id]),
        foe(POKEMON.Growlithe, 50, [IMOVE.ColmilloIgneo.id, IMOVE.Mordisco.id]),
        oneOf(
          foe(POKEMON.Charmeleon, 51, [IMOVE.Lanzallamas.id, IMOVE.Cuchillada.id]),
          foe(POKEMON.Quilava, 51, [IMOVE.RuedaFuego.id, IMOVE.AtaqueRapido.id]),
          foe(POKEMON.Charcadet, 51, [IMOVE.Lanzallamas.id, IMOVE.FuegoFatuo.id]),
        ),
      ],
      reward: { money: 800, exp: 400 },
    },
    {
      kind: RoomKind.Battle,
      name: 'Ríos de lava',
      foes: [
        foe(POKEMON.Magmar, 54, [IMOVE.Lanzallamas.id, IMOVE.PunoFuego.id, IMOVE.FuegoFatuo.id]),
        foe(POKEMON.Rapidash, 54, [IMOVE.RuedaFuego.id, IMOVE.Pisoton.id]),
        weighted(
          [foe(POKEMON.Houndour, 53, [IMOVE.Lanzallamas.id, IMOVE.Mordisco.id]), 2],
          [foe(POKEMON.Graveler, 53, [IMOVE.Avalancha.id, IMOVE.DefensaFerrea.id]), 1],
        ),
      ],
      reward: { money: 900, exp: 450 },
    },
    { kind: RoomKind.Heal, name: 'Fumarola', heal: 0.3 },
    {
      kind: RoomKind.Battle,
      name: 'Cráter',
      foes: [
        foe(POKEMON.Arcanine, 57, [IMOVE.Lanzallamas.id, IMOVE.Triturar.id], {
          hpMult: 3,
          passives: [{ type: PokeType.Fire, level: 1 }],
          boss: { areaEvery: 4, phase: { belowHp: 0.3, moveIds: [IMOVE.VelocidadExtrema.id, IMOVE.Llamarada.id] } },
        }),
        foe(POKEMON.Ninetales, 56, [IMOVE.Lanzallamas.id, IMOVE.FuegoFatuo.id]),
        foe(POKEMON.Flareon, 56, [IMOVE.Humareda.id, IMOVE.Mordisco.id]),
      ],
      reward: { money: 1200, exp: 600 },
    },
    { kind: RoomKind.Revive, name: 'Cueva de obsidiana', hp: 0.5 },
    {
      kind: RoomKind.Battle,
      name: 'Cámara de magma',
      foes: [
        foe(POKEMON.Volcarona, 58, [IMOVE.Zumbido.id, IMOVE.OndaIgnea.id]),
        foe(POKEMON.Houndoom, 58, [IMOVE.PulsoNoche.id, IMOVE.Lanzallamas.id]),
        foe(POKEMON.Typhlosion, 58, [IMOVE.Lanzallamas.id, IMOVE.Humareda.id]),
      ],
      reward: { money: 1100, exp: 550 },
    },
    { kind: RoomKind.Heal, name: 'Fuente termal', heal: 0.5 },
    {
      kind: RoomKind.Battle,
      name: 'Corazón del volcán',
      foes: [
        foe(POKEMON.Moltres, 62, [IMOVE.Lanzallamas.id, IMOVE.AtaqueAla.id, IMOVE.VientoAfin.id], {
          hpMult: 6,
          passives: [{ type: PokeType.Fire, level: 2 }],
          boss: { enrage: { fromTurn: 15, every: 6, atk: 1 }, areaEvery: 3, phase: { belowHp: 0.3, moveIds: [IMOVE.Sofoco.id, IMOVE.Vendaval.id] } },
        }),
      ],
      reward: { money: 2000, exp: 1000 },
    },
  ],
  prizes: [
    { kind: IncursionPrizeKind.Money, amount: 50000, chance: 1 },
    { kind: IncursionPrizeKind.Money, amount: 30000, chance: 0.1 },
    { kind: IncursionPrizeKind.Money, amount: 100000, chance: 0.01 },
    { kind: IncursionPrizeKind.Exp, amount: 15000, chance: 1 },
    { kind: IncursionPrizeKind.Exp, amount: 15000, chance: 0.1 },
    { kind: IncursionPrizeKind.Exp, amount: 30000, chance: 0.01 },
    { kind: IncursionPrizeKind.Tickets, amount: 40, chance: 1 },
    { kind: IncursionPrizeKind.Tickets, amount: 20, chance: 0.1 },
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Growlithe, amount: 3, chance: 0.5 },
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Moltres, amount: 3, chance: 0.02 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.Stardust, amount: 1, chance: 0.4 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.StarPiece, amount: 1, chance: 0.08 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.CometShard, amount: 1, chance: 0.02 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.Humareda, amount: 1, chance: 0.08 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.FuerzaTelurica, amount: 1, chance: 0.05 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.Respiro, amount: 1, chance: 0.05 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.MartilloDragon, amount: 1, chance: 0.03 },
  ],
  bots: [POKEMON.Blastoise, POKEMON.Golem, POKEMON.Starmie, POKEMON.Machamp, POKEMON.Clefable, POKEMON.Alakazam, POKEMON.Snorlax, POKEMON.Pidgeot],
}
