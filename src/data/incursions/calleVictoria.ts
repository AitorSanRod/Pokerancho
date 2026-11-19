import { Biome } from '../maps/mapCommon'
import { IMOVE } from '../incursionMoves'
import { POKEMON } from '../pokemon'
import { PokeType } from '../types'
import { foe, IncursionId, IncursionPrizeKind, IncursionTier, oneOf, RoomKind, type Incursion } from './types'
import { StarItem } from '../starItems'
import { Tm } from '../tms'

export const CALLE_VICTORIA: Incursion = {
  id: IncursionId.CalleVictoria,
  name: 'Calle Victoria',
  description: 'Cuevas de roca y acero antes de la Liga. A la salida esperan Rhydon y Aerodactyl.',
  biome: Biome.Cave,
  tier: IncursionTier.Hard,
  minLevel: 48,
  maxLevel: 70,
  rooms: [
    {
      kind: RoomKind.Battle,
      name: 'Entrada',
      foes: [
        foe(POKEMON.Graveler, 49, [IMOVE.Avalancha.id, IMOVE.DefensaFerrea.id]),
        foe(POKEMON.Onix, 49, [IMOVE.TumbaRocas.id, IMOVE.Atadura.id], { hpMult: 1.3 }),
        oneOf(
          foe(POKEMON.Machoke, 49, [IMOVE.TajoCruzado.id, IMOVE.Corpulencia.id]),
          foe(POKEMON.Sandslash, 49, [IMOVE.Excavar.id, IMOVE.Cuchillada.id]),
        ),
      ],
      reward: { money: 850, exp: 420 },
    },
    {
      kind: RoomKind.Battle,
      name: 'Galería de cascadas',
      foes: [
        foe(POKEMON.Golbat, 52, [IMOVE.Vuelo.id, IMOVE.RayoConfuso.id]),
        foe(POKEMON.Rhyhorn, 51, [IMOVE.Taladradora.id, IMOVE.Cornada.id]),
        foe(POKEMON.Kabutops, 52, [IMOVE.ConchaFilo.id, IMOVE.AcuaJet.id]),
      ],
      reward: { money: 900, exp: 450 },
    },
    { kind: RoomKind.Heal, name: 'Remanso', heal: 0.3 },
    {
      kind: RoomKind.Battle,
      name: 'Pasadizo de acero',
      foes: [
        foe(POKEMON.Excadrill, 54, [IMOVE.Taladradora.id, IMOVE.GarraMetal.id], {
          hpMult: 2,
          passives: [{ type: PokeType.Steel, level: 1 }],
          boss: { areaEvery: 4, phase: { belowHp: 0.3, moveIds: [IMOVE.Terremoto.id] } },
        }),
        foe(POKEMON.Skarmory, 54, [IMOVE.AlaDeAcero.id, IMOVE.DefensaFerrea.id]),
        foe(POKEMON.Krookodile, 54, [IMOVE.Terremoto.id, IMOVE.Triturar.id]),
      ],
      reward: { money: 1200, exp: 600 },
    },
    { kind: RoomKind.Revive, name: 'Campamento', hp: 0.5 },
    {
      kind: RoomKind.Battle,
      name: 'Gran caverna',
      foes: [
        foe(POKEMON.Golem, 56, [IMOVE.Avalancha.id, IMOVE.Terremoto.id], { hpMult: 1.5 }),
        foe(POKEMON.Omastar, 55, [IMOVE.Surf.id, IMOVE.PoderPasado.id]),
        foe(POKEMON.Marowak, 55, [IMOVE.HuesoPalo.id, IMOVE.Terremoto.id]),
      ],
      reward: { money: 1100, exp: 550 },
    },
    { kind: RoomKind.Heal, name: 'Manantial', heal: 0.5 },
    {
      kind: RoomKind.Battle,
      name: 'Salida de la calle',
      foes: [
        foe(POKEMON.Rhydon, 58, [IMOVE.Avalancha.id, IMOVE.Cornada.id], {
          hpMult: 4,
          passives: [{ type: PokeType.Rock, level: 2 }],
          boss: { areaEvery: 5, phase: { belowHp: 0.3, moveIds: [IMOVE.Terremoto.id, IMOVE.Megacuerno.id] } },
        }),
        foe(POKEMON.Aerodactyl, 58, [IMOVE.Avalancha.id, IMOVE.Triturar.id, IMOVE.AtaqueAla.id], {
          hpMult: 3,
          boss: { enrage: { fromTurn: 15, every: 6, atk: 1 }, areaEvery: 4 },
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
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Geodude, amount: 3, chance: 0.5 },
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Aerodactyl, amount: 3, chance: 0.03 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.Stardust, amount: 1, chance: 0.4 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.StarPiece, amount: 1, chance: 0.08 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.CometShard, amount: 1, chance: 0.02 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.JoyaDeLuz, amount: 1, chance: 0.08 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.FuerzaTelurica, amount: 1, chance: 0.06 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.PunoMeteoro, amount: 1, chance: 0.05 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.GanchoAlto, amount: 1, chance: 0.04 },
  ],
  bots: [POKEMON.Blastoise, POKEMON.Venusaur, POKEMON.Machamp, POKEMON.Starmie, POKEMON.Exeggutor, POKEMON.Vaporeon, POKEMON.Poliwrath, POKEMON.Dugtrio],
}
