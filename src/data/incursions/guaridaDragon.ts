import { Biome } from '../maps/mapCommon'
import { IMOVE } from '../incursionMoves'
import { POKEMON } from '../pokemon'
import { PokeType } from '../types'
import { foe, IncursionId, IncursionPrizeKind, IncursionTier, oneOf, RoomKind, type Incursion } from './types'
import { StarItem } from '../starItems'
import { Tm } from '../tms'

export const GUARIDA_DRAGON: Incursion = {
  id: IncursionId.GuaridaDragon,
  name: 'Guarida Dragón',
  description: 'Remolinos y grutas donde crecen los dragones. Al fondo de la guarida duerme Dragonite.',
  biome: Biome.Sea,
  tier: IncursionTier.Hard,
  minLevel: 60,
  maxLevel: 75,
  rooms: [
    {
      kind: RoomKind.Battle,
      name: 'Orilla',
      foes: [
        foe(POKEMON.Dratini, 66, [IMOVE.Dragoaliento.id, IMOVE.Atadura.id]),
        foe(POKEMON.Seadra, 67, [IMOVE.Hidropulso.id, IMOVE.Ciclon.id]),
        oneOf(
          foe(POKEMON.Dragonair, 68, [IMOVE.ColaDragon.id, IMOVE.OndaTrueno.id]),
          foe(POKEMON.Vibrava, 68, [IMOVE.Dragoaliento.id, IMOVE.Terratemblor.id]),
        ),
      ],
      reward: { money: 900, exp: 450 },
    },
    {
      kind: RoomKind.Battle,
      name: 'Remolinos',
      foes: [
        foe(POKEMON.Gyarados, 70, [IMOVE.Cascada.id, IMOVE.DanzaDragon.id]),
        foe(POKEMON.Dragonair, 69, [IMOVE.ColaDragon.id, IMOVE.OndaTrueno.id]),
        foe(POKEMON.Lapras, 69, [IMOVE.Surf.id, IMOVE.RayoHielo.id]),
      ],
      reward: { money: 1000, exp: 500 },
    },
    { kind: RoomKind.Heal, name: 'Arrecife', heal: 0.3 },
    {
      kind: RoomKind.Battle,
      name: 'Nido',
      foes: [
        foe(POKEMON.Altaria, 71, [IMOVE.PulsoDragon.id, IMOVE.Respiro.id]),
        foe(POKEMON.Noivern, 71, [IMOVE.PulsoDragon.id, IMOVE.TajoAereo.id]),
        foe(POKEMON.Shelgon, 70, [IMOVE.Cabezazo.id, IMOVE.DefensaFerrea.id], { hpMult: 1.5 }),
      ],
      reward: { money: 1300, exp: 650 },
    },
    { kind: RoomKind.Revive, name: 'Gruta', hp: 0.5 },
    {
      kind: RoomKind.Battle,
      name: 'Santuario',
      foes: [
        foe(POKEMON.Flygon, 74, [IMOVE.Terremoto.id, IMOVE.GarraDragon.id], {
          hpMult: 2,
          passives: [{ type: PokeType.Dragon, level: 1 }],
          boss: { areaEvery: 4 },
        }),
        foe(POKEMON.Milotic, 72, [IMOVE.Surf.id, IMOVE.AcuaAro.id]),
        foe(POKEMON.Salamence, 73, [IMOVE.GarraDragon.id, IMOVE.Triturar.id]),
      ],
      reward: { money: 1300, exp: 650 },
    },
    { kind: RoomKind.Heal, name: 'Templo sumergido', heal: 0.5 },
    {
      kind: RoomKind.Battle,
      name: 'Guarida',
      foes: [
        foe(POKEMON.Dragonite, 76, [IMOVE.GarraDragon.id, IMOVE.AtaqueAla.id, IMOVE.DanzaDragon.id], {
          hpMult: 5,
          passives: [{ type: PokeType.Dragon, level: 2 }],
          boss: { enrage: { fromTurn: 15, every: 5, atk: 1 }, areaEvery: 3, phase: { belowHp: 0.3, moveIds: [IMOVE.CometaDraco.id, IMOVE.VelocidadExtrema.id] } },
        }),
      ],
      reward: { money: 2200, exp: 1100 },
    },
  ],
  prizes: [
    { kind: IncursionPrizeKind.Money, amount: 60000, chance: 1 },
    { kind: IncursionPrizeKind.Money, amount: 30000, chance: 0.1 },
    { kind: IncursionPrizeKind.Money, amount: 100000, chance: 0.01 },
    { kind: IncursionPrizeKind.Exp, amount: 16000, chance: 1 },
    { kind: IncursionPrizeKind.Exp, amount: 15000, chance: 0.1 },
    { kind: IncursionPrizeKind.Exp, amount: 30000, chance: 0.01 },
    { kind: IncursionPrizeKind.Tickets, amount: 40, chance: 1 },
    { kind: IncursionPrizeKind.Tickets, amount: 20, chance: 0.1 },
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Dratini, amount: 3, chance: 0.5 },
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Bagon, amount: 3, chance: 0.05 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.Stardust, amount: 1, chance: 0.4 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.StarPiece, amount: 1, chance: 0.08 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.CometShard, amount: 1, chance: 0.02 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.MartilloDragon, amount: 1, chance: 0.08 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.Escaldar, amount: 1, chance: 0.05 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.CuraFloral, amount: 1, chance: 0.05 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.Liofilizacion, amount: 1, chance: 0.04 },
  ],
  bots: [POKEMON.Lapras, POKEMON.Cloyster, POKEMON.Clefable, POKEMON.Jynx, POKEMON.Dewgong, POKEMON.Togekiss, POKEMON.Gardevoir, POKEMON.Sylveon],
}
