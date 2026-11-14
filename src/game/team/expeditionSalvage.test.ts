import { describe, expect, it, vi } from 'vitest'
import { allRoutes, route, RouteId } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { initialState, type Expedition, type GameState } from '../core/state'
import { chooseStarter, testExpedition } from '../core/test-utils'
import { collectExpedition, EXPEDITION_DURATIONS, expeditionTerms } from './expedition'
import { ExpeditionFocus } from './expeditionFocus'
import { repairExpeditions } from './expeditionSalvage'
import { createMon } from './mons'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))

const DURATION = EXPEDITION_DURATIONS[0]
const GONE = 'ruta-quitada'
const wildRoutes = () => allRoutes().filter((r) => r.encounters.length > 0)

function withMon(): { s: GameState; uid: string } {
  const s = initialState()
  chooseStarter(s, POKEMON.Bulbasaur)
  return { s, uid: s.owned[0].uid }
}

/** Una expedición tal como podría venir de una partida antigua: sin condiciones guardadas */
function oldExpedition(uid: string, routeId: string, fields: Record<string, unknown> = {}): Expedition {
  const { terms: _, ...e } = testExpedition(uid, RouteId.PuebloPaleta, { durationMin: DURATION })
  return { ...e, routeId, ...fields } as Expedition
}

describe('expediciones al cargar la partida', () => {
  it('las que ya tienen sus condiciones se quedan tal cual', () => {
    const { s, uid } = withMon()
    const e = testExpedition(uid, RouteId.PuebloPaleta, { elapsedMin: 1 })
    s.expeditions.push(structuredClone(e))
    repairExpeditions(s)
    expect(s.expeditions).toEqual([e])
  })

  it('las de antes de guardar sus condiciones toman las de su ruta', () => {
    const { s, uid } = withMon()
    s.expeditions.push(oldExpedition(uid, RouteId.Ruta1))
    repairExpeditions(s)
    expect(s.expeditions[0].terms).toEqual(expeditionTerms(route(RouteId.Ruta1), DURATION, ExpeditionFocus.Exp))
  })

  it('a una ruta quitada, siguen con la más avanzada que haya completado el jugador y se pueden terminar', () => {
    const { s, uid } = withMon()
    const [easy, hard] = [...wildRoutes()].sort((a, b) => a.levels[1] - b.levels[1]).slice(-2)
    s.completedRoutes.push(easy.id, hard.id)
    s.expeditions.push(oldExpedition(uid, GONE, { elapsedMin: DURATION }))
    repairExpeditions(s)
    expect(s.expeditions).toMatchObject([{ routeId: GONE, terms: { routeName: hard.name, levels: hard.levels } }])
    expect(collectExpedition(s, uid)).not.toBeNull()
  })

  it('sin rutas completadas, la ruta quitada se sustituye por la primera con salvajes', () => {
    const { s, uid } = withMon()
    s.expeditions.push(oldExpedition(uid, GONE))
    repairExpeditions(s)
    expect(s.expeditions[0].terms.routeName).toBe(wildRoutes()[0].name)
  })

  it('una ruta sin salvajes (gimnasio) tampoco la deja a medias', () => {
    const { s, uid } = withMon()
    s.expeditions.push(oldExpedition(uid, RouteId.GimnasioPlateada))
    repairExpeditions(s)
    expect(s.expeditions[0].terms.encounters.length).toBeGreaterThan(0)
  })

  it('unas condiciones que ya no valen (un salvaje que no existe) se rehacen con las de su ruta', () => {
    const { s, uid } = withMon()
    const e = testExpedition(uid, RouteId.PuebloPaleta)
    e.terms.encounters = [{ speciesId: -1, chance: 100 }]
    s.expeditions.push(e)
    repairExpeditions(s)
    expect(s.expeditions[0].terms).toEqual(testExpedition(uid, RouteId.PuebloPaleta).terms)
  })

  it('un enfoque que ya no existe pasa a EXP y el tiempo no se pasa de la duración', () => {
    const { s, uid } = withMon()
    s.expeditions.push(oldExpedition(uid, RouteId.PuebloPaleta, { focus: 'nada', elapsedMin: DURATION * 2 }))
    repairExpeditions(s)
    expect(s.expeditions[0]).toMatchObject({ focus: ExpeditionFocus.Exp, elapsedMin: DURATION })
  })

  it('solo se quitan las ilegibles, las de un Pokémon que ya no está y las repetidas', () => {
    const { s, uid } = withMon()
    const other = createMon(POKEMON.Pidgey, 5)
    s.owned.push(other)
    const good = testExpedition(uid, RouteId.PuebloPaleta)
    s.expeditions.push(good, { ...good }, testExpedition('nadie', RouteId.PuebloPaleta), { ...testExpedition(other.uid, RouteId.PuebloPaleta), durationMin: -1 })
    repairExpeditions(s)
    expect(s.expeditions).toEqual([good])
  })
})
