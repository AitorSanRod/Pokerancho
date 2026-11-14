// Código y avisos de un equipo (gimnasios y entrenadores): una línea por Pokémon, como en los ficheros de datos.

import { IMOVE, moveClass, MoveClass } from '../../../src/data/incursionMoves'
import { MAX_LEVEL } from '../../../src/game/team/stats'
import { SPECIES_KEYS } from '../catalog'
import type { FoeDraft } from './teamDraft'

/** Texto entre comillas simples, escapado */
export const str = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

/** Un Pokémon en una línea: `{ speciesId: POKEMON.Staryu, level: 41, passives: [...], statMult: 1.2, moves: [...] }` */
export function foeCode(f: FoeDraft): string {
  const fields = [`speciesId: POKEMON.${f.species || '¿?'}`, `level: ${f.level}`]
  if (f.passives.length) fields.push(`passives: [${f.passives.map((p) => `{ type: '${p.type}', level: ${p.level} }`).join(', ')}]`)
  if (f.statMult !== null && f.statMult !== 1) fields.push(`statMult: ${f.statMult}`)
  const moves = f.moves.filter(Boolean)
  if (moves.length) fields.push(`moves: [${moves.map((m) => `IMOVE.${m}.id`).join(', ')}]`)
  return `{ ${fields.join(', ')} }`
}

/** El equipo dentro de su entrada (sangrado de 4 espacios, como en gyms.ts y trainers.ts) */
export const teamCode = (team: FoeDraft[]): string[] => ['    team: [', ...team.map((f) => `      ${foeCode(f)},`), '    ],']

/** ¿Es un ataque de incursión de daño? (los demás no valen en un combate de ruta) */
export const isDamageMove = (key: string) => key in IMOVE && moveClass(IMOVE[key as keyof typeof IMOVE]) === MoveClass.Damage

function foeIssues(f: FoeDraft, n: number): string[] {
  const out: string[] = []
  if (!SPECIES_KEYS.includes(f.species)) out.push(`Pokémon ${n}: «${f.species}» no es un Pokémon`)
  if (!(f.level >= 1 && f.level <= MAX_LEVEL)) out.push(`Pokémon ${n}: el nivel va de 1 a ${MAX_LEVEL}`)
  if (f.statMult !== null && !(f.statMult > 0)) out.push(`Pokémon ${n}: el multiplicador de stats tiene que ser mayor que 0`)
  if (new Set(f.passives.map((p) => p.type)).size !== f.passives.length) out.push(`Pokémon ${n}: tiene dos pasivas del mismo tipo`)
  for (const m of f.moves.filter(Boolean)) if (!isDamageMove(m)) out.push(`Pokémon ${n}: «${m}» no es un ataque de daño`)
  return out
}

/** Avisos del equipo; `who` es quien lo saca («El líder», «El entrenador») */
export function teamIssues(team: FoeDraft[], who: string): string[] {
  if (team.length === 0) return [`${who} necesita al menos un Pokémon`]
  return team.flatMap((f, i) => foeIssues(f, i + 1))
}

/** «2 Pokémon · Nv. 52–54» */
export function teamSummary(team: FoeDraft[]): string {
  const levels = team.map((f) => f.level)
  const range = levels.length ? ` · Nv. ${Math.min(...levels)}–${Math.max(...levels)}` : ''
  return `${team.length} Pokémon${range}`
}
