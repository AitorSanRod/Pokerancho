import type { Move } from '../../data/moves'
import { simulateBattle, type BattleRecord, type Fighter } from '../battle/battle'
import { seededRng } from '../core/random'
import { BATTLE_EVENT_MS, battleDuration } from './battleTimeline'

// Combates de ruta y de la torre que se juegan con una semilla: se pueden volver a jugar con los mismos dados (lo ya
// visto no cambia) tras un toque crítico (tapCrit.ts) o un cambio de ataque en pleno combate, que vale desde el
// siguiente ataque del jugador.

/** Cómo empezó un combate, para volver a jugarlo */
export interface BattleSetup {
  seed: number
  player: Fighter
  enemy: Fighter
  /** Texto del principio del combate, si no es el de un salvaje que aparece (gimnasios, rivales shiny) */
  intro?: string
}

/** Juega el combate desde el principio con los críticos de esos ataques (y los cambios de ataque que lleve el jugador) */
export function playSetup(setup: BattleSetup, crits: number[] = []) {
  const player = { ...structuredClone(setup.player), tapCrits: crits }
  const result = simulateBattle(player, structuredClone(setup.enemy), seededRng(setup.seed))
  if (setup.intro) result.events[0] = { ...result.events[0], text: setup.intro }
  return result
}

/** Milisegundos vistos del combate en la hora real `now` (avanza en el tick; entre ticks, se suma lo que ha pasado) */
export const elapsedAt = (record: BattleRecord, msLeft: number, lastTick: number, now: number): number =>
  Math.max(0, battleDuration(record) - msLeft + Math.max(0, now - lastTick))

/** Lo que le queda al combate (ya vuelto a jugar) para seguir en el momento `elapsed` */
export const msLeftAt = (record: BattleRecord, elapsed: number, lastTick: number, now: number): number =>
  Math.max(1, battleDuration(record) - (elapsed - Math.max(0, now - lastTick)))

/** Número de ataques que ya ha empezado el jugador en el momento `elapsed` del combate */
function playerAttacksBy(record: BattleRecord, elapsed: number): number {
  let at = 0
  let count = 0
  for (const e of record.events) {
    if (at > elapsed) break
    if (e.kind === 'attack' && e.side === 'player') count++
    at += BATTLE_EVENT_MS[e.kind]
  }
  return count
}

/** El jugador usa `move` desde su siguiente ataque tras el momento `elapsed` (los cambios de después se olvidan) */
export function switchPlayerMove(setup: BattleSetup, record: BattleRecord, elapsed: number, move: Move) {
  const fromAttack = playerAttacksBy(record, elapsed) + 1
  const kept = (setup.player.moveSwitches ?? []).filter((sw) => sw.fromAttack < fromAttack)
  setup.player.moveSwitches = [...kept, { fromAttack, move }]
}
