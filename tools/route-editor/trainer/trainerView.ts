// Formulario del entrenador: id, nombre, aspecto (eligiendo su dibujo) y equipo, un Pokémon tras otro.

import { esc, label, textInput } from '../fields'
import { teamSection } from '../team/teamView'
import { isNewTrainer, LOOKS, trainerStops } from './trainerCatalog'
import { trainerIdValue } from './trainerCodegen'
import type { TrainerDraft } from './trainerDraft'

/** Los aspectos como tarjetas con su dibujo: se elige uno tocándolo */
function lookPicker(d: TrainerDraft) {
  const tiles = LOOKS.map(
    ([key, img]) => `<label class="look ${key === d.look ? 'on' : ''}">
      <input type="radio" name="look" value="${esc(key)}" data-bind="look" data-type="text" data-rerender ${key === d.look ? 'checked' : ''} />
      <img src="${esc(img)}" alt="" /><small>${esc(key)}</small>
    </label>`,
  )
  return `<div class="looks">${tiles.join('')}</div>`
}

function stopsNote(d: TrainerDraft) {
  const stops = trainerStops(trainerIdValue(d))
  if (!stops.length) return '<small>Todavía no sale en ninguna ruta (ver «Añadir también»)</small>'
  return `<small>Sale en: ${stops.map(esc).join(' · ')}</small>`
}

export function trainerForm(d: TrainerDraft): string {
  return `
  <section class="card">
    <h2>Entrenador</h2>
    <div class="grid">
      ${label('Id (clave de TrainerId)', textInput('idKey', d.idKey, 'MarineroDani'), isNewTrainer(d.idKey) ? 'nuevo' : 'ya existe: se sustituye')}
      ${label('Valor del id', textInput('idValue', d.idValue, trainerIdValue(d) || 'marinero-dani'), 'solo si es nuevo')}
      ${label('Nombre', textInput('name', d.name, 'Marinero Dani'), 'tal y como se ve: «¡Marinero Dani te reta!»')}
      <div class="full"><span class="sub">Aspecto <small>(el dibujo que se ve detrás de su Pokémon)</small></span>${lookPicker(d)}</div>
      <div class="full">${stopsNote(d)}</div>
    </div>
  </section>
  ${teamSection(d.team, 'kind-Trainer')}`
}
