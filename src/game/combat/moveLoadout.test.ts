import { describe, expect, it } from 'vitest'
import { SPECIES } from '../../data/species'
import { IncursionId } from '../../data/incursions'
import { RouteId } from '../../data/maps/mapCommon'
import { initialState } from '../core/state'
import { chooseStarter, testExpedition } from '../core/test-utils'
import { createMon } from '../team/mons'
import { MAX_LEVEL } from '../team/stats'
import { equipMove, equippedMoves, learnedFrom, loadoutBlocker, MoveSection, SECTION_SLOTS, slotOptions, speciesMoveList } from './moveLoadout'

const ids = (moves: { id: string }[]) => moves.map((mv) => mv.id)
const SECTIONS = Object.values(MoveSection)

/** Una especie que tiene para elegir más de los que caben en las dos secciones */
const rich = SPECIES.find((sp) => SECTIONS.every((sec) => slotOptions(createMon(sp.id, MAX_LEVEL), sec).open.length > 0))!

function withMon() {
  const s = initialState()
  chooseStarter(s, rich.id)
  const mon = s.owned[0]
  mon.level = MAX_LEVEL
  return { s, mon }
}

describe.each(SECTIONS)('equipar ataques (%s)', (section) => {
  it('pone el elegido en su hueco, deja el resto y la sección pasa a ser a mano', () => {
    const { s, mon } = withMon()
    const before = ids(equippedMoves(mon, section))
    const [pick] = slotOptions(mon, section).open
    expect(equipMove(s, mon.uid, section, 0, pick.id)).toBe(true)
    expect(ids(equippedMoves(mon, section))).toEqual([pick.id, ...before.slice(1)])
    expect(section === MoveSection.Route ? mon.routeMoves : mon.incursionMoves).toEqual([pick.id, ...before.slice(1)])
  })

  it('los ya puestos no se ofrecen para poner; salen aparte', () => {
    const { mon } = withMon()
    const { open, equipped } = slotOptions(mon, section)
    expect(ids(equipped)).toEqual(ids(equippedMoves(mon, section)))
    for (const mv of equipped) expect(ids(open)).not.toContain(mv.id)
  })

  it('lo que aprenderá después no sale también entre los que ya puede poner', () => {
    const { mon } = withMon()
    mon.level = 1
    const { open, equipped, later } = slotOptions(mon, section)
    for (const f of later) expect([...ids(open), ...ids(equipped)]).not.toContain(f.move.id)
  })

  it('no pone uno que no puede elegir ni en un hueco que no existe', () => {
    const { s, mon } = withMon()
    const [pick] = slotOptions(mon, section).open
    const [held] = equippedMoves(mon, section)
    expect(equipMove(s, mon.uid, section, 0, held.id)).toBe(false)
    expect(equipMove(s, mon.uid, section, 0, 'no-existe')).toBe(false)
    expect(equipMove(s, mon.uid, section, SECTION_SLOTS[section], pick.id)).toBe(false)
    expect(equipMove(s, mon.uid, section, -1, pick.id)).toBe(false)
  })

  it('con el Pokémon fuera no se cambian', () => {
    const { s, mon } = withMon()
    s.expeditions.push(testExpedition(mon.uid, RouteId.PuebloPaleta))
    expect(loadoutBlocker(s, mon.uid)).not.toBeNull()
    expect(equipMove(s, mon.uid, section, 0, slotOptions(mon, section).open[0].id)).toBe(false)
  })
})

describe('equipar en el checkin de una incursión programada', () => {
  const checkin = (uid: string, moveId: string, locked: boolean) => ({
    scheduleId: 'x',
    incursionId: Object.values(IncursionId)[0],
    startAt: 0,
    uid,
    moveId,
    locked,
  })

  it('se puede cambiar, y si quita el ataque marcado, marca el primero', () => {
    const { s, mon } = withMon()
    const [first] = equippedMoves(mon, MoveSection.Incursion)
    s.incursionCheckin = checkin(mon.uid, first.id, false)
    expect(loadoutBlocker(s, mon.uid)).toBeNull()
    const [pick] = slotOptions(mon, MoveSection.Incursion).open
    expect(equipMove(s, mon.uid, MoveSection.Incursion, 0, pick.id)).toBe(true)
    expect(s.incursionCheckin.moveId).toBe(pick.id)
  })

  it('ya fijado, el hueco del ataque con el que entra no se cambia; los demás, sí', () => {
    const { s, mon } = withMon()
    const [first] = equippedMoves(mon, MoveSection.Incursion)
    s.incursionCheckin = checkin(mon.uid, first.id, true)
    const [pick] = slotOptions(mon, MoveSection.Incursion).open
    expect(equipMove(s, mon.uid, MoveSection.Incursion, 0, pick.id)).toBe(false)
    expect(equipMove(s, mon.uid, MoveSection.Incursion, 1, pick.id)).toBe(true)
  })
})

describe('lista de la Pokédex', () => {
  it('sin repetir, por orden de nivel, con todo lo que puede elegir a nivel máximo (salvo MTs)', () => {
    for (const section of SECTIONS) {
      const list = speciesMoveList(rich.id, section)
      expect(new Set(ids(list.map((m) => m.move))).size).toBe(list.length)
      expect(list.map((m) => m.level)).toEqual([...list.map((m) => m.level)].sort((a, b) => a - b))
      const { open, equipped } = slotOptions(createMon(rich.id, MAX_LEVEL), section)
      expect(ids(list.map((m) => m.move))).toEqual(expect.arrayContaining(ids([...open, ...equipped])))
    }
  })
})

describe('de dónde sale cada ataque', () => {
  it('lo de su repertorio, desde su nivel; lo demás (MT), sin nivel', () => {
    for (const section of SECTIONS) {
      for (const mv of slotOptions(createMon(rich.id, MAX_LEVEL), section).open) expect(learnedFrom(rich.id, section, mv.id)).toBeLessThanOrEqual(MAX_LEVEL)
    }
    expect(learnedFrom(rich.id, MoveSection.Route, 'no-existe')).toBeNull()
  })
})
