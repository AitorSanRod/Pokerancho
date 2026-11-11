import { STATUS_INFO, StatusId } from '../../data/passives'
import type { Fighter } from '../battle/battle'
import type { Rng } from '../core/random'
import type { BossStatus, Raid } from './raidRoom'

// Estados alterados del jefe comunitario. Se los ponen los golpes de la sala con la misma probabilidad que en las rutas
// (las pasivas de cada uno) y, a diferencia de las incursiones, no se pasan con los turnos: duran hasta que cae el jefe.
// Puede llevar varios distintos a la vez. Solo el sueño y la congelación se quitan (HELD_ROUNDS). El daño de cada
// ronda (quemadura, veneno) se calcula sobre los PS que tendría el jefe como un Pokémon cualquiera, no sobre la vida de
// la sala, y se cuenta a quien le puso el estado.

/** Rondas en las que el jefe no ataca por estos estados; al acabarlas, se le quitan (los demás no se quitan) */
export const HELD_ROUNDS: Partial<Record<StatusId, number>> = {
  /** Congelado: pierde el ataque de la ronda en que se congela y se descongela */
  [StatusId.Freeze]: 1,
  /** Dormido: pierde tres ataques seguidos y se despierta */
  [StatusId.Sleep]: 3,
}

export const bossStatuses = (raid: Raid): BossStatus[] => raid.bossStatuses ?? []

export const bossHas = (raid: Raid, status: StatusId): boolean => bossStatuses(raid).some((b) => b.status === status)

/**
 * Le pone al jefe el estado que le ha dejado el golpe de `by` (en `boss.status`), si no lo tenía ya. Las salas
 * empezadas antes de los estados del jefe (sin `bossStatuses`) siguen sin ellos hasta que cae
 */
export function takeInflicted(raid: Raid, boss: Fighter, by: string) {
  const status = boss.status
  boss.status = null
  boss.frozenTurns = 0
  if (!status || !raid.bossStatuses || boss.hp === 0 || bossHas(raid, status)) return
  raid.bossStatuses = [...raid.bossStatuses, { status, by, rounds: HELD_ROUNDS[status] ?? null }]
}

/** Lo que le pasa al jefe por sus estados cuando le toca atacar */
export type BossTurn = { kind: 'attack' } | { kind: 'skip' } | { kind: 'self-hit'; by: string }

/** Pasa una ronda de los estados que se quitan solos y quita los que ya han cumplido */
function spendHeld(raid: Raid) {
  raid.bossStatuses = bossStatuses(raid)
    .map((b) => (b.rounds === null ? b : { ...b, rounds: b.rounds - 1 }))
    .filter((b) => b.rounds === null || b.rounds > 0)
}

/** Antes de atacar el jefe: dormido o congelado, pierde la ronda; paralizado, a veces; confuso, a veces se golpea */
export function bossTurn(raid: Raid, rng: Rng): BossTurn {
  const list = bossStatuses(raid)
  if (list.some((b) => b.rounds !== null)) {
    spendHeld(raid)
    return { kind: 'skip' }
  }
  const paralysis = STATUS_INFO[StatusId.Paralysis].skipChance ?? 0
  if (bossHas(raid, StatusId.Paralysis) && rng() < paralysis) return { kind: 'skip' }
  const confusion = list.find((b) => b.status === StatusId.Confusion)
  if (confusion && rng() < (STATUS_INFO[StatusId.Confusion].selfHitChance ?? 0)) return { kind: 'self-hit', by: confusion.by }
  return { kind: 'attack' }
}

/** Daño de fin de ronda de cada estado que lo hace, sobre `ownMaxHp` (los PS del jefe como Pokémon) */
export function statusTicks(raid: Raid, ownMaxHp: number): { status: StatusId; by: string; dealt: number }[] {
  return bossStatuses(raid).flatMap(({ status, by }) => {
    const perRound = STATUS_INFO[status].damagePerTurn
    return perRound ? [{ status, by, dealt: Math.max(1, Math.floor(ownMaxHp * perRound)) }] : []
  })
}
