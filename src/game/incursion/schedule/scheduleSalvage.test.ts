import { describe, expect, it, vi } from 'vitest'
import { IncursionId } from '../../../data/incursions'
import { POKEMON } from '../../../data/pokemon'
import { migrateSave } from '../../core/saveMigration'
import { initialState, SAVE_VERSION } from '../../core/state'
import { createMon } from '../../team/mons'
import type { HeldBond } from './linkedSchedule'

vi.mock('../../../data/maps/kantoMaps', () => import('../../core/test-map'))

const bond = (extra: Partial<HeldBond> = {}): HeldBond => ({ scheduleId: 'abcdef12', incursionId: IncursionId.CuevaHelada, startAt: 1000, amount: 300, refunded: false, ...extra })

/** Una partida de la versión anterior con estos campos */
function oldSave(extra: Record<string, unknown>) {
  const s = initialState()
  s.owned.push(createMon(POKEMON.Snorlax, 25, 0))
  s.money = 1000
  return { ...JSON.parse(JSON.stringify(s)), version: SAVE_VERSION - 1, ...extra }
}

describe('fianzas y checkin al actualizar', () => {
  it('una búsqueda de grupo guardada desaparece sin gastar la llave', () => {
    const save = oldSave({ incursionQueue: { incursionId: IncursionId.CuevaHelada, uid: 'x', moveId: 'y', since: 0 }, incursionKeys: { [IncursionId.CuevaHelada]: 2 } })
    const s = migrateSave(save)!
    expect(s).not.toHaveProperty('incursionQueue')
    expect(s.incursionKeys[IncursionId.CuevaHelada]).toBe(2)
    expect(s.incursionBonds).toEqual([])
    expect(s.incursionCheckin).toBeNull()
  })

  it('las fianzas que encajan siguen, sin repetir', () => {
    const s = migrateSave(oldSave({ incursionBonds: [bond(), bond(), { roto: true }] }))!
    expect(s.incursionBonds).toEqual([bond()])
    expect(s.money).toBe(1000)
  })

  it('la fianza de una incursión que ya no existe vuelve al dinero', () => {
    const s = migrateSave(oldSave({ incursionBonds: [bond({ incursionId: 'quitada' as IncursionId })] }))!
    expect(s.incursionBonds).toEqual([])
    expect(s.money).toBe(1000 + bond().amount)
  })

  it('una fianza ya devuelta de una incursión que no existe no se devuelve otra vez', () => {
    const s = migrateSave(oldSave({ incursionBonds: [bond({ incursionId: 'quitada' as IncursionId, refunded: true })] }))!
    expect(s.money).toBe(1000)
  })

  it('el checkin de una versión anterior no sigue (cambia con esta versión)', () => {
    const checkin = { scheduleId: 'abcdef12', incursionId: IncursionId.CuevaHelada, startAt: 1000, uid: null, moveId: null, locked: false }
    expect(migrateSave(oldSave({ incursionCheckin: checkin }))!.incursionCheckin).toBeNull()
  })
})
