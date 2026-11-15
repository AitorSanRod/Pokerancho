import { describe, expect, it } from 'vitest'
import { PushTopic } from '../../core/push'
import { newRoom } from '../raidRoom'
import { fightStart } from '../raidSchedule'
import { RaidRotation } from './protocol'
import { startPush } from './raidPushes'

describe('avisos de raids', () => {
  it('al entrar en la sala se avisa al jugador para cuando empiece la pelea', () => {
    const room = newRoom('tab/ordered/4/a', RaidRotation.Ordered, 4, 1)
    const push = startPush(room, 'p1')
    expect(push.to).toEqual({ playerIds: ['p1'] })
    expect(push.job).toMatchObject({ topic: PushTopic.Raid, dueAt: fightStart(4) })
  })
})
