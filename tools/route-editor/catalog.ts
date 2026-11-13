// Listas para los desplegables del editor, sacadas de los datos reales del juego (nada escrito a mano aquí).

import { Badge } from '../../src/data/badges'
import { GymId } from '../../src/data/gyms'
import { Biome, KANTO, NodeKind, RouteId, StopLandmark } from '../../src/data/maps'
import { RANCH_PASSIVE_SCALE, STATUS_INFO, TYPE_PASSIVES, type PassiveEffect } from '../../src/data/passives'
import { scaleEffect } from '../../src/game/battle/combatBonus'
import { POKEMON } from '../../src/data/pokemon'
import { Potion } from '../../src/data/potions'
import { RaidTier } from '../../src/data/raidBosses'
import { sprite } from '../../src/data/species'
import { TYPE_INFO, type PokeType } from '../../src/data/types'
import { WILD_STAT_MULT } from '../../src/game/run/runBattle'
import { pixelSceneFor } from '../../src/ui/route/pixelScene'

export { KANTO, NodeKind, WILD_STAT_MULT }

export const DICTS = { POKEMON, Biome, RouteId, StopLandmark, Potion, RaidTier, NodeKind, GymId, Badge } as const

const MISSING_MARK = 'missing-key:'

/** Valor de una clave que no está en su diccionario (al pegar código con un RouteId nuevo o un Pokémon mal escrito) */
export const missing = (key: string) => `${MISSING_MARK}${key}`

/** Clave de un diccionario (`POKEMON`, `Biome`…) a partir de su valor; la de una clave desconocida, tal cual */
export function keyOf(dict: Record<string, unknown>, value: unknown): string {
  if (typeof value === 'string' && value.startsWith(MISSING_MARK)) return value.slice(MISSING_MARK.length)
  return Object.keys(dict).find((k) => dict[k] === value) ?? ''
}

export const SPECIES_KEYS = Object.keys(POKEMON)
export const spriteOf = (key: string): string => (key in POKEMON ? sprite.front(POKEMON[key as keyof typeof POKEMON]) : '')

export const KIND_LABELS: Record<string, string> = {
  Start: 'Inicio',
  Wild: 'Salvaje',
  Boss: 'Jefe',
  Raid: 'Jefe comunitario',
  Heal: 'Curación',
  Gym: 'Gimnasio',
}

export const TYPES = Object.keys(TYPE_PASSIVES) as PokeType[]
export const typeName = (t: PokeType) => TYPE_INFO[t].name

const STAT_LABELS: Record<string, string> = {
  hp: 'PS',
  atk: 'Ataque',
  def: 'Defensa',
  spe: 'Velocidad',
  regen: 'regenera por turno',
  drain: 'roba del daño hecho',
  damageReduction: 'menos daño recibido',
  dodge: 'esquiva',
  crit: 'crítico',
  winHeal: 'cura al ganar',
}

const pct = (n: number) => `${Math.round(n * 100)}%`

/**
 * Texto corto de lo que hace una pasiva en combate: «Ataque +12% · Quemadura 4%». Por defecto, a RANCH_PASSIVE_SCALE de
 * su efecto, como en rutas, jefes y gimnasios; en incursiones, `scale` 1 (allí cuentan enteras)
 */
export function passiveText(type: PokeType, level: 1 | 2, scale = RANCH_PASSIVE_SCALE): string {
  const effect: PassiveEffect = scaleEffect(TYPE_PASSIVES[type][level - 1], scale)
  return Object.entries(effect)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => {
      if (k === 'inflict') return `${STATUS_INFO[v.status as keyof typeof STATUS_INFO].name} ${pct(v.chance)}`
      if (k === 'bonusVs') return `+${pct(v.damage)} de daño contra ${v.types.map(typeName).join(', ')}`
      return ['hp', 'atk', 'def', 'spe'].includes(k) ? `${STAT_LABELS[k]} +${pct(v)}` : `${pct(v)} ${STAT_LABELS[k] ?? k}`
    })
    .join(' · ')
}

/** Claves de `StopLandmark` que dibuja la escena del bioma */
export function landmarksOf(biomeKey: string): string[] {
  const biome = Biome[biomeKey as keyof typeof Biome]
  if (!biome) return []
  const ids = pixelSceneFor(biome).landmarks.map((l) => l.id)
  return Object.keys(StopLandmark).filter((k) => ids.includes(StopLandmark[k as keyof typeof StopLandmark]))
}
