import { simulateBattle, type BattleEvent, type BattleRecord, type Fighter } from '../battle/battle'
import { CRIT_RING_MS, judgeRing, ringKey, ringShown, type RingResult } from '../battle/critTiming'
import { seededRng } from '../core/random'
import type { GameState } from '../core/state'
import { BATTLE_EVENT_MS, battleDuration } from './battleTimeline'

// Toque crítico en los combates de ruta (reglas en battle/critTiming.ts): algunos ataques del jugador llevan anillo,
// que se cierra cuando empieza el ataque y se vigila hasta que llega el golpe. Si lo lleva depende de la semilla del
// combate y del número de ataque. El combate se resuelve con una
// semilla: al acertar (o fallar tras acertar) se vuelve a jugar con los mismos dados y solo cambia desde ese golpe.

/** Lo que da el combate si se gana (se tira al empezarlo, gane o no) */
export interface BattlePrize {
  money: number
  tickets: number
  exp: number
  piece: boolean
}

/** Cómo empezó el combate de la parada, para volver a jugarlo con los críticos del jugador */
export interface RouteBattleSetup {
  seed: number
  player: Fighter
  enemy: Fighter
  prize: BattlePrize
  /** Milisegundos de combate en los que el jugador ha tocado la pantalla */
  taps: number[]
}

/** Un ataque del jugador con anillo: su número (1 = el primero) y cuándo empieza (ms desde el principio del combate) */
export interface RingTime {
  ordinal: number
  at: number
}

const isPlayerAttack = (e: BattleEvent) => e.kind === 'attack' && e.side === 'player'

/** Los ataques del jugador que llevan anillo (Forcejeo nunca, aunque cuenta en el número de ataque) */
export function ringTimes(record: BattleRecord, seed: number): RingTime[] {
  const out: RingTime[] = []
  let at = 0
  let ordinal = 0
  for (const e of record.events) {
    if (isPlayerAttack(e)) {
      ordinal++
      if (!e.struggle && ringShown(ringKey(seed, ordinal))) out.push({ ordinal, at })
    }
    at += BATTLE_EVENT_MS[e.kind]
  }
  return out
}

/** Cómo fue ese anillo, vigilado hasta que llega el golpe */
export const ringResult = (ring: RingTime, taps: number[]): RingResult => judgeRing(ring.at, ring.at + BATTLE_EVENT_MS.attack, taps)

/** El anillo que se ve en el momento `elapsed` del combate (desde que empieza a cerrarse hasta el golpe); null si ninguno */
export const ringAt = (record: BattleRecord, seed: number, elapsed: number): RingTime | null =>
  ringTimes(record, seed).find((r) => elapsed >= r.at - CRIT_RING_MS && elapsed < r.at + BATTLE_EVENT_MS.attack) ?? null

/** Juega el combate desde el principio con los críticos de esos ataques */
export function playSetup(setup: RouteBattleSetup, crits: number[]) {
  const player = { ...structuredClone(setup.player), tapCrits: crits }
  return simulateBattle(player, structuredClone(setup.enemy), seededRng(setup.seed))
}

/** Lo que se ve del premio: el de la parada si se gana, nada si no */
export const rewardsFor = (prize: BattlePrize, outcome: BattleRecord['outcome']): BattleRecord['rewards'] =>
  outcome === 'win' ? { ...prize, moneyLost: 0 } : { money: 0, tickets: 0, exp: 0, piece: false, moneyLost: 0 }

/** Milisegundos de combate en la hora real `now` (el combate avanza en el tick; entre ticks, se suma lo que ha pasado) */
export function battleElapsed(s: GameState, now: number): number {
  const record = s.run!.lastBattle!
  return Math.max(0, battleDuration(record) - s.run!.battleMsLeft + Math.max(0, now - s.lastTick))
}

/**
 * Toque en pleno combate de ruta: se apunta y, si cambia algún crítico, el combate se vuelve a jugar con los mismos
 * dados (lo ya visto no cambia) y sigue desde el mismo momento. Devuelve si había combate
 */
export function tapBattle(s: GameState, now: number): boolean {
  const run = s.run
  const setup = run?.battleSetup
  if (!run || !setup || !run.lastBattle || run.battleMsLeft === 0) return false
  const elapsed = battleElapsed(s, now)
  const crits = (taps: number[]) => ringTimes(run.lastBattle!, setup.seed).filter((r) => ringResult(r, taps) === 'crit').map((r) => r.ordinal)
  const before = crits(setup.taps)
  setup.taps.push(elapsed)
  const after = crits(setup.taps)
  if (before.join() === after.join()) return true
  const result = playSetup(setup, after)
  const record = run.lastBattle
  Object.assign(record, { events: result.events, outcome: result.outcome, rewards: rewardsFor(setup.prize, result.outcome) })
  run.battleMsLeft = Math.max(1, battleDuration(record) - (elapsed - Math.max(0, now - s.lastTick)))
  return true
}
