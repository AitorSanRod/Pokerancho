import { afterEach, describe, expect, it, vi } from 'vitest'
import { IncursionId } from '../../data/incursions'
import { RouteId } from '../../data/maps'
import { STARTERS } from '../../data/species'
import { startRun } from '../run/run'
import { CARRIED_SINCE, carriedProgress, type CarriedKey } from './progressCarry'
import { migrateSave } from './saveMigration'
import { initialState, MonPlace, monPlace, SAVE_VERSION } from './state'
import { chooseStarter } from './test-utils'

vi.mock('../../data/maps/kantoMaps', () => import('./test-map'))

const OLD = SAVE_VERSION - 1
const REAL = { ...CARRIED_SINCE }

/** Como si la forma de todo lo que va a medias no hubiera cambiado desde la versión anterior */
const unchangedSinceOld = () => {
  for (const key of Object.keys(CARRIED_SINCE) as CarriedKey[]) CARRIED_SINCE[key] = OLD
}

afterEach(() => Object.assign(CARRIED_SINCE, REAL))

function gameOnRoute() {
  const s = initialState()
  chooseStarter(s, STARTERS[0])
  startRun(s, RouteId.PuebloPaleta)
  return s
}

const fromOld = (s: object) => JSON.parse(JSON.stringify({ ...s, version: OLD }))

describe('lo que estaba a medias al actualizar', () => {
  it('la ruta en curso sigue si su forma no ha cambiado desde la versión guardada', () => {
    unchangedSinceOld()
    const s = gameOnRoute()
    const migrated = migrateSave(fromOld(s))!
    expect(migrated.run).toEqual(s.run)
    expect(monPlace(migrated, migrated.activeUid!)).toBe(MonPlace.Run)
  })

  it('si cambió después de la versión guardada, se pierde y el Pokémon vuelve al rancho', () => {
    const s = gameOnRoute()
    CARRIED_SINCE.run = SAVE_VERSION
    expect(migrateSave(fromOld(s))!.run).toBeNull()
  })

  it('se pierde también si su ruta o alguna parada del camino ya no existe', () => {
    unchangedSinceOld()
    const s = gameOnRoute()
    expect(carriedProgress({ ...fromOld(s), run: { ...s.run, routeId: 'ruta-quitada' } }, OLD)).not.toHaveProperty('run')
    expect(carriedProgress({ ...fromOld(s), run: { ...s.run, path: ['parada-quitada'] } }, OLD)).not.toHaveProperty('run')
  })

  it('la incursión que sigue no devuelve la llave; la de un Pokémon que ya no está no sigue', () => {
    unchangedSinceOld()
    const s = initialState()
    chooseStarter(s, STARTERS[0])
    const uid = s.activeUid!
    const incursion = { incursionId: IncursionId.CuevaHelada, uid }
    const kept = migrateSave({ ...fromOld(s), incursion })!
    expect(kept.incursion).toEqual(incursion)
    expect(kept.incursionKeys[IncursionId.CuevaHelada]).toBeUndefined()
    expect(carriedProgress({ ...fromOld(s), incursion: { ...incursion, uid: 'nadie' } }, OLD)).not.toHaveProperty('incursion')
  })

  it('el multiplicador de tiempo vuelve siempre a x1', () => {
    unchangedSinceOld()
    expect(migrateSave({ ...fromOld(gameOnRoute()), timeScale: 30 })!.timeScale).toBe(1)
  })
})
