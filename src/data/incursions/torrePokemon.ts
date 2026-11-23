import { Biome } from '../maps/mapCommon'
import { IMOVE } from '../incursionMoves'
import { POKEMON } from '../pokemon'
import { PokeType } from '../types'
import { foe, IncursionId, IncursionPrizeKind, IncursionTier, oneOf, RoomKind, weighted, type Incursion } from './types'
import { StarItem } from '../starItems'
import { Tm } from '../tms'

export const TORRE_POKEMON: Incursion = {
  id: IncursionId.TorrePokemon,
  name: 'Torre Pokémon',
  description: 'Plantas en penumbra llenas de fantasmas. En lo alto de la torre, Gengar se ríe de los que suben.',
  biome: Biome.MeadowDusk,
  tier: IncursionTier.Medium,
  minLevel: 45,
  maxLevel: 55,
  rooms: [
    {
      kind: RoomKind.Battle,
      name: 'Planta baja',
      foes: [
        foe(POKEMON.Gastly, 44, [IMOVE.Lenguetazo.id, IMOVE.RayoConfuso.id]),
        foe(POKEMON.Gastly, 44, [IMOVE.SombraVil.id, IMOVE.Hipnosis.id]),
        oneOf(
          foe(POKEMON.Golbat, 44, [IMOVE.Mordisco.id, IMOVE.RayoConfuso.id]),
          foe(POKEMON.Cubone, 45, [IMOVE.HuesoPalo.id, IMOVE.Cabezazo.id]),
        ),
      ],
      reward: { money: 500, exp: 250 },
    },
    {
      kind: RoomKind.Battle,
      name: 'Escaleras',
      foes: [
        foe(POKEMON.Haunter, 48, [IMOVE.BolaSombra.id, IMOVE.Hipnosis.id]),
        foe(POKEMON.Sableye, 47, [IMOVE.GolpeUmbrio.id, IMOVE.FuegoFatuo.id]),
        foe(POKEMON.Koffing, 47, [IMOVE.BombaLodo.id, IMOVE.Toxico.id]),
      ],
      reward: { money: 600, exp: 300 },
    },
    { kind: RoomKind.Heal, name: 'Altar', heal: 0.3 },
    {
      kind: RoomKind.Battle,
      name: 'Tumbas',
      foes: [
        foe(POKEMON.Marowak, 52, [IMOVE.HuesoPalo.id, IMOVE.Cabezazo.id], {
          hpMult: 2.5,
          passives: [{ type: PokeType.Ground, level: 1 }],
          boss: { areaEvery: 4, phase: { belowHp: 0.3, moveIds: [IMOVE.Terremoto.id] } },
        }),
        foe(POKEMON.Haunter, 49, [IMOVE.SombraVil.id, IMOVE.RayoConfuso.id]),
        weighted(
          [foe(POKEMON.Gastly, 48, [IMOVE.Lenguetazo.id, IMOVE.Hipnosis.id]), 4],
          [foe(POKEMON.Mimikyu, 50, [IMOVE.Carantona.id, IMOVE.GarraUmbria.id]), 1],
        ),
      ],
      reward: { money: 800, exp: 400 },
    },
    { kind: RoomKind.Revive, name: 'Capilla', hp: 0.5 },
    {
      kind: RoomKind.Battle,
      name: 'Planta alta',
      foes: [
        foe(POKEMON.Mimikyu, 52, [IMOVE.Carantona.id, IMOVE.SombraVil.id]),
        foe(POKEMON.Weezing, 52, [IMOVE.BombaLodo.id, IMOVE.FuegoFatuo.id]),
        foe(POKEMON.Umbreon, 52, [IMOVE.PulsoNoche.id, IMOVE.LuzLunar.id]),
      ],
      reward: { money: 700, exp: 350 },
    },
    { kind: RoomKind.Heal, name: 'Altar', heal: 0.5 },
    {
      kind: RoomKind.Battle,
      name: 'Cima de la torre',
      foes: [
        foe(POKEMON.Gengar, 59, [IMOVE.BolaSombra.id, IMOVE.Hipnosis.id, IMOVE.BombaLodo.id], {
          hpMult: 5,
          passives: [{ type: PokeType.Ghost, level: 1 }],
          boss: { enrage: { fromTurn: 15, every: 6, atk: 1 }, areaEvery: 4, phase: { belowHp: 0.3, moveIds: [IMOVE.GolpeFantasma.id, IMOVE.OndaToxica.id] } },
        }),
      ],
      reward: { money: 1400, exp: 700 },
    },
  ],
  prizes: [
    { kind: IncursionPrizeKind.Money, amount: 35000, chance: 1 },
    { kind: IncursionPrizeKind.Money, amount: 20000, chance: 0.1 },
    { kind: IncursionPrizeKind.Money, amount: 60000, chance: 0.01 },
    { kind: IncursionPrizeKind.Exp, amount: 9000, chance: 1 },
    { kind: IncursionPrizeKind.Exp, amount: 9000, chance: 0.1 },
    { kind: IncursionPrizeKind.Exp, amount: 18000, chance: 0.01 },
    { kind: IncursionPrizeKind.Tickets, amount: 30, chance: 1 },
    { kind: IncursionPrizeKind.Tickets, amount: 15, chance: 0.1 },
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Gastly, amount: 3, chance: 0.5 },
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Mimikyu, amount: 3, chance: 0.05 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.Stardust, amount: 1, chance: 0.3 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.StarPiece, amount: 1, chance: 0.05 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.CometShard, amount: 1, chance: 0.01 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.VientoAciago, amount: 1, chance: 0.15 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.PulsoUmbrio, amount: 1, chance: 0.1 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.PuyaNociva, amount: 1, chance: 0.1 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.CuraFloral, amount: 1, chance: 0.1 },
  ],
  bots: [POKEMON.Alakazam, POKEMON.Arcanine, POKEMON.Umbreon, POKEMON.Houndoom, POKEMON.Clefable, POKEMON.Machamp, POKEMON.Golduck, POKEMON.Snorlax],
}
