import { describe, expect, it, vi } from 'vitest'
import { route, RouteId } from '../../data/maps'
import { EVOLVING_SPECIES, evolutionsOf } from '../../data/evolutions'
import { STARTERS } from '../../data/species'
import { EXPEDITION_DURATIONS } from '../team/expedition'
import { createMon, NEW_MON_LEVEL } from '../team/mons'
import { RANCH_EXPANSION_SLOTS } from '../team/ranchExpansion'
import { ranchCapacity, usedSlots } from '../team/ranches'
import { CloudAction, cloudAction, cloudUpload, hasUnsavedProgress, isFromNewerApp, parseUpload, saveSummary, stateFromSaved, withEvolutionLines, type CloudSave } from './cloudSave'
import { initialState, SAVE_VERSION, type GameState } from './state'
import { backupTeam } from './teamBackup'
import { ExpeditionFocus } from '../team/expeditionFocus'
import { chooseStarter, readyForExpeditions } from './test-utils'

vi.mock('../../data/maps/kantoMaps', () => import('./test-map'))

const USER = 'user-1'

function playedGame() {
  const s = initialState()
  chooseStarter(s, STARTERS[0])
  return s
}

/** La partida `s` (una copia) tal y como estaría en la nube con la revisión `revision` */
const cloudOf = (s: GameState, revision: number): CloudSave => ({ ...structuredClone(cloudUpload(s)), revision, updatedAt: 0 })

describe('partida en la nube', () => {
  it('sin copia en la nube, se sube la de aquí', () => {
    expect(cloudAction(null, USER, null, playedGame())).toBe(CloudAction.Upload)
  })

  it('si la de aquí ya es de la cuenta: baja la de la nube si otro dispositivo subió después y, si no, sube', () => {
    const local = playedGame()
    const link = { userId: USER, revision: 3 }
    expect(cloudAction(link, USER, cloudOf(local, 4), local)).toBe(CloudAction.Download)
    expect(cloudAction(link, USER, cloudOf(local, 3), local)).toBe(CloudAction.Upload)
  })

  it('no baja sin preguntar una partida de la nube a la que le falta progreso de aquí (jugado sin conexión)', () => {
    const local = playedGame()
    const older = cloudOf(local, 4)
    expect(hasUnsavedProgress(local, older)).toBe(false)
    local.owned[0].level++
    expect(hasUnsavedProgress(local, older)).toBe(true)
    expect(cloudAction({ userId: USER, revision: 3 }, USER, older, local)).toBe(CloudAction.Ask)
    const withNewMon = playedGame()
    const before = cloudOf(withNewMon, 4)
    chooseStarter(withNewMon, STARTERS[1])
    expect(hasUnsavedProgress(withNewMon, before)).toBe(true)
  })

  it('si la de aquí no es de la cuenta: pregunta, salvo que esté sin empezar (entonces baja sin preguntar)', () => {
    const cloud = cloudOf(playedGame(), 1)
    expect(cloudAction(null, USER, cloud, playedGame())).toBe(CloudAction.Ask)
    expect(cloudAction({ userId: 'otra', revision: 9 }, USER, cloud, playedGame())).toBe(CloudAction.Ask)
    expect(cloudAction(null, USER, cloud, initialState())).toBe(CloudAction.Download)
  })

  it('una partida de la nube guardada con una versión más nueva de la app se reconoce (no se carga)', () => {
    const cloud = cloudOf(playedGame(), 1)
    expect(isFromNewerApp(cloud)).toBe(false)
    cloud.save.version = SAVE_VERSION + 1
    expect(isFromNewerApp(cloud)).toBe(true)
  })

  it('una copia de esta versión se recupera tal cual; de otra, se migra sin perder nada (ver saveMigration.test.ts)', () => {
    const s = playedGame()
    s.money = 1234
    const { save, team } = cloudUpload(s)
    expect(stateFromSaved(save, team)).toMatchObject({ money: 1234, owned: [{ speciesId: STARTERS[0] }] })

    const old = stateFromSaved({ ...save, version: SAVE_VERSION - 1 }, team)
    expect(old.money).toBe(1234)
    expect(old.owned.map((m) => m.speciesId)).toEqual([STARTERS[0]])
    expect(stateFromSaved(null, null).owned).toEqual([])
  })

  it('de una partida de otra versión se recuperan el equipo y sus expediciones, aunque la copia del equipo sea vieja', () => {
    const s = playedGame()
    readyForExpeditions(s, RouteId.PuebloPaleta)
    s.expeditions.push({ uid: s.owned[0].uid, routeId: RouteId.PuebloPaleta, durationMin: EXPEDITION_DURATIONS[0], focus: ExpeditionFocus.Exp, elapsedMin: 1 })
    const { expeditions: _, savedAt: __, ...oldTeam } = backupTeam(s)
    const restored = stateFromSaved({ ...s, version: SAVE_VERSION - 1 }, oldTeam)
    expect(restored.owned.map((m) => m.speciesId)).toEqual(s.owned.map((m) => m.speciesId))
    expect(restored.expeditions).toEqual([{ ...s.expeditions[0], uid: restored.owned[0].uid }])
    expect(restored.lastTick).toBe(s.lastTick)
  })

  it('al cargar, se abre la ruta que desbloquea una ya completada (rutas añadidas al mapa después)', () => {
    const s = playedGame()
    s.completedRoutes.push(RouteId.PuebloPaleta)
    s.unlockedRoutes = [RouteId.PuebloPaleta]
    const saved = JSON.parse(JSON.stringify(s))
    expect(stateFromSaved(saved, backupTeam(s)).unlockedRoutes).toContain(route(RouteId.PuebloPaleta).unlocks)
  })

  it('al cargar (aquí o desde el servidor), lo capturado da por capturada su línea evolutiva anterior', () => {
    const [from, { into }] = [EVOLVING_SPECIES[0], evolutionsOf(EVOLVING_SPECIES[0])[0]]
    const s = playedGame()
    s.caught = [into]
    const cloud = { ...cloudUpload(s), revision: 1, updatedAt: 0 }
    expect(stateFromSaved(JSON.parse(JSON.stringify(s)), cloud.team).caught).toContain(from)
    expect(withEvolutionLines(JSON.parse(JSON.stringify(cloud))).save.caught).toContain(from)
  })

  it('al cargar, ningún rancho queda con más ocupado que espacios (p. ej. una copia del equipo sin las ampliaciones)', () => {
    const s = playedGame()
    s.ranchExtraSlots[0] = RANCH_EXPANSION_SLOTS
    while (usedSlots(s, 0) < ranchCapacity(s, 0)) s.owned.push(createMon(STARTERS[0], NEW_MON_LEVEL))
    const restored = stateFromSaved(null, backupTeam(s))
    expect(usedSlots(restored, 0)).toBeLessThanOrEqual(ranchCapacity(restored, 0))
    expect(restored.owned).toHaveLength(s.owned.length)
  })

  it('si la partida guardada no se puede leer, el equipo sale de su copia', () => {
    const s = playedGame()
    expect(stateFromSaved({ version: SAVE_VERSION - 1, owned: 'roto' }, backupTeam(s)).owned).toHaveLength(1)
  })

  it('el resumen cuenta Pokémon, nivel más alto y dinero', () => {
    const s = playedGame()
    expect(saveSummary(s)).toMatchObject({ mons: 1, topLevel: s.owned[0].level, money: s.money })
  })

  it('solo se acepta subir una partida con revisión de base y copia del equipo válidas', () => {
    const up = cloudUpload(playedGame())
    expect(parseUpload({ baseRevision: null, ...up })).not.toBeNull()
    expect(parseUpload({ baseRevision: 2, ...up })).not.toBeNull()
    expect(parseUpload({ baseRevision: -1, ...up })).toBeNull()
    expect(parseUpload({ baseRevision: null, save: 'nada', team: up.team })).toBeNull()
    expect(parseUpload({ baseRevision: null, save: up.save, team: null })).toBeNull()
    expect(parseUpload(null)).toBeNull()
  })
})
