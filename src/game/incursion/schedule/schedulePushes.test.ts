import { describe, expect, it, vi } from 'vitest'
import { PushTopic } from '../../core/push'
import { joiner, newSchedule, NOW } from './schedule-test-utils'
import { joinSchedule } from './scheduledIncursion'
import { cancelPush, newSchedulePush, PushGo, pushGoOf, roomOpenPush } from './schedulePushes'
import { checkInOpensAt } from './scheduleRules'

vi.mock('../../../data/incursions', () => import('../incursion-test-mock'))

describe('avisos de incursiones programadas', () => {
  it('la nueva va a todos menos al creador y lleva al tablón', () => {
    const push = newSchedulePush(newSchedule(), NOW)
    expect(push).toMatchObject({ to: 'all', except: 'jugador-0', job: { topic: PushTopic.Incursion, dueAt: NOW } })
    expect(pushGoOf(push.job.topic, push.job.key)).toBe(PushGo.Board)
  })

  it('el de la sala llega al abrirse y lleva a «Mis incursiones»', () => {
    const sched = newSchedule()
    const push = roomOpenPush(sched, 'jugador-1')
    expect(push).toMatchObject({ to: { playerIds: ['jugador-1'] }, job: { dueAt: checkInOpensAt(sched.startAt) } })
    expect(pushGoOf(push.job.topic, push.job.key)).toBe(PushGo.Mine)
  })

  it('la cancelación avisa a los demás apuntados', () => {
    const sched = newSchedule()
    joinSchedule(sched, joiner(1), [], NOW)
    expect(cancelPush(sched, NOW)).toMatchObject({ to: { playerIds: ['jugador-0', 'jugador-1'] }, except: 'jugador-0' })
  })

  it('los avisos de otros temas no llevan a ningún sitio', () => {
    expect(pushGoOf(PushTopic.Raid, 'incursion-new:x')).toBeNull()
  })
})
