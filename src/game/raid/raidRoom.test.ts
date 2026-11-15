import { describe, expect, it } from 'vitest'
import { isBot } from '../incursion/party'
import { RaidRotation } from './online/protocol'
import { entrant } from './raid-test-utils'
import { fightDue, roomMembers, startFight } from './raidLobby'
import { newRoom, RAID_ROOM_SIZE, roomFull, seatEntrant, unseat } from './raidRoom'
import { fightStart } from './raidSchedule'

const CYCLE = 2
const room = () => newRoom('sala', RaidRotation.Ordered, CYCLE, 99)

describe('sala abierta', () => {
  it('sienta a cada Pokémon una vez y lo cambia si vuelve con otro ataque o lo sustituye otro', () => {
    const r = room()
    expect(seatEntrant(r, entrant('a'))).toBe(true)
    expect(seatEntrant(r, entrant('a', 60))).toBe(true)
    expect(r.entrants.map((e) => e.member.level)).toEqual([60])
    seatEntrant(r, entrant('b'), 'a')
    expect(r.entrants.map((e) => e.member.id)).toEqual(['b'])
  })

  it('no admite más jugadores que sitios', () => {
    const r = room()
    for (let i = 0; i < RAID_ROOM_SIZE; i++) seatEntrant(r, entrant(`p${i}`))
    expect(roomFull(r)).toBe(true)
    expect(seatEntrant(r, entrant('otro'))).toBe(false)
  })

  it('se puede salir mientras está abierta', () => {
    const r = room()
    seatEntrant(r, entrant('a'))
    expect(unseat(r, 'a')).toBe(true)
    expect(r.entrants).toEqual([])
  })
})

describe('empezar la pelea', () => {
  it('a su hora, con los jugadores primero y bots hasta llenar la sala; ya no se entra ni se sale', () => {
    const r = room()
    seatEntrant(r, entrant('a'))
    expect(fightDue(r, fightStart(CYCLE) - 1)).toBe(false)
    expect(fightDue(r, fightStart(CYCLE))).toBe(true)
    startFight(r)
    const members = r.fight!.members
    expect(members).toHaveLength(RAID_ROOM_SIZE)
    expect(members[0].id).toBe('a')
    expect(members.slice(1).every((m) => isBot(m.id))).toBe(true)
    expect(r.fight!.legStarts).toEqual([fightStart(CYCLE)])
    expect(roomMembers(r, fightStart(CYCLE))).toBe(members)
    expect(seatEntrant(r, entrant('b'))).toBe(false)
    expect(unseat(r, 'a')).toBe(false)
  })
})
