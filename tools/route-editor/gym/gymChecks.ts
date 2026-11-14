// Avisos del gimnasio: lo que haría que no compilase o que el juego lo rechazase. Con avisos no se guarda en el juego.

import { MAX_LEVEL } from '../../../src/game/team/stats'
import { teamIssues, teamSummary } from '../team/teamCode'
import { badgeOwner } from './gymCatalog'
import { badgeName, BADGES_BY_KEY, type GymDraft } from './gymDraft'

const ID_KEY = /^[A-Z][A-Za-z0-9]*$/
const ID_VALUE = /^[a-z0-9]+(-[a-z0-9]+)*$/

export function gymIssues(d: GymDraft): string[] {
  const out: string[] = []
  if (!ID_KEY.test(d.idKey)) out.push('El id (clave de GymId) empieza por mayúscula y solo lleva letras y cifras: «Carmin»')
  if (d.idValue && !ID_VALUE.test(d.idValue)) out.push('El valor del id va en minúsculas y con guiones: «carmin»')
  if (!d.leader.trim()) out.push('Falta el nombre del líder')
  if (!(d.badge in BADGES_BY_KEY)) out.push('Elige su medalla')
  const owner = badgeOwner(d.badge, d.idKey)
  if (owner) out.push(`La ${badgeName(d.badge)} ya la da el gimnasio ${owner}`)
  if (!(d.maxLevel >= 1 && d.maxLevel <= MAX_LEVEL)) out.push(`El nivel máximo para entrar va de 1 a ${MAX_LEVEL}`)
  out.push(...teamIssues(d.team, 'El líder'))
  return out
}

export function gymSummary(d: GymDraft): string {
  return `${d.leader || 'Sin líder'} · ${teamSummary(d.team)} · entran hasta Nv. ${d.maxLevel} · ${badgeName(d.badge) || 'sin medalla'}`
}
