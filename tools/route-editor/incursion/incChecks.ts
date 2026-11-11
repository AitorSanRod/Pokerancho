// Avisos del borrador de una incursión: lo que haría fallar los tests o que seguramente es un despiste.

import { DICTS } from '../catalog'
import { isMoveKey, MAX_ROOM_FOES } from './incCatalog'
import type { FoeDraft, IncursionDraft, PrizeDraft, RoomDraft } from './incDraft'

const isSpecies = (key: string) => key in DICTS.POKEMON
const isPercent = (n: number) => n > 0 && n <= 100

function moveIssues(moves: string[], where: string): string[] {
  if (!moves.length) return [`${where}: no tiene ataques`]
  const bad = moves.filter((m) => !isMoveKey(m))
  return bad.length ? [`${where}: ${bad.map((m) => `«${m || 'vacío'}»`).join(', ')} no es un ataque de IMOVE`] : []
}

function foeIssues(f: FoeDraft, where: string): string[] {
  const issues: string[] = []
  if (!isSpecies(f.species)) issues.push(`${where}: «${f.species || 'vacío'}» no es un Pokémon de POKEMON`)
  if (!(f.level > 0)) issues.push(`${where}: el nivel tiene que ser mayor que 0`)
  issues.push(...moveIssues(f.moves, where))
  if (f.hpMult !== null && !(f.hpMult > 0)) issues.push(`${where}: el multiplicador de PS tiene que ser mayor que 0`)
  if (new Set(f.passives.map((p) => p.type)).size !== f.passives.length) issues.push(`${where}: dos pasivas del mismo tipo`)
  if (!f.isBoss) return issues
  const { enrage, areaEvery, phase } = f.boss
  if (!enrage.on && areaEvery === null && !phase.on) issues.push(`${where}: es jefe pero no tiene ninguna mecánica`)
  if (enrage.on && !(enrage.every > 0 && enrage.atk > 0)) issues.push(`${where}: la furia necesita «cada» y «etapas» mayores que 0`)
  if (areaEvery !== null && !(areaEvery > 0)) issues.push(`${where}: el golpe en área necesita turnos mayores que 0`)
  if (phase.on) {
    if (!isPercent(phase.belowHp)) issues.push(`${where}: el cambio de fase va entre 0 y 100% de PS`)
    issues.push(...moveIssues(phase.moves, `${where}, segunda fase`))
  }
  return issues
}

function roomIssues(r: RoomDraft, i: number): string[] {
  const where = `Sala ${i + 1} (${r.name || 'sin nombre'})`
  const issues: string[] = []
  if (!r.name.trim()) issues.push(`${where}: falta el nombre`)
  if ((r.kind === 'Heal' || r.kind === 'Revive') && !isPercent(r.percent)) issues.push(`${where}: el porcentaje va entre 0 y 100`)
  if (r.kind !== 'Battle') return issues
  if (!r.slots.length) issues.push(`${where}: no tiene rivales`)
  if (r.slots.length > MAX_ROOM_FOES) issues.push(`${where}: más de ${MAX_ROOM_FOES} rivales (no caben en la escena)`)
  r.slots.forEach((s, j) => {
    const slot = `${where}, rival ${j + 1}`
    if (s.options.length > 1 && s.options.some((o) => !(o.weight > 0))) issues.push(`${slot}: los pesos tienen que ser mayores que 0`)
    s.options.forEach((o, k) => issues.push(...foeIssues(o.foe, s.options.length > 1 ? `${slot}, opción ${k + 1}` : slot)))
  })
  return issues
}

function prizeIssues(p: PrizeDraft, i: number): string[] {
  const where = `Premio ${i + 1}`
  const issues: string[] = []
  if (!(p.amount > 0)) issues.push(`${where}: la cantidad tiene que ser mayor que 0`)
  if (!isPercent(p.chance)) issues.push(`${where}: la probabilidad va entre 0 y 100%`)
  if (p.kind === 'Pieces' && !isSpecies(p.species)) issues.push(`${where}: «${p.species || 'vacío'}» no es un Pokémon de POKEMON`)
  return issues
}

/** Lista de avisos; vacía si todo cuadra */
export function incursionIssues(d: IncursionDraft): string[] {
  const issues: string[] = []
  if (!/^[A-Z][A-Za-z0-9]*$/.test(d.idKey)) issues.push('Id: escribe una clave como `CuevaHelada` (empieza en mayúscula, sin espacios)')
  if (!d.name.trim()) issues.push('Falta el nombre')
  if (!d.description.trim()) issues.push('Falta la descripción')
  if (d.minLevel > d.maxLevel) issues.push('Niveles: el mínimo es mayor que el máximo')
  if (!d.rooms.some((r) => r.kind === 'Battle')) issues.push('No hay ninguna sala de combate')
  d.rooms.forEach((r, i) => issues.push(...roomIssues(r, i)))
  if (!d.prizes.length) issues.push('No hay premios al terminarla')
  d.prizes.forEach((p, i) => issues.push(...prizeIssues(p, i)))
  if (!d.bots.length) issues.push('Faltan especies para los bots')
  const badBots = d.bots.filter((b) => !isSpecies(b))
  if (badBots.length) issues.push(`Bots: ${badBots.map((b) => `«${b || 'vacío'}»`).join(', ')} no es un Pokémon de POKEMON`)
  return issues
}

/** Resumen: salas, combates y rivales */
export function incursionSummary(d: IncursionDraft): string {
  const battles = d.rooms.filter((r) => r.kind === 'Battle')
  const foes = battles.reduce((sum, r) => sum + r.slots.length, 0)
  return `${d.rooms.length} salas · ${battles.length} combates · ${foes} rivales`
}
