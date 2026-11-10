import { describe, expect, it } from 'vitest'
import { SPECIES } from '../../data/species'
import { TM_IDS, TMS } from '../../data/tms'
import { initialState } from '../core/state'
import { createMon } from '../team/mons'
import { canLearn, monKnows, monRepertoire, repertoire } from './repertoire'
import { addTms, mayKnow, teachableTms, teachTm, tmFits, tmsOf } from './tms'

const [tm] = TM_IDS
const LEVEL = 1
const fits = (speciesId: number) => tmFits(speciesId, tm)
/** Una especie que puede aprender la MT y no la sabe por nivel, y otra que no puede */
const learner = SPECIES.find((sp) => fits(sp.id) && !canLearn(sp.id, LEVEL, tm))!
const outsider = SPECIES.find((sp) => !fits(sp.id))!

function withMon(speciesId: number, tms = 1) {
  const s = initialState()
  const mon = createMon(speciesId, LEVEL)
  s.owned.push(mon)
  addTms(s, tm, tms)
  return { s, mon }
}

describe('MTs', () => {
  it('la aprenden los Pokémon que tienen alguno de sus tipos', () => {
    expect(learner.types.some((t) => TMS[tm].types.includes(t))).toBe(true)
    expect(outsider.types.some((t) => TMS[tm].types.includes(t))).toBe(false)
  })

  it('enseñarla gasta la MT y el Pokémon sabe su ataque para siempre, a cualquier nivel', () => {
    const { s, mon } = withMon(learner.id)
    expect(teachTm(s, mon.uid, tm)).toBe(true)
    expect(tmsOf(s, tm)).toBe(0)
    expect(monKnows(mon, tm)).toBe(true)
    expect(monRepertoire(mon)).toEqual([...repertoire(mon.speciesId, mon.level), TMS[tm].move])
  })

  it('no se enseña sin tenerla, a quien no puede aprenderla ni a quien ya la sabe', () => {
    const none = withMon(learner.id, 0)
    expect(teachTm(none.s, none.mon.uid, tm)).toBe(false)
    const other = withMon(outsider.id)
    expect(teachableTms(other.s, other.mon)).toEqual([])
    expect(teachTm(other.s, other.mon.uid, tm)).toBe(false)
    const { s, mon } = withMon(learner.id, 2)
    teachTm(s, mon.uid, tm)
    expect(teachableTms(s, mon)).toEqual([])
    expect(teachTm(s, mon.uid, tm)).toBe(false)
    expect(tmsOf(s, tm)).toBe(1)
  })

  it('el servidor acepta el ataque de una MT en quien podría aprenderla', () => {
    expect(mayKnow(learner.id, LEVEL, tm)).toBe(true)
    expect(mayKnow(outsider.id, LEVEL, tm)).toBe(canLearn(outsider.id, LEVEL, tm))
  })
})
