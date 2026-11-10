// Avisos del borrador: lo que haría fallar los tests del mapa o que seguramente es un despiste.

import { DICTS, landmarksOf } from './catalog'
import type { EncDraft, NodeDraft, RouteDraft } from './draft'

const ENC_TOTAL = 100

function encounterIssues(list: EncDraft[], where: string): string[] {
  const issues: string[] = []
  const total = list.reduce((sum, e) => sum + (Number(e.chance) || 0), 0)
  if (total !== ENC_TOTAL) issues.push(`${where}: las probabilidades suman ${total}%, no ${ENC_TOTAL}%`)
  for (const e of list) if (!(e.species in DICTS.POKEMON)) issues.push(`${where}: «${e.species || 'vacío'}» no es un Pokémon de POKEMON`)
  const keys = list.map((e) => e.species)
  if (new Set(keys).size !== keys.length) issues.push(`${where}: hay un Pokémon repetido`)
  return issues
}

function nodeIssues(n: NodeDraft, i: number, landmarks: string[]): string[] {
  const where = `Parada ${i + 1} (${n.id || 'sin id'})`
  const issues: string[] = []
  if (!n.id.trim()) issues.push(`${where}: falta el id`)
  if (!n.name.trim()) issues.push(`${where}: falta el nombre`)
  if (i > 0 && n.kind === 'Start') issues.push(`${where}: solo la primera parada puede ser de inicio`)
  if (i > 0 && !(n.steps > 0)) issues.push(`${where}: los pasos tienen que ser más de 0`)
  if (n.landmark && !landmarks.includes(n.landmark)) issues.push(`${where}: la escena del bioma no dibuja «${n.landmark}»`)
  if ((n.kind === 'Boss' || n.kind === 'Raid') && !(n.boss.species in DICTS.POKEMON)) issues.push(`${where}: falta el Pokémon del jefe`)
  if (n.kind === 'Boss' && new Set(n.boss.passives.map((p) => p.type)).size !== n.boss.passives.length) {
    issues.push(`${where}: el jefe tiene dos pasivas del mismo tipo`)
  }
  if (n.kind === 'Wild' && n.ownEncounters) issues.push(...encounterIssues(n.encounters, `${where}, encuentros`))
  if (n.kind === 'Wild' && n.statMult !== null && !(n.statMult > 0)) issues.push(`${where}: el multiplicador tiene que ser mayor que 0`)
  return issues
}

/** Lista de avisos; vacía si todo cuadra */
export function draftIssues(d: RouteDraft): string[] {
  const issues: string[] = []
  if (!/^[A-Z][A-Za-z0-9]*$/.test(d.idKey)) issues.push('Id de la ruta: escribe una clave como `Ruta4` (empieza en mayúscula, sin espacios)')
  if (!d.name.trim()) issues.push('Falta el nombre de la ruta')
  if (d.levels[0] > d.levels[1]) issues.push('Niveles: el mínimo es mayor que el máximo')
  if (d.unlocks && d.unlocks === d.idKey) issues.push('La ruta no puede abrirse a sí misma')
  if (d.useBackdrop && !d.backdropFile.trim()) issues.push('Imagen de la lista: falta el nombre del fichero')
  issues.push(...encounterIssues(d.encounters, 'Encuentros de la ruta'))
  if (d.nodes[0]?.kind !== 'Start') issues.push('La primera parada tiene que ser de inicio')
  if (d.nodes.length < 2) issues.push('La ruta necesita al menos una parada además del inicio')
  const ids = d.nodes.map((n) => n.id)
  const repeated = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (repeated.length) issues.push(`Ids de parada repetidos: ${[...new Set(repeated)].join(', ')}`)
  const landmarks = landmarksOf(d.biome)
  d.nodes.forEach((n, i) => issues.push(...nodeIssues(n, i, landmarks)))
  return issues
}

/** Resumen de la ruta: pasos en total y combates */
export function draftSummary(d: RouteDraft): string {
  const steps = d.nodes.reduce((sum, n) => sum + (Number(n.steps) || 0), 0)
  const fights = d.nodes.filter((n) => n.kind === 'Wild' || n.kind === 'Boss' || n.kind === 'Raid').length
  return `${d.nodes.length} paradas · ${steps} pasos · ${fights} combates`
}
