import { describe, expect, it } from 'vitest'
import { CATALOG_BY_TYPE, DAMAGE_MOVES, IMOVE, SUPPORT_MOVES } from '..'
import { boostedAccuracy, CATALOG_ACCURACY_BONUS, CATALOG_ACCURACY_BONUS_AT_90 } from './catalogMove'

describe('catálogo de ataques de incursión', () => {
  it('a la precisión de los juegos le suma la mejora (otra si tenía justo 90), sin pasar de 100', () => {
    expect(boostedAccuracy(70)).toBe(70 + CATALOG_ACCURACY_BONUS)
    expect(boostedAccuracy(90)).toBe(90 + CATALOG_ACCURACY_BONUS_AT_90)
    expect(boostedAccuracy(100)).toBe(100)
    expect(boostedAccuracy(100 - CATALOG_ACCURACY_BONUS / 2)).toBe(100)
  })

  it('ninguna clave pisa a otra: IMOVE tiene todos los ataques de cada lista', () => {
    const lists = [DAMAGE_MOVES, SUPPORT_MOVES, ...CATALOG_BY_TYPE]
    expect(Object.keys(IMOVE).length).toBe(lists.reduce((n, list) => n + Object.keys(list).length, 0))
  })

  it('en cada fichero del catálogo todos son del mismo tipo', () => {
    for (const list of CATALOG_BY_TYPE) expect(new Set(Object.values(list).map((mv) => mv.type)).size).toBe(1)
  })
})
