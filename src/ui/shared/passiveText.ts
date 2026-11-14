import { PASSIVE_THRESHOLDS, StatusId, TYPE_PASSIVES, type PassiveEffect, type PassiveLevel } from '../../data/passives'
import type { PokeType } from '../../data/types'

/** Una línea de lo que da una pasiva: qué hace y cuánto */
export interface PassiveLine {
  label: string
  value: string
}

/** El nivel más alto de pasiva */
export const MAX_PASSIVE_LEVEL = PASSIVE_THRESHOLDS.length as PassiveLevel

const pct = (fraction: number) => `${Math.round(fraction * 100)}%`

/** Lo que hace cada estado, en infinitivo («quemar») */
const STATUS_VERB: Record<StatusId, string> = {
  [StatusId.Burn]: 'quemar',
  [StatusId.Poison]: 'envenenar',
  [StatusId.Paralysis]: 'paralizar',
  [StatusId.Freeze]: 'congelar',
  [StatusId.Confusion]: 'confundir',
  [StatusId.Sleep]: 'dormir',
}

const STAT_NAMES = { hp: 'PS', atk: 'Ataque', def: 'Defensa', spe: 'Velocidad' } as const

/** Las subidas de stats: una sola línea si sube todas por igual (Dragón) */
function statLines(e: PassiveEffect): PassiveLine[] {
  const keys = Object.keys(STAT_NAMES) as (keyof typeof STAT_NAMES)[]
  const raised = keys.filter((k) => e[k])
  if (raised.length === keys.length && raised.every((k) => e[k] === e.hp)) return [{ label: 'Más PS, Ataque, Defensa y Velocidad', value: `+${pct(e.hp!)}` }]
  return raised.map((k) => ({ label: `Más ${STAT_NAMES[k]}`, value: `+${pct(e[k]!)}` }))
}

/** Lo que da una pasiva, línea a línea */
function effectLines(e: PassiveEffect): PassiveLine[] {
  const lines = statLines(e)
  if (e.inflict) lines.push({ label: `Probabilidad de ${STATUS_VERB[e.inflict.status]} al rival`, value: pct(e.inflict.chance) })
  if (e.drain) lines.push({ label: 'Recupera PS del daño que hace', value: pct(e.drain) })
  if (e.damageReduction) lines.push({ label: 'Recibe menos daño', value: `−${pct(e.damageReduction)}` })
  if (e.dodge) lines.push({ label: 'Probabilidad de esquivar un ataque', value: pct(e.dodge) })
  if (e.crit) lines.push({ label: 'Probabilidad de golpe crítico', value: pct(e.crit) })
  if (e.koHeal) lines.push({ label: 'Recupera PS al derrotar a un rival', value: pct(e.koHeal) })
  if (e.maxHitTaken) lines.push({ label: 'Lo más que le quita un ataque (de sus PS)', value: pct(e.maxHitTaken) })
  if (e.speedPerAttack) lines.push({ label: 'Sube la Velocidad cada vez que ataca', value: `+${e.speedPerAttack} etapa` })
  return lines
}

export const passiveLines = (type: PokeType, level: PassiveLevel): PassiveLine[] => effectLines(TYPE_PASSIVES[type][level - 1])

/** Primer nivel de la pasiva de un tipo, desde `from`, que da algo */
export function usefulLevel(type: PokeType, from: PassiveLevel = 1): PassiveLevel {
  for (let level = from; level <= MAX_PASSIVE_LEVEL; level++) if (passiveLines(type, level as PassiveLevel).length) return level as PassiveLevel
  return MAX_PASSIVE_LEVEL
}

/** Lo que da la pasiva de un tipo en combate, en una línea (en el rancho y, a todo el grupo, en las incursiones) */
export function passiveText(type: PokeType, level: PassiveLevel): string {
  const lines = passiveLines(type, level)
  return lines.length ? lines.map((l) => `${l.label}: ${l.value}`).join(' · ') : `Nada hasta el nivel ${usefulLevel(type, level)}`
}
