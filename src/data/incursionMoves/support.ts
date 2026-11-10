import { StatusId } from '../passives'
import { PokeType } from '../types'
import { area, healAlly, healTeam, inflict, lower, move, raise, raiseSelf, taunt, type IncursionMove } from './effects'

// Ataques de apoyo de las incursiones: de cura o de estado, uno por tipo, el que marca su papel en el grupo. Solo roca y
// acero provocan (acero aguanta más) y planta y agua curan mejor que nadie (planta a uno; agua es la única que cura a
// todo el grupo). Para editar a mano.

export const SUPPORT_MOVES = {
  Amortiguador: move('soft-boiled', 'Amortiguador', PokeType.Normal, 70, [healAlly(1)]),
  FuegoFatuo: move('will-o-wisp', 'Fuego Fatuo', PokeType.Fire, 0, [inflict(StatusId.Burn)], { accuracy: 85 }),
  AcuaAro: move('aqua-ring', 'Acua Aro', PokeType.Water, 30, [healTeam(1)]),
  Sintesis: move('synthesis', 'Síntesis', PokeType.Grass, 100, [healAlly(1)]),
  OndaTrueno: move('thunder-wave', 'Onda Trueno', PokeType.Electric, 0, [inflict(StatusId.Paralysis)], { accuracy: 90 }),
  VeloAurora: move('aurora-veil', 'Velo Aurora', PokeType.Ice, 0, [raise([{ stat: 'def', stages: 2 }])]),
  Corpulencia: move('bulk-up', 'Corpulencia', PokeType.Fighting, 0, [raiseSelf([{ stat: 'atk', stages: 1 }, { stat: 'def', stages: 1 }])]),
  Toxico: move('toxic', 'Tóxico', PokeType.Poison, 0, [inflict(StatusId.Poison)], { accuracy: 90 }),
  AtaqueArena: move('sand-attack', 'Ataque Arena', PokeType.Ground, 0, [lower([{ stat: 'atk', stages: -1 }]), area()]),
  VientoAfin: move('tailwind', 'Viento Afín', PokeType.Flying, 0, [raise([{ stat: 'spe', stages: 2 }])]),
  PulsoCura: move('heal-pulse', 'Pulso Cura', PokeType.Psychic, 70, [healAlly(1)]),
  DanzaAleteo: move('quiver-dance', 'Danza Aleteo', PokeType.Bug, 0, [raiseSelf([{ stat: 'atk', stages: 1 }, { stat: 'spe', stages: 1 }])]),
  VastaGuardia: move('wide-guard', 'Vasta Guardia', PokeType.Rock, 0, [taunt(0.4)]),
  RayoConfuso: move('confuse-ray', 'Rayo Confuso', PokeType.Ghost, 0, [inflict(StatusId.Confusion)]),
  DanzaDragon: move('dragon-dance', 'Danza Dragón', PokeType.Dragon, 0, [raiseSelf([{ stat: 'atk', stages: 1 }, { stat: 'spe', stages: 1 }])]),
  LlantoFalso: move('fake-tears', 'Llanto Falso', PokeType.Dark, 0, [lower([{ stat: 'def', stages: -2 }])]),
  DefensaFerrea: move('iron-defense', 'Defensa Férrea', PokeType.Steel, 0, [taunt(0.5)]),
  LuzLunar: move('moonlight', 'Luz Lunar', PokeType.Fairy, 70, [healAlly(1)]),
} satisfies Record<string, IncursionMove>

/** El ataque de apoyo de cada tipo y el nivel desde el que lo aprende un Pokémon de ese tipo */
export const SUPPORT_BY_TYPE: Record<PokeType, { move: IncursionMove; level: number }> = {
  normal: { move: SUPPORT_MOVES.Amortiguador, level: 15 },
  fire: { move: SUPPORT_MOVES.FuegoFatuo, level: 15 },
  water: { move: SUPPORT_MOVES.AcuaAro, level: 20 },
  grass: { move: SUPPORT_MOVES.Sintesis, level: 15 },
  electric: { move: SUPPORT_MOVES.OndaTrueno, level: 10 },
  ice: { move: SUPPORT_MOVES.VeloAurora, level: 25 },
  fighting: { move: SUPPORT_MOVES.Corpulencia, level: 20 },
  poison: { move: SUPPORT_MOVES.Toxico, level: 15 },
  ground: { move: SUPPORT_MOVES.AtaqueArena, level: 10 },
  flying: { move: SUPPORT_MOVES.VientoAfin, level: 25 },
  psychic: { move: SUPPORT_MOVES.PulsoCura, level: 20 },
  bug: { move: SUPPORT_MOVES.DanzaAleteo, level: 25 },
  rock: { move: SUPPORT_MOVES.VastaGuardia, level: 10 },
  ghost: { move: SUPPORT_MOVES.RayoConfuso, level: 10 },
  dragon: { move: SUPPORT_MOVES.DanzaDragon, level: 30 },
  dark: { move: SUPPORT_MOVES.LlantoFalso, level: 15 },
  steel: { move: SUPPORT_MOVES.DefensaFerrea, level: 10 },
  fairy: { move: SUPPORT_MOVES.LuzLunar, level: 20 },
}
