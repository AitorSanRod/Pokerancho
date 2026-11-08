import { battleMove } from '../../data/learnsets'
import type { Battlefield } from './battlefield'
import { EventKind, on } from './events'
import { isUp, type GroupFighter } from './fighter'

// Lo que hace distintos a los jefes de incursión (data/incursions.ts › BossMechanics): furia, golpes en área y fases.

/** Al empezar cada turno: la furia sube su Ataque y, por debajo de cierta vida, cambia de movimiento */
export function bossTurnStart(bf: Battlefield, boss: GroupFighter) {
  const { enrage, phase } = boss.boss ?? {}
  if (enrage && bf.turn >= enrage.fromTurn && (bf.turn - enrage.fromTurn) % enrage.every === 0) {
    boss.rage++
    bf.log(on(boss, { kind: EventKind.Rage, actor: boss.id, text: `¡${boss.name} se enfurece!` }))
  }
  if (phase && boss.move.id !== phase.moveId && boss.hp / boss.maxHp < phase.belowHp) {
    boss.move = battleMove(phase.moveId)
    bf.log(on(boss, { kind: EventKind.Rage, actor: boss.id, text: `¡${boss.name} cambia de táctica!` }))
  }
}

/** Si este turno su golpe da a todo el grupo */
export const isAreaTurn = (bf: Battlefield, f: GroupFighter): boolean =>
  !!f.boss?.areaEvery && bf.turn % f.boss.areaEvery === 0

export const bossesUp = (bf: Battlefield): GroupFighter[] => bf.foes.filter((f) => f.boss && isUp(f))
