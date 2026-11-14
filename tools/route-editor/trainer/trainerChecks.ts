// Avisos del entrenador: lo que haría que no compilase o que el juego lo rechazase. Con avisos no se guarda en el juego.

import { DICTS } from '../catalog'
import { teamIssues, teamSummary } from '../team/teamCode'
import { trainerStops } from './trainerCatalog'
import { trainerIdValue } from './trainerCodegen'
import type { TrainerDraft } from './trainerDraft'

const ID_KEY = /^[A-Z][A-Za-z0-9]*$/
const ID_VALUE = /^[a-z0-9]+(-[a-z0-9]+)*$/

export function trainerIssues(d: TrainerDraft): string[] {
  const out: string[] = []
  if (!ID_KEY.test(d.idKey)) out.push('El id (clave de TrainerId) empieza por mayúscula y solo lleva letras y cifras: «MarineroDani»')
  if (d.idValue && !ID_VALUE.test(d.idValue)) out.push('El valor del id va en minúsculas y con guiones: «marinero-dani»')
  if (!d.name.trim()) out.push('Falta el nombre del entrenador')
  if (!(d.look in DICTS.TrainerLook)) out.push('Elige su aspecto')
  out.push(...teamIssues(d.team, 'El entrenador'))
  return out
}

export function trainerSummary(d: TrainerDraft): string {
  const stops = trainerStops(trainerIdValue(d)).length
  return `${d.name || 'Sin nombre'} · ${teamSummary(d.team)} · ${stops ? `en ${stops} parada${stops > 1 ? 's' : ''}` : 'aún en ninguna ruta'}`
}
