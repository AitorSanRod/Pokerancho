import { StatusId } from '../passives'
import type { PokeType } from '../types'
import { area, healAlly, healTeam, inflict, lower, move, raise, raiseSelf, taunt, type IncursionMove } from './effects'

// Ataques de apoyo de las incursiones: de cura o de estado, uno por tipo, el que marca su papel en el grupo. Solo roca y
// acero provocan (acero aguanta más) y planta y agua curan mejor que nadie (planta a uno; agua es la única que cura a
// todo el grupo). Para editar a mano.

export const SUPPORT_MOVES = {
  SoftBoiled: move('soft-boiled', 'Amortiguador', 'normal', 70, [healAlly(1)]),
  WillOWisp: move('will-o-wisp', 'Fuego Fatuo', 'fire', 0, [inflict(StatusId.Burn)], { accuracy: 85 }),
  AquaRing: move('aqua-ring', 'Acua Aro', 'water', 30, [healTeam(1)]),
  Synthesis: move('synthesis', 'Síntesis', 'grass', 115, [healAlly(1)]),
  ThunderWave: move('thunder-wave', 'Onda Trueno', 'electric', 0, [inflict(StatusId.Paralysis)], { accuracy: 90 }),
  AuroraVeil: move('aurora-veil', 'Velo Aurora', 'ice', 0, [raise([{ stat: 'def', stages: 2 }])]),
  BulkUp: move('bulk-up', 'Corpulencia', 'fighting', 0, [raiseSelf([{ stat: 'atk', stages: 1 }, { stat: 'def', stages: 1 }])]),
  Toxic: move('toxic', 'Tóxico', 'poison', 0, [inflict(StatusId.Poison)], { accuracy: 90 }),
  SandAttack: move('sand-attack', 'Ataque Arena', 'ground', 0, [lower([{ stat: 'atk', stages: -1 }]), area()]),
  Tailwind: move('tailwind', 'Viento Afín', 'flying', 0, [raise([{ stat: 'spe', stages: 2 }])]),
  HealPulse: move('heal-pulse', 'Pulso Cura', 'psychic', 70, [healAlly(1)]),
  QuiverDance: move('quiver-dance', 'Danza Aleteo', 'bug', 0, [raiseSelf([{ stat: 'atk', stages: 1 }, { stat: 'spe', stages: 1 }])]),
  WideGuard: move('wide-guard', 'Vasta Guardia', 'rock', 0, [taunt(0.4)]),
  ConfuseRay: move('confuse-ray', 'Rayo Confuso', 'ghost', 0, [inflict(StatusId.Confusion)]),
  DragonDance: move('dragon-dance', 'Danza Dragón', 'dragon', 0, [raiseSelf([{ stat: 'atk', stages: 1 }, { stat: 'spe', stages: 1 }])]),
  FakeTears: move('fake-tears', 'Llanto Falso', 'dark', 0, [lower([{ stat: 'def', stages: -2 }])]),
  IronDefense: move('iron-defense', 'Defensa Férrea', 'steel', 0, [taunt(0.5)]),
  Moonlight: move('moonlight', 'Luz Lunar', 'fairy', 70, [healAlly(1)]),
} satisfies Record<string, IncursionMove>

/** El ataque de apoyo de cada tipo y el nivel desde el que lo aprende un Pokémon de ese tipo */
export const SUPPORT_BY_TYPE: Record<PokeType, { move: IncursionMove; level: number }> = {
  normal: { move: SUPPORT_MOVES.SoftBoiled, level: 15 },
  fire: { move: SUPPORT_MOVES.WillOWisp, level: 15 },
  water: { move: SUPPORT_MOVES.AquaRing, level: 20 },
  grass: { move: SUPPORT_MOVES.Synthesis, level: 15 },
  electric: { move: SUPPORT_MOVES.ThunderWave, level: 10 },
  ice: { move: SUPPORT_MOVES.AuroraVeil, level: 25 },
  fighting: { move: SUPPORT_MOVES.BulkUp, level: 20 },
  poison: { move: SUPPORT_MOVES.Toxic, level: 15 },
  ground: { move: SUPPORT_MOVES.SandAttack, level: 10 },
  flying: { move: SUPPORT_MOVES.Tailwind, level: 25 },
  psychic: { move: SUPPORT_MOVES.HealPulse, level: 20 },
  bug: { move: SUPPORT_MOVES.QuiverDance, level: 25 },
  rock: { move: SUPPORT_MOVES.WideGuard, level: 10 },
  ghost: { move: SUPPORT_MOVES.ConfuseRay, level: 10 },
  dragon: { move: SUPPORT_MOVES.DragonDance, level: 30 },
  dark: { move: SUPPORT_MOVES.FakeTears, level: 15 },
  steel: { move: SUPPORT_MOVES.IronDefense, level: 10 },
  fairy: { move: SUPPORT_MOVES.Moonlight, level: 20 },
}
