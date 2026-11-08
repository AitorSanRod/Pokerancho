import { StatusId } from './passives'
import type { PokeType } from './types'

// Ataques de apoyo de las incursiones, por tipo: los aprende cualquier Pokémon de ese tipo desde su nivel. Este fichero
// es para editarlo a mano. Los de daño son los de siempre (data/moves.ts); estos curan, protegen, suben o bajan stats
// o ponen estados.

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

export const SUPPORT_MOVES: Record<PokeType, SupportMove[]> = {
  normal: [
    taunt('defense-curl', 'Rizo Defensa', 'normal', 1, 0.25),
    debuff('growl', 'Gruñido', 'normal', 5, [{ stat: 'atk', amount: -0.2 }], true),
    heal('soft-boiled', 'Amortiguador', 'normal', 20, 0.4),
  ],
  fire: [
    inflict('will-o-wisp', 'Fuego Fatuo', 'fire', 15, StatusId.Burn, 85),
    boost('sunny-day', 'Día Soleado', 'fire', 25, [{ stat: 'atk', amount: 0.2 }], 4),
  ],
  water: [
    boost('withdraw', 'Refugio', 'water', 5, [{ stat: 'def', amount: 0.2 }]),
    heal('aqua-ring', 'Acua Aro', 'water', 25, 0.15, true),
  ],
  grass: [
    inflict('stun-spore', 'Paralizador', 'grass', 10, StatusId.Paralysis, 75),
    heal('synthesis', 'Síntesis', 'grass', 20, 0.4),
  ],
  electric: [
    inflict('thunder-wave', 'Onda Trueno', 'electric', 10, StatusId.Paralysis, 90),
    boost('electric-terrain', 'Campo Eléctrico', 'electric', 30, [{ stat: 'spe', amount: 0.3 }], 4),
  ],
  ice: [
    boost('mist', 'Neblina', 'ice', 15, [{ stat: 'def', amount: 0.2 }], 4),
    boost('aurora-veil', 'Velo Aurora', 'ice', 40, [{ stat: 'def', amount: 0.35 }], 4),
  ],
  fighting: [
    taunt('detect', 'Detección', 'fighting', 15, 0.3, 2),
    boost('bulk-up', 'Corpulencia', 'fighting', 25, [{ stat: 'atk', amount: 0.15 }, { stat: 'def', amount: 0.15 }]),
  ],
  poison: [
    inflict('toxic', 'Tóxico', 'poison', 15, StatusId.Poison, 90),
    inflict('poison-gas', 'Gas Venenoso', 'poison', 30, StatusId.Poison, 70, true),
  ],
  ground: [
    debuff('sand-attack', 'Ataque Arena', 'ground', 10, [{ stat: 'atk', amount: -0.2 }], true),
    taunt('dig-in', 'Atrincherarse', 'ground', 25, 0.35),
  ],
  flying: [
    heal('roost', 'Respiro', 'flying', 20, 0.4),
    boost('tailwind', 'Viento Afín', 'flying', 30, [{ stat: 'spe', amount: 0.4 }]),
  ],
  psychic: [
    boost('light-screen', 'Pantalla Luz', 'psychic', 15, [{ stat: 'def', amount: 0.25 }], 4),
    heal('heal-pulse', 'Pulso Cura', 'psychic', 25, 0.45),
  ],
  bug: [
    debuff('string-shot', 'Disparo Demora', 'bug', 1, [{ stat: 'spe', amount: -0.3 }], true),
    boost('quiver-dance', 'Danza Aleteo', 'bug', 30, [{ stat: 'atk', amount: 0.15 }, { stat: 'spe', amount: 0.15 }]),
  ],
  rock: [
    boost('rock-polish', 'Pulimento', 'rock', 20, [{ stat: 'spe', amount: 0.3 }]),
    debuff('stealth-rock', 'Trampa Rocas', 'rock', 25, [{ stat: 'def', amount: -0.2 }], true),
  ],
  ghost: [
    inflict('confuse-ray', 'Rayo Confuso', 'ghost', 10, StatusId.Confusion, 100),
    debuff('spite', 'Rencor', 'ghost', 25, [{ stat: 'atk', amount: -0.3 }]),
  ],
  dragon: [boost('dragon-dance', 'Danza Dragón', 'dragon', 30, [{ stat: 'atk', amount: 0.15 }, { stat: 'spe', amount: 0.15 }])],
  dark: [
    taunt('taunt', 'Provocación', 'dark', 10, 0.2),
    debuff('fake-tears', 'Llanto Falso', 'dark', 20, [{ stat: 'def', amount: -0.3 }]),
  ],
  steel: [
    taunt('iron-defense', 'Defensa Férrea', 'steel', 20, 0.4),
    debuff('metal-sound', 'Eco Metálico', 'steel', 30, [{ stat: 'def', amount: -0.35 }]),
  ],
  fairy: [
    inflict('sweet-kiss', 'Beso Dulce', 'fairy', 10, StatusId.Confusion, 75),
    heal('moonlight', 'Luz Lunar', 'fairy', 20, 0.4),
  ],
}
