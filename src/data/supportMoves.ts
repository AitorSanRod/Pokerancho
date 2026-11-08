import { StatusId } from './passives'
import type { PokeType } from './types'

// Ataques de apoyo de las incursiones: uno por tipo, el que marca su papel en el grupo, y lo aprende cualquier Pokémon de
// ese tipo desde su nivel. Para editar a mano. Los de daño son los de siempre (data/moves.ts); estos curan, protegen,
// suben o bajan stats o ponen estados. Solo roca y acero provocan (acero aguanta más) y planta y agua curan mejor que
// nadie (planta a uno; agua es la única que cura a todo el grupo).

/** Qué hace un movimiento en una incursión */
export const MoveKind = {
  Damage: 'damage',
  /** Cura al aliado con menos PS (o a todos, con `area`) */
  Heal: 'heal',
  /** Atrae los golpes de los rivales y recibe menos daño mientras dura */
  Taunt: 'taunt',
  /** Sube stats a todo el grupo */
  Boost: 'boost',
  /** Baja stats al rival con más PS (o a todos, con `area`) */
  Debuff: 'debuff',
  /** Pone un estado alterado a un rival que no tenga (o a todos, con `area`) */
  Inflict: 'inflict',
} as const
export type MoveKind = (typeof MoveKind)[keyof typeof MoveKind]

export type BoostStat = 'atk' | 'def' | 'spe'

/** Cambio de una stat mientras dura: 0.25 = +25%, -0.25 = −25% */
export interface StatChange {
  stat: BoostStat
  amount: number
}

interface SupportBase {
  id: string
  name: string
  type: PokeType
  accuracy: number
  /** Nivel desde el que lo aprende un Pokémon de su tipo */
  level: number
}

export type SupportMove =
  | (SupportBase & { kind: typeof MoveKind.Heal; /** Fracción de los PS máximos del curado */ heal: number; area?: boolean })
  | (SupportBase & { kind: typeof MoveKind.Taunt; turns: number; /** Fracción del daño que se evita mientras provoca */ guard: number })
  | (SupportBase & { kind: typeof MoveKind.Boost; changes: StatChange[]; turns: number })
  | (SupportBase & { kind: typeof MoveKind.Debuff; changes: StatChange[]; turns: number; area?: boolean })
  | (SupportBase & { kind: typeof MoveKind.Inflict; status: StatusId; area?: boolean })

const heal = (id: string, name: string, type: PokeType, level: number, amount: number, area = false): SupportMove => ({
  kind: MoveKind.Heal, id, name, type, level, accuracy: 100, heal: amount, area,
})
const taunt = (id: string, name: string, type: PokeType, level: number, guard: number, turns = 3): SupportMove => ({
  kind: MoveKind.Taunt, id, name, type, level, accuracy: 100, guard, turns,
})
const boost = (id: string, name: string, type: PokeType, level: number, changes: StatChange[], turns = 3): SupportMove => ({
  kind: MoveKind.Boost, id, name, type, level, accuracy: 100, changes, turns,
})
const debuff = (id: string, name: string, type: PokeType, level: number, changes: StatChange[], area = false, turns = 3): SupportMove => ({
  kind: MoveKind.Debuff, id, name, type, level, accuracy: 100, changes, turns, area,
})
const inflict = (id: string, name: string, type: PokeType, level: number, status: StatusId, accuracy: number, area = false): SupportMove => ({
  kind: MoveKind.Inflict, id, name, type, level, accuracy, status, area,
})

export const SUPPORT_MOVES: Record<PokeType, SupportMove> = {
  normal: heal('soft-boiled', 'Amortiguador', 'normal', 15, 0.3),
  fire: inflict('will-o-wisp', 'Fuego Fatuo', 'fire', 15, StatusId.Burn, 85),
  water: heal('aqua-ring', 'Acua Aro', 'water', 20, 0.12, true),
  grass: heal('synthesis', 'Síntesis', 'grass', 15, 0.5),
  electric: inflict('thunder-wave', 'Onda Trueno', 'electric', 10, StatusId.Paralysis, 90),
  ice: boost('aurora-veil', 'Velo Aurora', 'ice', 25, [{ stat: 'def', amount: 0.3 }], 4),
  fighting: boost('bulk-up', 'Corpulencia', 'fighting', 20, [{ stat: 'atk', amount: 0.15 }, { stat: 'def', amount: 0.15 }]),
  poison: inflict('toxic', 'Tóxico', 'poison', 15, StatusId.Poison, 90),
  ground: debuff('sand-attack', 'Ataque Arena', 'ground', 10, [{ stat: 'atk', amount: -0.2 }], true),
  flying: boost('tailwind', 'Viento Afín', 'flying', 25, [{ stat: 'spe', amount: 0.4 }]),
  psychic: heal('heal-pulse', 'Pulso Cura', 'psychic', 20, 0.3),
  bug: boost('quiver-dance', 'Danza Aleteo', 'bug', 25, [{ stat: 'atk', amount: 0.15 }, { stat: 'spe', amount: 0.15 }]),
  rock: taunt('wide-guard', 'Vasta Guardia', 'rock', 10, 0.4),
  ghost: inflict('confuse-ray', 'Rayo Confuso', 'ghost', 10, StatusId.Confusion, 100),
  dragon: boost('dragon-dance', 'Danza Dragón', 'dragon', 30, [{ stat: 'atk', amount: 0.15 }, { stat: 'spe', amount: 0.15 }]),
  dark: debuff('fake-tears', 'Llanto Falso', 'dark', 15, [{ stat: 'def', amount: -0.3 }]),
  steel: taunt('iron-defense', 'Defensa Férrea', 'steel', 10, 0.5),
  fairy: heal('moonlight', 'Luz Lunar', 'fairy', 20, 0.3),
}
