// Avisos del entrenador: lo que haría que no compilase o que el juego lo rechazase. Con avisos no se guarda en el juego.

import { fitsClass } from '../../../src/game/run/trainerIdentity'
import { DICTS } from '../catalog'
import { teamIssues, teamSummary } from '../team/teamCode'
import { classTitles, trainerStops } from './trainerCatalog'
import { draftIdentity, draftWho, type TrainerDraft } from './trainerDraft'

const ID_KEY = /^[A-Z][A-Za-z0-9]*$/

function whoIssues(d: TrainerDraft): string[] {
  if (!(d.trainerClass in DICTS.TrainerClass)) return ['Elige su clase']
  if (d.name && !(d.name in DICTS.TrainerName)) return [`No hay ningún nombre «${d.name}» en TrainerName (src/data/trainerNames.ts)`]
  if (d.gender && !(d.gender in DICTS.Gender)) return [`No hay ningún género «${d.gender}»`]
  return fitsClass(draftWho(d)) ? [] : ['Su clase no tiene ese género: elige otro nombre o género']
}

export function trainerIssues(d: TrainerDraft): string[] {
  const out: string[] = []
  if (!ID_KEY.test(d.idKey)) out.push('La clave (su TrainerId) empieza por mayúscula y solo lleva letras y cifras: «Joven1»')
  out.push(...whoIssues(d))
  out.push(...teamIssues(d.team, 'El entrenador'))
  return out
}

export function trainerSummary(d: TrainerDraft): string {
  const stops = trainerStops(d.idKey).length
  const who = d.name ? draftIdentity(d).name : `${classTitles(d.trainerClass)} (nombre al azar)`
  return `${who} · ${teamSummary(d.team)} · ${stops ? `en ${stops} parada${stops > 1 ? 's' : ''}` : 'aún en ninguna ruta'}`
}
