import { describe, expect, it } from 'vitest'
import { TOWER_BIOME_EVERY, TOWER_BIOMES, towerBiome } from './towerScenery'

describe('fondo de la torre', () => {
  it('se mantiene unos pisos y luego pasa al siguiente', () => {
    expect(towerBiome(1)).toBe(TOWER_BIOMES[0])
    expect(towerBiome(TOWER_BIOME_EVERY)).toBe(TOWER_BIOMES[0])
    expect(towerBiome(TOWER_BIOME_EVERY + 1)).toBe(TOWER_BIOMES[1])
  })

  it('al acabar la lista vuelve a empezar', () => {
    expect(towerBiome(TOWER_BIOME_EVERY * TOWER_BIOMES.length + 1)).toBe(TOWER_BIOMES[0])
  })
})
