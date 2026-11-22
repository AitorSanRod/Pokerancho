import { describe, expect, it } from 'vitest'
import { incursionMove, moveClass, MoveClass } from '../../data/incursionMoves'
import { SPECIES } from '../../data/species'
import { TM_IDS } from '../../data/tms'
import { combatRepertoire } from '../combat/combatRepertoire'
import { createMon } from '../team/mons'
import { MAX_LEVEL } from '../team/stats'
import {
  autoIncursionMoves,
  carriesIncursionMove,
  futureIncursionMoves,
  INCURSION_MOVE_SLOTS,
  incursionMoveChoices,
  incursionMovePool,
  mayCarryIncursionMove,
  outgrownMoves,
} from './incursionLoadout'
import { monRepertoire, repertoire } from './repertoire'

const ids = (moves: { id: string }[]) => moves.map((mv) => mv.id)
const mon = (speciesId: number, level = MAX_LEVEL) => createMon(speciesId, level)

/** Una especie que ha dejado atrás algún ataque de su repertorio a nivel máximo */
const grower = SPECIES.find((sp) => outgrownMoves(mon(sp.id)).length > 0)!
/** Una especie con más para elegir que huecos */
const rich = SPECIES.find((sp) => incursionMovePool(mon(sp.id)).length > INCURSION_MOVE_SLOTS)!

describe('ataques de incursión que lleva', () => {
  it('sin elegir, su repertorio en su orden y, si queda hueco, lo superado', () => {
    const m = mon(grower.id)
    const expected = [...new Set([...ids(monRepertoire(m)), ...ids(outgrownMoves(m))])].slice(0, INCURSION_MOVE_SLOTS)
    expect(ids(autoIncursionMoves(m))).toEqual(expected)
    expect(ids(incursionMoveChoices(m))).toEqual(expected)
  })

  it('se puede elegir de su repertorio y de sus ataques de ruta, con los datos de incursión', () => {
    const m = mon(rich.id)
    const pool = incursionMovePool(m)
    for (const mv of repertoire(m.speciesId, m.level)) expect(ids(pool)).toContain(mv.id)
    for (const mv of combatRepertoire(m.speciesId, m.level)) expect(pool).toContainEqual(incursionMove(mv.id))
  })

  it('lo superado no sale para elegir, pero si ya lo llevaba lo conserva', () => {
    const m = mon(grower.id)
    const [old] = outgrownMoves(m)
    if (!incursionMovePool(m).some((mv) => mv.id === old.id)) expect(ids(incursionMovePool(m))).not.toContain(old.id)
    m.incursionMoves = [old.id]
    expect(ids(incursionMoveChoices(m))).toEqual([old.id])
  })

  it('con lo elegido, lleva eso (sin lo que ya no sabe) y no más de los huecos', () => {
    const m = mon(rich.id)
    const pool = ids(incursionMovePool(m))
    m.incursionMoves = [...pool.slice(0, INCURSION_MOVE_SLOTS + 1), 'no-existe']
    expect(ids(incursionMoveChoices(m))).toEqual(pool.slice(0, INCURSION_MOVE_SLOTS))
    expect(carriesIncursionMove(m, pool[0])).toBe(true)
    expect(carriesIncursionMove(m, pool[INCURSION_MOVE_SLOTS])).toBe(false)
  })

  it('el servidor acepta lo de ruta y lo superado, pero no lo que aprende más adelante', () => {
    const strike = combatRepertoire(rich.id, MAX_LEVEL).find((mv) => moveClass(mv) === MoveClass.Damage)!
    expect(mayCarryIncursionMove(rich.id, MAX_LEVEL, strike.id)).toBe(true)
    const [old] = outgrownMoves(mon(grower.id))
    expect(mayCarryIncursionMove(grower.id, MAX_LEVEL, old.id)).toBe(true)
    const later = futureIncursionMoves(mon(rich.id, 1)).find((f) => !TM_IDS.some((tm) => tm === f.move.id))!
    expect(mayCarryIncursionMove(rich.id, 1, later.move.id)).toBe(false)
  })

  it('lo que aprenderá después no lo sabe aún y va por orden de nivel', () => {
    const m = mon(rich.id, 1)
    const later = futureIncursionMoves(m)
    expect(later.length).toBeGreaterThan(0)
    for (const f of later) {
      expect(f.level).toBeGreaterThan(1)
      expect(ids(incursionMovePool(m))).not.toContain(f.move.id)
    }
    expect(later.map((f) => f.level)).toEqual([...later.map((f) => f.level)].sort((a, b) => a - b))
  })
})
