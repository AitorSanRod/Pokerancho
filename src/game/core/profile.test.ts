import { describe, expect, it, vi } from 'vitest'
import { BADGE_IDS } from '../../data/badges'
import { KANTO } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { earnBadge } from '../collection/badges'
import { profileStats } from './profile'
import { initialState } from './state'
import { chooseStarter } from './test-utils'

vi.mock('../../data/maps/kantoMaps', () => import('./test-map'))

describe('perfil', () => {
  it('resume colección, rutas, medallas y torre', () => {
    const s = initialState()
    chooseStarter(s, POKEMON.Bulbasaur)
    s.owned[0].shiny = true
    s.completedRoutes.push(KANTO.routes[0].id)
    earnBadge(s, BADGE_IDS[0])
    s.towerBest = 12
    const p = profileStats(s, s.lastTick)
    expect(p).toMatchObject({ owned: 1, shiny: 1, routes: { completed: 1, total: KANTO.routes.length }, badges: { earned: 1, total: BADGE_IDS.length } })
    expect(p.tower.best).toBe(12)
    expect(p.caught).toBe(s.caught.length)
    expect(p.seen).toBeGreaterThanOrEqual(p.caught)
  })
})
