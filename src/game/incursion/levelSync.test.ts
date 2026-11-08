import { describe, expect, it } from 'vitest'
import { foeLevel, incursionLevel, LEVEL_SYNC_KEEP, syncedLevel } from './levelSync'
import { testIncursion } from './incursion-test-utils'

const LOW = 15
const HIGH = 30
const inc = { ...testIncursion([]), levels: [LOW, HIGH] as [number, number] }

describe('nivel de la incursión', () => {
  it('es el del Pokémon más alto del grupo dentro de la franja', () => {
    expect(incursionLevel(inc, [LOW + 1, LOW + 3, LOW + 2])).toBe(LOW + 3)
  })

  it('no pasa del máximo ni baja del mínimo de la franja', () => {
    expect(incursionLevel(inc, [HIGH + 10, LOW])).toBe(HIGH)
    expect(incursionLevel(inc, [LOW - 5])).toBe(LOW)
  })

  it('los rivales van a su diferencia sobre ese nivel', () => {
    expect(foeLevel({ speciesId: 1, levelDelta: 3, moveId: '' }, HIGH)).toBe(HIGH + 3)
  })
})

describe('nivel sincronizado', () => {
  it('acerca a todos al nivel de la incursión, conservando parte de su diferencia', () => {
    const gap = 10
    expect(syncedLevel(HIGH + gap, HIGH)).toBe(Math.round(HIGH + gap * LEVEL_SYNC_KEEP))
    expect(syncedLevel(HIGH - gap, HIGH)).toBe(Math.round(HIGH - gap * LEVEL_SYNC_KEEP))
  })

  it('el de más nivel sigue luchando por encima del de menos', () => {
    expect(syncedLevel(HIGH + 20, HIGH)).toBeGreaterThan(syncedLevel(HIGH, HIGH))
    expect(syncedLevel(HIGH, HIGH)).toBeGreaterThan(syncedLevel(HIGH - 20, HIGH))
  })
})
