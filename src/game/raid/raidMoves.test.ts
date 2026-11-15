import { describe, expect, it } from 'vitest'
import { hitsAllies, incursionMove, moveClass, MoveClass, type IncursionMove } from '../../data/incursionMoves'
import { SPECIES } from '../../data/species'
import { monRepertoire } from '../incursion/repertoire'
import { RAID_BOT_HEALERS, raidBotMove, raidMoveAllowed, raidMoveChoices, RAID_DAMAGE_ONLY } from './raidMoves'

const LEVEL = 50
const mons = SPECIES.map((sp) => ({ speciesId: sp.id, level: LEVEL, tmMoves: [] }))

describe('ataques de la raid', () => {
  it('solo se eligen los de daño mientras RAID_DAMAGE_ONLY esté activo', () => {
    for (const mon of mons) {
      const choices = raidMoveChoices(mon)
      if (RAID_DAMAGE_ONLY) expect(choices.every((mv) => moveClass(mv) === MoveClass.Damage)).toBe(true)
      else expect(choices).toEqual(monRepertoire(mon))
      for (const mv of choices) expect(raidMoveAllowed(mv.id)).toBe(true)
    }
  })

  it('los bots curan si pueden hasta RAID_BOT_HEALERS; los demás, un golpe que no da a su grupo', () => {
    if (!RAID_DAMAGE_ONLY) return
    const isHeal = (mv: IncursionMove) => moveClass(mv) === MoveClass.Heal
    const healer = mons.find((mon) => monRepertoire(mon).some(isHeal))!
    const heal = monRepertoire(healer).find(isHeal)!
    expect(raidBotMove(healer.speciesId, LEVEL, [])).toBe(heal.id)
    const full = Array.from({ length: RAID_BOT_HEALERS }, () => heal)
    for (const mon of mons) {
      const move = incursionMove(raidBotMove(mon.speciesId, LEVEL, full))
      const strikes = monRepertoire(mon).filter((mv) => moveClass(mv) === MoveClass.Damage && !hitsAllies(mv))
      if (strikes.length) expect(strikes.map((mv) => mv.id)).toContain(move.id)
    }
  })
})
