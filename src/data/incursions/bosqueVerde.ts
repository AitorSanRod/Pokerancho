import { Biome } from '../maps/mapCommon'
import { IMOVE } from '../incursionMoves'
import { POKEMON } from '../pokemon'
import { PokeType } from '../types'
import { foe, IncursionId, IncursionPrizeKind, IncursionTier, oneOf, RoomKind, type Incursion } from './types'
import { StarItem } from '../starItems'
import { Tm } from '../tms'

export const BOSQUE_VERDE: Incursion = {
  id: IncursionId.BosqueVerde,
  name: 'Bosque Verde',
  description: 'Pokémon de tipo bicho entre los árboles y, en lo más profundo del bosque, Nidoking y Nidoqueen.',
  biome: Biome.Forest,
  tier: IncursionTier.VeryEasy,
  minLevel: 15,
  maxLevel: 30,
  rooms: [
    {
      kind: RoomKind.Battle,
      name: 'Entrada del bosque',
      foes: [
        foe(POKEMON.Weedle, 15, [IMOVE.CorteFuria.id, IMOVE.Acido.id]),
        foe(POKEMON.Caterpie, 15, [IMOVE.Acido.id, IMOVE.Placaje.id]),
        oneOf(
          foe(POKEMON.Butterfree, 18, [IMOVE.VientoPlata.id, IMOVE.Paralizador.id]),
          foe(POKEMON.Beedrill, 18, [IMOVE.TijeraX.id, IMOVE.VenenoX.id]),
        ),
      ],
      reward: { money: 300, exp: 150 },
    },
    { kind: RoomKind.Heal, name: 'Claro', heal: 0.3 },
    {
      kind: RoomKind.Battle,
      name: 'Nido de Nidoran',
      foes: [
        foe(POKEMON.Nidorino, 22, [IMOVE.ColmilloVeneno.id, IMOVE.CorteFuria.id], {
          hpMult: 2,
          passives: [{ type: PokeType.Poison, level: 1 }],
          boss: { areaEvery: 5, phase: { belowHp: 0.3, moveIds: [IMOVE.Terremoto.id] } },
        }),
        foe(POKEMON.Nidorina, 21, [IMOVE.VenenoX.id, IMOVE.Toxico.id], { hpMult: 1.5 }),
      ],
      reward: { money: 500, exp: 250 },
    },
    {
      kind: RoomKind.Battle,
      name: 'Interior del bosque',
      foes: [
        foe(POKEMON.Shroomish, 24, [IMOVE.BombaAcida.id, IMOVE.Follaje.id], { hpMult: 1.2 }),
        foe(POKEMON.Parasect, 26, [IMOVE.PolvoVeneno.id, IMOVE.IdaYVuelta.id], { hpMult: 1.5 }),
        oneOf(
          foe(POKEMON.Butterfree, 25, [IMOVE.VientoPlata.id, IMOVE.Paralizador.id], { passives: [{ type: PokeType.Bug, level: 1 }] }),
          foe(POKEMON.Beedrill, 25, [IMOVE.TijeraX.id, IMOVE.VenenoX.id], { passives: [{ type: PokeType.Bug, level: 1 }] }),
        ),
      ],
      reward: { money: 600, exp: 300 },
    },
    { kind: RoomKind.Heal, name: 'Claro', heal: 0.5 },
    {
      kind: RoomKind.Battle,
      name: 'Corazón del bosque',
      foes: [
        foe(POKEMON.Nidoking, 30, [IMOVE.FuerzaEquina.id, IMOVE.Toxico.id], {
          hpMult: 2.5,
          passives: [{ type: PokeType.Fighting, level: 1 }],
          boss: { enrage: { fromTurn: 15, every: 6, atk: 1 }, areaEvery: 4, phase: { belowHp: 0.3, moveIds: [IMOVE.Terremoto.id] } },
        }),
        foe(POKEMON.Nidoqueen, 29, [IMOVE.Taladradora.id, IMOVE.Paralizador.id], {
          hpMult: 2.5,
          passives: [{ type: PokeType.Ground, level: 1 }],
          boss: { areaEvery: 5, phase: { belowHp: 0.3, moveIds: [IMOVE.Terremoto.id] } },
        }),
      ],
      reward: { money: 1000, exp: 450 },
    },
  ],
  prizes: [
    { kind: IncursionPrizeKind.Money, amount: 7000, chance: 1 },
    { kind: IncursionPrizeKind.Money, amount: 5000, chance: 0.1 },
    { kind: IncursionPrizeKind.Money, amount: 20000, chance: 0.01 },
    { kind: IncursionPrizeKind.Exp, amount: 3000, chance: 1 },
    { kind: IncursionPrizeKind.Exp, amount: 3000, chance: 0.1 },
    { kind: IncursionPrizeKind.Exp, amount: 6000, chance: 0.01 },
    { kind: IncursionPrizeKind.Tickets, amount: 10, chance: 1 },
    { kind: IncursionPrizeKind.Tickets, amount: 5, chance: 0.1 },
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Caterpie, amount: 3, chance: 0.5 },
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Pikachu, amount: 3, chance: 0.05 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.Stardust, amount: 1, chance: 0.15 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.StarPiece, amount: 1, chance: 0.015 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.Senuelo, amount: 1, chance: 0.03 },
  ],
  bots: [POKEMON.Bulbasaur, POKEMON.Pikachu, POKEMON.Charmander, POKEMON.Squirtle, POKEMON.Ralts],
}
