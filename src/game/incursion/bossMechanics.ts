import { incursionMove } from '../../data/incursionMoves'
import type { Battlefield } from './battlefield'
import { EventKind, on } from './events'
import { isUp, type GroupFighter } from './fighter'
import { addStages } from './statStages'

// Lo que hace distintos a los jefes de incursión (data/incursions.ts › BossMechanics): furia, golpes en área y fases.

/** Al empezar cada turno: la furia sube etapas de su Ataque y, por debajo de cierta vida, cambia de ataques */
export function bossTurnStart(bf: Battlefield, boss: GroupFighter) {
  const { enrage, phase } = boss.boss ?? {}
  if (enrage && bf.turn >= enrage.fromTurn && (bf.turn - enrage.fromTurn) % enrage.every === 0) {
    addStages(boss.stages, 'atk', enrage.atk)
    bf.log(on(boss, { kind: EventKind.Rage, actor: boss.id, text: `¡${boss.name} se enfurece!` }))
  }
  if (phase && !inPhase(boss, phase.moveIds) && boss.hp / boss.maxHp < phase.belowHp) {
    boss.moves = phase.moveIds.map(incursionMove)
    boss.move = boss.moves[0]
    bf.log(on(boss, { kind: EventKind.Rage, actor: boss.id, text: `¡${boss.name} cambia de táctica!` }))
  }
}

const inPhase = (boss: GroupFighter, moveIds: string[]) => boss.moves.map((mv) => mv.id).join() === moveIds.join()

/** Si este turno su golpe da a todo el grupo */
export const isAreaTurn = (bf: Battlefield, f: GroupFighter): boolean =>
  !!f.boss?.areaEvery && bf.turn % f.boss.areaEvery === 0

export const bossesUp = (bf: Battlefield): GroupFighter[] => bf.foes.filter((f) => f.boss && isUp(f))
