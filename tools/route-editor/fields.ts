// Campos del formulario como HTML. Cada uno se enlaza con el borrador por `data-bind` (la ruta del campo:
// `nodes.2.boss.level`) y `data-type` (cómo se lee el valor); `data-rerender` repinta el formulario al cambiarlo.

import { spriteOf } from './catalog'

export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

type FieldType = 'text' | 'num' | 'optnum' | 'bool'

const bind = (path: string, type: FieldType, rerender = false) =>
  `data-bind="${path}" data-type="${type}"${rerender ? ' data-rerender' : ''}`

export const label = (text: string, field: string, hint = '') =>
  `<label class="field"><span>${text}${hint ? ` <small>${esc(hint)}</small>` : ''}</span>${field}</label>`

export const textInput = (path: string, value: string, placeholder = '') =>
  `<input type="text" ${bind(path, 'text')} value="${esc(value)}" placeholder="${esc(placeholder)}" />`

export const textArea = (path: string, value: string) => `<textarea rows="2" ${bind(path, 'text')}>${esc(value)}</textarea>`

export const numInput = (path: string, value: number, step = 1) =>
  `<input type="number" step="${step}" ${bind(path, 'num')} value="${esc(value)}" />`

/** Número que se puede dejar vacío (entonces no se escribe en el código) */
export const optNumInput = (path: string, value: number | null, placeholder: string, step = 1) =>
  `<input type="number" step="${step}" ${bind(path, 'optnum')} value="${value ?? ''}" placeholder="${esc(placeholder)}" />`

export const checkbox = (path: string, value: boolean, text: string) =>
  `<label class="check"><input type="checkbox" ${bind(path, 'bool', true)} ${value ? 'checked' : ''} /> ${text}</label>`

/** Desplegable: `options` son [valor, texto]; `none` añade una opción vacía con ese texto */
export function select(path: string, value: string, options: [string, string][], none?: string, type: FieldType = 'text') {
  const all: [string, string][] = none !== undefined ? [['', none], ...options] : options
  const opts = all.map(([v, t]) => `<option value="${esc(v)}" ${v === value ? 'selected' : ''}>${esc(t)}</option>`)
  return `<select ${bind(path, type, true)}>${opts.join('')}</select>`
}

/** Pokémon por su clave de POKEMON, con buscador (datalist) y su sprite al lado */
export const speciesInput = (path: string, value: string) =>
  `<span class="species"><img data-sprite="${path}" src="${spriteOf(value)}" alt="" />` +
  `<input type="text" list="species-list" ${bind(path, 'text')} value="${esc(value)}" placeholder="Pikachu" /></span>`

export const button = (action: string, text: string, data = '', cls = '') =>
  `<button type="button" class="${cls}" data-action="${action}" ${data}>${text}</button>`
