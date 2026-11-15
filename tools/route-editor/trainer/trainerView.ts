// Formulario del entrenador: clave, clase (eligiendo su dibujo), nombre o género fijos si se quiere y equipo.

import { esc, label, select, textInput } from '../fields'
import { teamSection } from '../team/teamView'
import { CLASS_TILES, GENDER_OPTIONS, isNewTrainer, NAME_OPTIONS, trainerStops } from './trainerCatalog'
import { draftIdentity, type TrainerDraft } from './trainerDraft'

/** Las clases como tarjetas con sus dibujos (uno por género): se elige una tocándola */
function classPicker(d: TrainerDraft) {
  const tiles = CLASS_TILES.map(({ key, titles, images }) => {
    const on = key === d.trainerClass
    return `<label class="look ${on ? 'on' : ''}">
      <input type="radio" name="trainerClass" value="${esc(key)}" data-bind="trainerClass" data-type="text" data-rerender ${on ? 'checked' : ''} />
      <span>${images.map((img) => `<img src="${esc(img)}" alt="" />`).join('')}</span><small>${esc(titles)}</small>
    </label>`
  })
  return `<div class="looks">${tiles.join('')}</div>`
}

function stopsNote(d: TrainerDraft) {
  const stops = trainerStops(d.idKey)
  if (!stops.length) return '<small>Todavía no sale en ninguna ruta (ver «Añadir también»)</small>'
  return `<small>Sale en: ${stops.map(esc).join(' · ')}</small>`
}

function whoFields(d: TrainerDraft) {
  const shown = d.name ? `se ve así: «¡${esc(draftIdentity(d).name)} te reta!»` : 'sin él, uno al azar del género que le toque en cada ruta'
  const name = label('Nombre fijo', select('name', d.name, NAME_OPTIONS, 'Al azar en cada ruta'), shown)
  if (d.name) return name
  return name + label('Género fijo', select('gender', d.gender, GENDER_OPTIONS, 'Al azar de su clase'), 'solo cuenta si su clase tiene dos')
}

export function trainerForm(d: TrainerDraft): string {
  return `
  <section class="card">
    <h2>Entrenador</h2>
    <div class="grid">
      ${label('Clave (su TrainerId)', textInput('idKey', d.idKey, 'Joven1'), isNewTrainer(d.idKey) ? 'nuevo' : 'ya existe: se sustituye')}
      <div class="full"><span class="sub">Clase <small>(título y dibujo según el género)</small></span>${classPicker(d)}</div>
      ${whoFields(d)}
      <div class="full">${stopsNote(d)}</div>
    </div>
  </section>
  ${teamSection(d.team, 'kind-Trainer')}`
}
