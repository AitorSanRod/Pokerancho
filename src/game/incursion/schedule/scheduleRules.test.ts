import { describe, expect, it } from 'vitest'
import {
  bondFor,
  BOND_FRACTION,
  CANCEL_DEADLINE_MS,
  CHECKIN_OPEN_MS,
  isValidSlot,
  leaveDeadline,
  MAX_LEAD_MS,
  MIN_LEAD_MS,
  ScheduleCancel,
  schedulePhase,
  SchedulePhase,
  SLOT_MS,
  validSlots,
} from './scheduleRules'

const NOW = 1000 * SLOT_MS + 1234
const slotAfter = (ms: number) => Math.ceil((NOW + ms) / SLOT_MS) * SLOT_MS

describe('franjas de hora', () => {
  it('vale una franja dentro de la antelación mínima y máxima', () => {
    expect(isValidSlot(slotAfter(MIN_LEAD_MS), NOW)).toBe(true)
    expect(isValidSlot(slotAfter(MIN_LEAD_MS) + 1, NOW)).toBe(false)
  })

  it('no vale demasiado pronto ni demasiado tarde', () => {
    expect(isValidSlot(slotAfter(MIN_LEAD_MS) - SLOT_MS, NOW)).toBe(false)
    expect(isValidSlot(slotAfter(MAX_LEAD_MS) + SLOT_MS, NOW)).toBe(false)
  })

  it('las franjas que se ofrecen son todas válidas, en orden', () => {
    const slots = validSlots(NOW)
    expect(slots.length).toBeGreaterThan(1)
    expect(slots.every((t) => isValidSlot(t, NOW))).toBe(true)
    expect([...slots].sort((a, b) => a - b)).toEqual(slots)
  })
})

describe('fases', () => {
  const start = slotAfter(MAX_LEAD_MS / 2)
  const sched = { startAt: start, cancelledBy: null }

  it('abierta, sin bajas, sala, empezada; el plazo de bajas cuenta desde el comienzo', () => {
    expect(leaveDeadline(start)).toBe(start - CANCEL_DEADLINE_MS)
    expect(schedulePhase(sched, leaveDeadline(start) - 1)).toBe(SchedulePhase.Open)
    expect(schedulePhase(sched, leaveDeadline(start))).toBe(SchedulePhase.Committed)
    expect(schedulePhase(sched, start - CHECKIN_OPEN_MS)).toBe(SchedulePhase.CheckIn)
    expect(schedulePhase(sched, start)).toBe(SchedulePhase.Started)
  })

  it('empezada antes de la hora si ya se formó el grupo', () => {
    expect(schedulePhase({ ...sched, groupId: 'aaaaaaaa' }, start - CHECKIN_OPEN_MS)).toBe(SchedulePhase.Started)
  })

  it('cancelada en cualquier momento', () => {
    expect(schedulePhase({ startAt: start, cancelledBy: ScheduleCancel.Creator }, NOW)).toBe(SchedulePhase.Cancelled)
  })
})

describe('fianza', () => {
  it('es la parte del dinero, hacia abajo', () => {
    expect(bondFor(1000)).toBe(Math.floor(1000 * BOND_FRACTION))
    expect(bondFor(9)).toBe(Math.floor(9 * BOND_FRACTION))
  })

  it('sin dinero no hay fianza', () => {
    expect(bondFor(0)).toBe(0)
  })
})
