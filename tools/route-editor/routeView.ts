// Datos generales de la ruta y lista de encuentros (también la de las paradas con encuentros propios).

import { DICTS } from './catalog'
import type { EncDraft, RouteDraft } from './draft'
import { button, checkbox, label, numInput, select, speciesInput, textArea, textInput } from './fields'

const opts = (dict: Record<string, unknown>): [string, string][] => Object.keys(dict).map((k) => [k, k])

/** Lista de encuentros con su suma al lado (se actualiza sola al escribir) */
export function encounterList(list: EncDraft[], path: string) {
  const rows = list
    .map(
      (e, i) => `<div class="enc">
        ${speciesInput(`${path}.${i}.species`, e.species)}
        <span class="chance">${numInput(`${path}.${i}.chance`, e.chance)}%</span>
        ${button('remove', '×', `data-list="${path}" data-index="${i}"`, 'icon')}
      </div>`,
    )
    .join('')
  return `<div class="encounters">${rows}
    <div class="enc-foot">${button('add-enc', '+ Pokémon', `data-list="${path}"`)}<span data-sum="${path}"></span></div>
  </div>`
}

function idFields(d: RouteDraft) {
  const isNew = d.idKey !== '' && !(d.idKey in DICTS.RouteId)
  return (
    label('Id (clave de RouteId)', `<input type="text" list="route-ids" data-bind="idKey" data-type="text" data-rerender value="${d.idKey}" placeholder="Ruta4" />`, isNew ? 'nueva' : '') +
    (isNew ? label('Valor del RouteId nuevo', textInput('idValue', d.idValue, 'se guarda en la partida: ruta-4')) : '')
  )
}

function backdropFields(d: RouteDraft) {
  const fields = d.useBackdrop
    ? label('Fichero en src/assets/routes/', textInput('backdropFile', d.backdropFile, 'route-4.webp')) +
      label('Franja visible (focusY)', numInput('focusY', d.focusY), '0 arriba · 100 abajo')
    : ''
  return `<div class="full">${checkbox('useBackdrop', d.useBackdrop, 'Imagen en la lista de rutas')}</div>${fields}`
}

export function routeSection(d: RouteDraft) {
  return `<section class="card">
    <h2>Ruta</h2>
    <div class="grid">
      ${idFields(d)}
      ${label('Nombre', textInput('name', d.name, 'Ruta 4'))}
      <div class="full">${label('Descripción', textArea('description', d.description))}</div>
      <div class="full">${label('Comentario en el código', textInput('comment', d.comment, '~6 min y 7 combates, el último contra un jefe'), 'opcional')}</div>
      ${label('Bioma (fondo al caminar)', select('biome', d.biome, opts(DICTS.Biome)))}
      ${label('Abre al completarla', select('unlocks', d.unlocks, opts(DICTS.RouteId), 'Nada'))}
      ${label('Nivel mínimo', numInput('levels.0', d.levels[0]))}
      ${label('Nivel máximo', numInput('levels.1', d.levels[1]))}
      ${backdropFields(d)}
    </div>
    <h3>Premio la primera vez</h3>
    <div class="grid">
      ${label('Tickets', numInput('reward.tickets', d.reward.tickets))}
      ${label('Dinero (₽)', numInput('reward.money', d.reward.money))}
      ${label('EXP', numInput('reward.exp', d.reward.exp), 'también base de las expediciones')}
    </div>
    <h3>Encuentros de la ruta</h3>
    ${encounterList(d.encounters, 'encounters')}
  </section>`
}
