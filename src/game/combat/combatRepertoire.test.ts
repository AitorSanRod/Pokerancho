import { afterEach, describe, expect, it } from 'vitest'
import { COMBAT_LADDERS, COMBAT_MOVESETS, COMBAT_SPECIES_MOVES, COMBAT_TUNING, combatMove } from '../../data/combatMoves'
import { incursionMove, moveClass, MoveClass } from '../../data/incursionMoves'
import { Rarity, rarityOf, species, SPECIES } from '../../data/species'
import { TM_IDS, TMS, type Tm } from '../../data/tms'
import { speciesOfRarity } from '../core/test-utils'
import { repertoire } from '../incursion/repertoire'
import { MAX_LEVEL } from '../team/stats'
import { combatLearnTimeline, combatMoveChoices, combatRepertoire, knowsCombatMove, mayKnowCombatMove, ROUTE_MOVE_SLOTS, routeMoveChoices } from './combatRepertoire'

const RARITY_ORDER = Object.values(Rarity)
const ids = (moves: { id: string }[]) => moves.map((mv) => mv.id).sort()
const ladderSpecies = SPECIES.filter((sp) => !COMBAT_MOVESETS[sp.id])

/** Restaura las listas a mano que un test cambie */
const REAL_SETS = { ...COMBAT_MOVESETS }
const REAL_OWN = { ...COMBAT_SPECIES_MOVES }
afterEach(() => {
  for (const k of Object.keys(COMBAT_MOVESETS)) delete COMBAT_MOVESETS[Number(k)]
  for (const k of Object.keys(COMBAT_SPECIES_MOVES)) delete COMBAT_SPECIES_MOVES[Number(k)]
  Object.assign(COMBAT_MOVESETS, REAL_SETS)
  Object.assign(COMBAT_SPECIES_MOVES, REAL_OWN)
})

describe('escaleras de combate (datos)', () => {
  it('solo ataques de daño, todos de su tipo y que existen como ataques de incursión', () => {
    for (const [type, steps] of Object.entries(COMBAT_LADDERS)) {
      for (const { move } of steps) {
        expect(moveClass(combatMove(move.id))).toBe(MoveClass.Damage)
        expect(move.type).toBe(type)
        expect(() => incursionMove(move.id)).not.toThrow()
      }
    }
  })
})

describe('repertorio de combate', () => {
  it('lleva la escalera de sus tipos hasta su nivel, sin pasar de su rareza', () => {
    for (const sp of ladderSpecies) {
      const rank = RARITY_ORDER.indexOf(rarityOf(sp))
      const reachable = sp.types.flatMap((t) => COMBAT_LADDERS[t].filter((s) => !s.minRarity || RARITY_ORDER.indexOf(s.minRarity) <= rank))
      const own = COMBAT_SPECIES_MOVES[sp.id] ?? []
      expect(ids(combatRepertoire(sp.id, MAX_LEVEL))).toEqual([...new Set([...reachable, ...own].map((s) => s.move.id))].sort())
    }
  })

  it.each(RARITY_ORDER)('un %s no llega a peldaños de una rareza mayor', (rarity) => {
    const id = speciesOfRarity(rarity)
    const above = RARITY_ORDER.slice(RARITY_ORDER.indexOf(rarity) + 1)
    const blocked = species(id).types.flatMap((t) => COMBAT_LADDERS[t].filter((s) => s.minRarity && above.includes(s.minRarity)))
    const known = ids(combatRepertoire(id, MAX_LEVEL))
    for (const step of blocked) expect(known).not.toContain(step.move.id)
  })

  it('aprende cada ataque desde su nivel y no olvida ninguno al subir', () => {
    const id = speciesOfRarity(Rarity.Legendary)
    for (let level = 1; level < MAX_LEVEL; level++) {
      const now = ids(combatRepertoire(id, level))
      expect(ids(combatRepertoire(id, level + 1))).toEqual(expect.arrayContaining(now))
    }
    for (const step of combatLearnTimeline(id)) {
      expect(ids(combatRepertoire(id, step.from))).toContain(step.move.id)
      if (step.from > 1) expect(ids(combatRepertoire(id, step.from - 1))).not.toContain(step.move.id)
    }
  })

  it('un repertorio a mano sustituye a la escalera; los propios de su especie se suman', () => {
    const id = ladderSpecies[0].id
    const [first, second] = Object.values(COMBAT_LADDERS).flat().filter((s) => !species(id).types.includes(s.move.type))
    COMBAT_SPECIES_MOVES[id] = [{ move: first.move, level: 1 }]
    expect(ids(combatRepertoire(id, 1))).toContain(first.move.id)
    COMBAT_MOVESETS[id] = [{ move: second.move, level: 1 }]
    expect(ids(combatRepertoire(id, MAX_LEVEL))).toEqual([second.move.id])
  })

  it('no toca el repertorio de las incursiones', () => {
    const id = ladderSpecies[0].id
    const before = ids(repertoire(id, MAX_LEVEL))
    COMBAT_MOVESETS[id] = [{ move: Object.values(COMBAT_LADDERS).flat()[0].move, level: 1 }]
    expect(ids(repertoire(id, MAX_LEVEL))).toEqual(before)
  })
})

describe('ajustes de combate', () => {
  it('cambian el ataque en combate y lo dejan igual en las incursiones', () => {
    for (const [id, tuning] of Object.entries(COMBAT_TUNING)) {
      expect(combatMove(id)).toMatchObject(tuning!)
      expect(incursionMove(id)).not.toMatchObject(tuning!)
    }
  })
})

describe('ataques de ruta y torre', () => {
  /** Una especie de escalera que sabe más de los que caben, y ataques de daño de otros tipos para ponerle a mano */
  const crowded = () => {
    const sp = ladderSpecies.find((s) => combatRepertoire(s.id, MAX_LEVEL).length > ROUTE_MOVE_SLOTS)!
    const [extra, other] = Object.values(COMBAT_LADDERS).flat().filter((s) => !sp.types.includes(s.move.type))
    return { mon: { speciesId: sp.id, level: MAX_LEVEL, tmMoves: [] as Tm[] }, extra: extra.move.id, other: other.move.id }
  }

  it('lleva como mucho los que caben: de su escalera, los aprendidos más tarde', () => {
    const { mon } = crowded()
    const byLevel = [...combatLearnTimeline(mon.speciesId)].sort((a, b) => b.from - a.from)
    expect(ids(routeMoveChoices(mon))).toEqual(ids(byLevel.slice(0, ROUTE_MOVE_SLOTS).map((step) => step.move)))
  })

  it('los puestos a mano para su especie van primero, aunque se aprendan antes; luego los de MT', () => {
    const { mon, extra, other } = crowded()
    COMBAT_SPECIES_MOVES[mon.speciesId] = [{ move: incursionMove(extra), level: 1 }]
    const taught = { ...mon, tmMoves: [other as Tm] }
    expect(routeMoveChoices(taught).map((mv) => mv.id)).toEqual([extra, other].slice(0, ROUTE_MOVE_SLOTS))
    expect(routeMoveChoices(mon)[0].id).toBe(extra)
  })
})

describe('MTs en combate', () => {
  it('se pueden llevar las de daño aprendidas (el servidor las acepta para quien pueda aprenderlas); las demás, no', () => {
    for (const tm of TM_IDS) {
      const sp = SPECIES.find((s) => s.types.some((t) => TMS[tm].types.includes(t)) && !combatRepertoire(s.id, MAX_LEVEL).some((mv) => mv.id === tm))!
      const mon = { speciesId: sp.id, level: MAX_LEVEL, tmMoves: [tm] }
      const strike = moveClass(combatMove(tm)) === MoveClass.Damage
      expect(knowsCombatMove(mon, tm)).toBe(strike)
      expect(mayKnowCombatMove(mon.speciesId, mon.level, tm)).toBe(strike)
      expect(ids(combatMoveChoices(mon)).includes(tm)).toBe(strike)
      expect(knowsCombatMove({ ...mon, tmMoves: [] }, tm)).toBe(false)
    }
  })
})
