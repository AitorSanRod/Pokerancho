// Tarjeta de una parada: los campos comunes y, según su tipo, los suyos.

import { DICTS, KIND_LABELS, landmarksOf, passiveText, typeName, TYPES, WILD_STAT_MULT } from './catalog'
import type { NodeDraft } from './draft'
import { button, checkbox, label, numInput, optNumInput, select, speciesInput, textInput } from './fields'
import { encounterList } from './routeView'

const opts = (dict: Record<string, unknown>): [string, string][] => Object.keys(dict).map((k) => [k, k])

function bossFields(n: NodeDraft, p: string) {
  const b = n.boss
  const base = label('Pokémon', speciesInput(`${p}.boss.species`, b.species)) + label('Nivel', numInput(`${p}.boss.level`, b.level))
  if (n.kind === 'Raid') {
    return (
      base +
      label('Premios', select(`${p}.boss.tier`, b.tier, opts(DICTS.RaidTier))) +
      label('Minutos en solitario', optNumInput(`${p}.boss.soloMinutes`, b.soloMinutes, 'por defecto'), 'lo que tardaría un Pokémon solo')
    )
  }
  const passives = b.passives
    .map(
      (ps, i) => `<div class="passive">
        ${select(`${p}.boss.passives.${i}.type`, ps.type, TYPES.map((t) => [t, typeName(t)]))}
        ${select(`${p}.boss.passives.${i}.level`, String(ps.level), [['1', 'Nivel 1'], ['2', 'Nivel 2']], undefined, 'num')}
        <small>${passiveText(ps.type, ps.level)}</small>
        ${button('remove', '×', `data-list="${p}.boss.passives" data-index="${i}"`, 'icon')}
      </div>`,
    )
    .join('')
  return (
    base +
    label('Multiplicador de stats', optNumInput(`${p}.statMult`, n.statMult, '1 (completas)', 0.05)) +
    `<div class="full"><span class="sub">Pasivas del jefe</span>${passives}${button('add-passive', '+ Pasiva', `data-list="${p}.boss.passives"`)}</div>`
  )
}

function wildFields(n: NodeDraft, p: string) {
  return (
    label('Niveles extra', optNumInput(`${p}.levelBonus`, n.levelBonus, '0'), 'se suman al rango de la ruta') +
    label('Multiplicador de stats', optNumInput(`${p}.statMult`, n.statMult, `${WILD_STAT_MULT} (por defecto)`, 0.05)) +
    `<div class="full">${checkbox(`${p}.ownEncounters`, n.ownEncounters, 'Encuentros propios (sustituyen a los de la ruta)')}
    ${n.ownEncounters ? encounterList(n.encounters, `${p}.encounters`) : ''}</div>`
  )
}

function kindFields(n: NodeDraft, p: string) {
  if (n.kind === 'Wild') return wildFields(n, p)
  if (n.kind === 'Boss' || n.kind === 'Raid') return bossFields(n, p)
  if (n.kind === 'Heal') return label('Poción', select(`${p}.potion`, n.potion, opts(DICTS.Potion)))
  if (n.kind === 'Gym') return label('Gimnasio', select(`${p}.gym`, n.gym, opts(DICTS.GymId)))
  return ''
}

export function nodeCard(n: NodeDraft, i: number, count: number, biome: string) {
  const p = `nodes.${i}`
  const landmarks = landmarksOf(biome)
  const landmarkOpts: [string, string][] = landmarks.map((k) => [k, k])
  if (n.landmark && !landmarks.includes(n.landmark)) landmarkOpts.push([n.landmark, `${n.landmark} (no está en este bioma)`])
  const move = `data-list="nodes" data-index="${i}"`
  return `<article class="node kind-${n.kind}">
    <header>
      <b>${i + 1}</b>
      ${select(`${p}.kind`, n.kind, Object.keys(KIND_LABELS).map((k) => [k, KIND_LABELS[k]]))}
      <span class="spacer"></span>
      ${button('up', '↑', move, 'icon')}${button('down', '↓', move, 'icon')}
      ${button('duplicate', 'Duplicar', move)}${count > 1 ? button('remove', '×', move, 'icon danger') : ''}
    </header>
    <div class="grid">
      ${label('Id', textInput(`${p}.id`, n.id, 'a'))}
      ${label('Nombre', textInput(`${p}.name`, n.name, 'Hierba alta'))}
      ${i > 0 ? label('Pasos desde la anterior', numInput(`${p}.steps`, n.steps)) : ''}
      ${label('Elemento en la escena', select(`${p}.landmark`, n.landmark, landmarkOpts, 'Ninguno'))}
      ${kindFields(n, p)}
    </div>
  </article>`
}
