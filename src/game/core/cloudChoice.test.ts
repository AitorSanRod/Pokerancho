import { describe, expect, it, vi } from 'vitest'
import { STARTERS } from '../../data/species'
import { isSyncSnapshot, progressSince, recommendedSave, SaveSide, syncSnapshot } from './cloudChoice'
import { initialState } from './state'
import { chooseStarter } from './test-utils'

vi.mock('../../data/maps/kantoMaps', () => import('./test-map'))

function playedGame() {
  const s = initialState()
  chooseStarter(s, STARTERS[0])
  return s
}

describe('progreso desde la última sincronización', () => {
  it('sin cambios desde la instantánea no hay progreso', () => {
    const s = playedGame()
    expect(progressSince(s, syncSnapshot(s))).toBe(false)
  })

  it('un Pokémon que ya no está (vendido o recreado en otro dispositivo) no es progreso', () => {
    const s = playedGame()
    const snapshot = syncSnapshot(s)
    s.owned = []
    expect(progressSince(s, snapshot)).toBe(false)
  })

  it('más nivel, más ★, un Pokémon nuevo o una ruta completada nueva sí lo son', () => {
    const base = playedGame()
    const snapshot = syncSnapshot(base)
    const leveled = structuredClone(base)
    leveled.owned[0].level++
    const starred = structuredClone(base)
    starred.owned[0].stars++
    const newMon = structuredClone(base)
    chooseStarter(newMon, STARTERS[1])
    const route = structuredClone(base)
    route.completedRoutes.push('ruta-nueva')
    for (const s of [leveled, starred, newMon, route]) expect(progressSince(s, snapshot)).toBe(true)
  })

  it('solo se acepta una instantánea con la forma esperada', () => {
    expect(isSyncSnapshot(syncSnapshot(playedGame()))).toBe(true)
    expect(isSyncSnapshot(null)).toBe(false)
    expect(isSyncSnapshot({ mons: { a: [1] }, routes: [] })).toBe(false)
    expect(isSyncSnapshot({ mons: {}, routes: [1] })).toBe(false)
  })
})

describe('partida recomendada', () => {
  it('se recomienda la que se jugó después; con empate, la de la nube', () => {
    expect(recommendedSave(2, 1)).toBe(SaveSide.Cloud)
    expect(recommendedSave(1, 2)).toBe(SaveSide.Local)
    expect(recommendedSave(1, 1)).toBe(SaveSide.Cloud)
  })
})
