// Avisos del gimnasio: lo que haría que no compilase o que el juego lo rechazase. Con avisos no se guarda en el juego.

import { MAX_LEVEL } from '../../../src/game/team/stats'
import { SPECIES_KEYS } from '../catalog'
import { badgeOwner, isDamageMove } from './gymCatalog'
import { badgeName, BADGES_BY_KEY, type GymDraft, type GymFoeDraft } from './gymDraft'

const ID_KEY = /^[A-Z][A-Za-z0-9]*$/
const ID_VALUE = /^[a-z0-9]+(-[a-z0-9]+)*$/

function foeIssues(f: GymFoeDraft, n: number): string[] {
  const out: string[] = []
  if (!SPECIES_KEYS.includes(f.species)) out.push(`Pokémon ${n}: «${f.species}» no es un Pokémon`)
  if (!(f.level >= 1 && f.level <= MAX_LEVEL)) out.push(`Pokémon ${n}: el nivel va de 1 a ${MAX_LEVEL}`)
  if (f.statMult !== null && !(f.statMult > 0)) out.push(`Pokémon ${n}: el multiplicador de stats tiene que ser mayor que 0`)
  for (const m of f.moves.filter(Boolean)) if (!isDamageMove(m)) out.push(`Pokémon ${n}: «${m}» no es un ataque de daño`)
  return out
}

export function gymIssues(d: GymDraft): string[] {
  const out: string[] = []
  if (!ID_KEY.test(d.idKey)) out.push('El id (clave de GymId) empieza por mayúscula y solo lleva letras y cifras: «Carmin»')
  if (d.idValue && !ID_VALUE.test(d.idValue)) out.push('El valor del id va en minúsculas y con guiones: «carmin»')
  if (!d.leader.trim()) out.push('Falta el nombre del líder')
  if (!(d.badge in BADGES_BY_KEY)) out.push('Elige su medalla')
  const owner = badgeOwner(d.badge, d.idKey)
  if (owner) out.push(`La ${badgeName(d.badge)} ya la da el gimnasio ${owner}`)
  if (d.team.length === 0) out.push('El líder necesita al menos un Pokémon')
  d.team.forEach((f, i) => out.push(...foeIssues(f, i + 1)))
  return out
}

export function gymSummary(d: GymDraft): string {
  const levels = d.team.map((f) => f.level)
  const range = levels.length ? ` · Nv. ${Math.min(...levels)}–${Math.max(...levels)}` : ''
  return `${d.leader || 'Sin líder'} · ${d.team.length} Pokémon${range} · ${badgeName(d.badge) || 'sin medalla'}`
}
