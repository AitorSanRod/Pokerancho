import { describe, expect, it } from 'vitest'
import { areaAll, EffectKind, effectOf, hitsAllies, incursionMove, move, MoveClass, moveClass, taunt } from '../../data/incursionMoves'
import { CUSTOM_MOVESETS } from '../../data/learnsets'
import { SPECIES } from '../../data/species'
import { seqRng } from '../core/test-utils'
import { battleRoom, member, testIncursion } from './incursion-test-utils'
import { BOT_LEVEL_GAP, BOT_LEVEL_SPREAD, botLevel, botMove, fillWithBots, isBot, PARTY_SIZE } from './party'
import { repertoire } from './repertoire'

const LEVEL = 50
const healer = SPECIES.find((sp) => repertoire(sp.id, LEVEL).some((mv) => moveClass(mv) === MoveClass.Heal))!
const isHeal = (id: string) => moveClass(incursionMove(id)) === MoveClass.Heal
const isTaunt = (id: string) => !!effectOf(incursionMove(id), EffectKind.Taunt)
const taunter = SPECIES.find((sp) => repertoire(sp.id, LEVEL).some((mv) => !!effectOf(mv, EffectKind.Taunt)))!
/** Una especie que ni cura ni provoca */
const striker = SPECIES.find((sp) => repertoire(sp.id, LEVEL).every((mv) => !isHeal(mv.id) && !isTaunt(mv.id)))!

/** Una incursión de entrada [min, max] cuyo rival más alto es de nivel `foeTop` */
const leveled = (min: number, max: number, foeTop: number) => ({
  ...testIncursion([battleRoom([{ speciesId: striker.id, level: foeTop, moveIds: [] }])]),
  minLevel: min,
  maxLevel: max,
})

describe('grupo de incursión', () => {
  it('completa el grupo con bots hasta cinco, del nivel de la incursión', () => {
    const inc = testIncursion([])
    const party = fillWithBots(inc, [member('p')], seqRng(0.5))
    expect(party).toHaveLength(PARTY_SIZE)
    expect(new Set(party.map((m) => m.id)).size).toBe(PARTY_SIZE)
    expect(party.slice(1).every((m) => isBot(m.id))).toBe(true)
    expect(isBot(party[0].id)).toBe(false)
    for (const bot of party.slice(1)) expect(bot.level).toBeGreaterThanOrEqual(inc.minLevel)
  })

  it('los bots no pasan del nivel máximo de la incursión', () => {
    const inc = { ...testIncursion([]), minLevel: 10, maxLevel: 10 }
    for (const bot of fillWithBots(inc, [], seqRng(0.99))) expect(bot.level).toBe(inc.maxLevel)
  })

  it('los bots llegan algo por debajo del Pokémon más alto del grupo', () => {
    const top = 40
    const inc = leveled(10, 60, 60)
    for (let r = 0; r < 1; r += 0.1) {
      const level = botLevel(inc, [member('a', undefined, undefined, top), member('b', undefined, undefined, top - 10)], seqRng(r))
      expect(level).toBeLessThanOrEqual(top - BOT_LEVEL_GAP)
      expect(level).toBeGreaterThanOrEqual(top - BOT_LEVEL_GAP - BOT_LEVEL_SPREAD)
    }
  })

  it('los bots no pasan del rival más alto de la incursión aunque se pueda entrar con más nivel, ni bajan del mínimo', () => {
    const inc = leveled(20, 45, 30)
    expect(botLevel(inc, [member('a', undefined, undefined, 45)], seqRng(0))).toBe(30)
    expect(botLevel(inc, [member('a', undefined, undefined, 20)], seqRng(0.99))).toBe(inc.minLevel)
  })

  it('si nadie cura ni provoca, los bots traen quien cure y quien provoque', () => {
    const inc = { ...leveled(LEVEL, LEVEL, LEVEL), bots: [striker.id, healer.id, taunter.id] }
    const party = fillWithBots(inc, [member('p', undefined, striker.id, LEVEL + BOT_LEVEL_GAP)], seqRng(0.5))
    expect(party.some((m) => isHeal(m.moveId))).toBe(true)
    expect(party.some((m) => isTaunt(m.moveId))).toBe(true)
  })

  it('un bot cura si nadie cura; si ya hay quien cure, hace otra cosa', () => {
    expect(isHeal(botMove(healer.id, LEVEL, []))).toBe(true)
    const heal = repertoire(healer.id, LEVEL).find((mv) => moveClass(mv) === MoveClass.Heal)!
    expect(isHeal(botMove(healer.id, LEVEL, [heal]))).toBe(false)
  })

  it('sin papel que cubrir, usa su golpe más fuerte', () => {
    const heal = repertoire(healer.id, LEVEL).find((mv) => moveClass(mv) === MoveClass.Heal)!
    const tank = { ...heal, effects: [taunt(0)] }
    const chosen = incursionMove(botMove(healer.id, LEVEL, [heal, tank]))
    const clean = repertoire(healer.id, LEVEL).filter((mv) => moveClass(mv) === MoveClass.Damage && !hitsAllies(mv))
    const strongest = Math.max(...clean.map((mv) => mv.power))
    expect(moveClass(chosen)).toBe(MoveClass.Damage)
    expect(chosen.power).toBe(strongest)
    expect(effectOf(chosen, EffectKind.Taunt)).toBeUndefined()
  })

  it('no usa uno que dé también a su grupo si tiene otro de daño, aunque pegue menos', () => {
    const id = striker.id
    const friendly = move('prueba-terremoto', 'Terremoto', 'ground', 100, [areaAll()])
    const weak = move('prueba-placaje', 'Placaje', 'normal', 40)
    CUSTOM_MOVESETS[id] = [{ move: friendly, level: 1 }, { move: weak, level: 1 }]
    try {
      expect(botMove(id, LEVEL, [])).toBe(weak.id)
      CUSTOM_MOVESETS[id] = [{ move: friendly, level: 1 }]
      expect(botMove(id, LEVEL, [])).toBe(friendly.id)
    } finally {
      delete CUSTOM_MOVESETS[id]
    }
  })
})
