import { Biome } from '../maps/mapCommon'
import { IMOVE } from '../incursionMoves'
import { POKEMON } from '../pokemon'
import { PokeType } from '../types'
import { foe, IncursionId, IncursionPrizeKind, IncursionTier, oneOf, RoomKind, type Incursion } from './types'
import { StarItem } from '../starItems'
import { Tm } from '../tms'

export const DOJO_KARATE: Incursion = {
  id: IncursionId.DojoKarate,
  name: 'Dojo Karate',
  description: 'Discípulos que entrenan sin descanso. Al fondo, el maestro Machamp con Hitmonlee y Hitmonchan.',
  biome: Biome.VermilionCity,
  tier: IncursionTier.Medium,
  minLevel: 30,
  maxLevel: 55,
  rooms: [
    {
      kind: RoomKind.Battle,
      name: 'Patio',
      foes: [
        foe(POKEMON.Mankey, 32, [IMOVE.GolpeKarate.id, IMOVE.Malicioso.id]),
        foe(POKEMON.Machop, 32, [IMOVE.GolpeKarate.id, IMOVE.Corpulencia.id]),
        oneOf(
          foe(POKEMON.Pancham, 33, [IMOVE.GolpeKarate.id, IMOVE.Mordisco.id]),
          foe(POKEMON.Primeape, 33, [IMOVE.TajoCruzado.id, IMOVE.Alboroto.id]),
        ),
      ],
      reward: { money: 500, exp: 250 },
    },
    {
      kind: RoomKind.Battle,
      name: 'Tatami',
      foes: [
        foe(POKEMON.Machoke, 37, [IMOVE.TajoCruzado.id, IMOVE.Corpulencia.id]),
        foe(POKEMON.Primeape, 36, [IMOVE.PatadaGiro.id, IMOVE.Malicioso.id]),
        foe(POKEMON.Poliwrath, 36, [IMOVE.EsferaAural.id, IMOVE.Hidropulso.id]),
      ],
      reward: { money: 600, exp: 300 },
    },
    { kind: RoomKind.Heal, name: 'Vestuario', heal: 0.3 },
    {
      kind: RoomKind.Battle,
      name: 'Sala de los discípulos',
      foes: [
        foe(POKEMON.Breloom, 39, [IMOVE.PunoDrenaje.id, IMOVE.Gigadrenado.id]),
        foe(POKEMON.Pangoro, 40, [IMOVE.Triturar.id, IMOVE.TajoCruzado.id], { hpMult: 1.5 }),
        foe(POKEMON.Gallade, 39, [IMOVE.Psicocorte.id, IMOVE.EsferaAural.id]),
      ],
      reward: { money: 800, exp: 400 },
    },
    { kind: RoomKind.Revive, name: 'Sala de meditación', hp: 0.5 },
    { kind: RoomKind.Heal, name: 'Fuente del jardín', heal: 0.4 },
    {
      kind: RoomKind.Battle,
      name: 'Maestro del dojo',
      foes: [
        foe(POKEMON.Machamp, 45, [IMOVE.TajoCruzado.id, IMOVE.Corpulencia.id], {
          hpMult: 4,
          passives: [{ type: PokeType.Fighting, level: 1 }],
          boss: { enrage: { fromTurn: 15, every: 6, atk: 1 }, areaEvery: 4, phase: { belowHp: 0.3, moveIds: [IMOVE.Punodinamico.id, IMOVE.ABocajarro.id] } },
        }),
        foe(POKEMON.Hitmonlee, 42, [IMOVE.PatadaSaltoAlta.id, IMOVE.Megapatada.id], { hpMult: 1.5 }),
        foe(POKEMON.Hitmonchan, 42, [IMOVE.Ultrapuno.id, IMOVE.PunoBala.id], { hpMult: 1.5 }),
      ],
      reward: { money: 1500, exp: 750 },
    },
  ],
  prizes: [
    { kind: IncursionPrizeKind.Money, amount: 30000, chance: 1 },
    { kind: IncursionPrizeKind.Money, amount: 20000, chance: 0.1 },
    { kind: IncursionPrizeKind.Money, amount: 60000, chance: 0.01 },
    { kind: IncursionPrizeKind.Exp, amount: 9000, chance: 1 },
    { kind: IncursionPrizeKind.Exp, amount: 9000, chance: 0.1 },
    { kind: IncursionPrizeKind.Exp, amount: 18000, chance: 0.01 },
    { kind: IncursionPrizeKind.Tickets, amount: 30, chance: 1 },
    { kind: IncursionPrizeKind.Tickets, amount: 15, chance: 0.1 },
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Machop, amount: 3, chance: 0.5 },
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Hitmonlee, amount: 3, chance: 0.03 },
    { kind: IncursionPrizeKind.Pieces, speciesId: POKEMON.Hitmonchan, amount: 3, chance: 0.03 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.Stardust, amount: 1, chance: 0.3 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.StarPiece, amount: 1, chance: 0.05 },
    { kind: IncursionPrizeKind.StarItem, item: StarItem.CometShard, amount: 1, chance: 0.01 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.GanchoAlto, amount: 1, chance: 0.08 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.Reflejo, amount: 1, chance: 0.05 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.PulsoUmbrio, amount: 1, chance: 0.04 },
    { kind: IncursionPrizeKind.Tm, tm: Tm.Respiro, amount: 1, chance: 0.03 },
  ],
  bots: [POKEMON.Alakazam, POKEMON.Pidgeot, POKEMON.Gengar, POKEMON.Clefable, POKEMON.Fearow, POKEMON.Hypno, POKEMON.Togetic, POKEMON.Kadabra],
}
