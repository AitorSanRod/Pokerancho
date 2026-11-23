import { Biome } from '../maps/mapCommon'
import { IMOVE } from '../incursionMoves'
import { POKEMON } from '../pokemon'
import { PokeType } from '../types'
import { foe, IncursionId, IncursionPrizeKind, IncursionTier, oneOf, RoomKind, weighted, type Incursion } from './types'
import { StarItem } from '../starItems'
import { Tm } from '../tms'

export const CENTRAL_ENERGIA: Incursion = {
  id: IncursionId.CentralEnergia,
  name: 'Central Energía',
  description: 'Una central abandonada llena de chispas. En el reactor, Electabuzz no deja que nadie se acerque.',
  biome: Biome.Lab,
  tier: IncursionTier.Easy,
  minLevel: 40,
  maxLevel: 50,
  rooms: [
    {
      kind: RoomKind.Battle,
      name: 'Sala de generadores',
      foes: [
        foe(POKEMON.Voltorb, 42, [IMOVE.Impactrueno.id, IMOVE.OndaTrueno.id]),
        foe(POKEMON.Magnemite, 42, [IMOVE.Impactrueno.id, IMOVE.DefensaFerrea.id]),
        oneOf(
          foe(POKEMON.Pikachu, 44, [IMOVE.Impactrueno.id, IMOVE.AtaqueRapido.id]),
          foe(POKEMON.Tynamo, 43, [IMOVE.Impactrueno.id, IMOVE.Electrotela.id]),
        ),
      ],
      reward: { money: 350, exp: 180 },
    },
    {
      kind: RoomKind.Battle,
      name: 'Cableado',
      foes: [
        foe(POKEMON.Electrode, 48, [IMOVE.Chispa.id, IMOVE.OndaTrueno.id]),
        foe(POKEMON.Magneton, 47, [IMOVE.Rayo.id, IMOVE.FocoResplandor.id]),
        weighted(
          [foe(POKEMON.Electabuzz, 46, [IMOVE.PunoTrueno.id, IMOVE.GolpeKarate.id]), 3],
          [foe(POKEMON.Eelektrik, 46, [IMOVE.Chispa.id, IMOVE.Mordisco.id]), 2],
        ),
      ],
      reward: { money: 450, exp: 220 },
    },
    { kind: RoomKind.Heal, name: 'Sala de control', heal: 0.3 },
    {
      kind: RoomKind.Battle,
      name: 'Transformador',
      foes: [
        foe(POKEMON.Raichu, 50, [IMOVE.Rayo.id, IMOVE.OndaTrueno.id], {
          hpMult: 2,
          passives: [{ type: PokeType.Electric, level: 1 }],
          boss: { areaEvery: 4 },
        }),
        foe(POKEMON.Magnemite, 46, [IMOVE.Impactrueno.id, IMOVE.DefensaFerrea.id]),
        foe(POKEMON.Magnemite, 46, [IMOVE.Chispa.id, IMOVE.OndaTrueno.id]),
      ],
      reward: { money: 600, exp: 300 },
    },
    { kind: RoomKind.Heal, name: 'Sala de control', heal: 0.5 },
    {
      kind: RoomKind.Battle,
      name: 'Núcleo',
      foes: [
        foe(POKEMON.Luxio, 51, [IMOVE.ColmilloRayo.id, IMOVE.Mordisco.id]),
        oneOf(
          foe(POKEMON.Jolteon, 52, [IMOVE.Rayo.id, IMOVE.AtaqueRapido.id]),
          foe(POKEMON.Rotom, 52, [IMOVE.Rayo.id, IMOVE.SombraVil.id]),
        ),
      ],
      reward: { money: 550, exp: 270 },
    },
    {
      kind: RoomKind.Battle,
      name: 'Reactor',
      foes: [
        foe(POKEMON.Electabuzz, 56, [IMOVE.PunoTrueno.id, IMOVE.GolpeKarate.id], {
          hpMult: 6,
          boss: { enrage: { fromTurn: 15, every: 6, atk: 1 }, areaEvery: 4, phase: { belowHp: 0.3, moveIds: [IMOVE.Trueno.id, IMOVE.OndaTrueno.id] } },
        }),
      ],
      reward: { money: 1100, exp: 550 },
    },
  ],
  prizes: [
    { kind: IncursionPrizeKind.Money, amount: 20000, chance: 1 },
    { kind: IncursionPrizeKind.Money, amount: 10000, chance: 0.1 },
    { kind: IncursionPrizeKind.Money, amount: 30000, chance: 0.01 },
    { kind: IncursionPrizeKind.Exp, amount: 5500, chance: 1 },
    { kind: IncursionPrizeKind.Exp, amount: 5000, chance: 0.1 },
    { kind: IncursionPrizeKind.Exp, amount: 10000, chance: 0.01 },
    { kind: IncursionPrizeKind.Tickets, amount: 20, chance: 1 },
    { kind: IncursionPrizeKind.Tickets, amount: 10, chance: 0.1 },
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Magnemite, amount: 3, chance: 0.5 },
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Rotom, amount: 3, chance: 0.05 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.Stardust, amount: 1, chance: 0.2 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.StarPiece, amount: 1, chance: 0.025 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.CometShard, amount: 1, chance: 0.005 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.Chispazo, amount: 1, chance: 0.08 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.PunoMeteoro, amount: 1, chance: 0.05 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.Reflejo, amount: 1, chance: 0.04 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.AstaDrenaje, amount: 1, chance: 0.03 },
  ],
  bots: [POKEMON.Raichu, POKEMON.Golduck, POKEMON.Machoke, POKEMON.Kadabra, POKEMON.Rapidash, POKEMON.Primeape, POKEMON.Clefable, POKEMON.Ivysaur],
}
