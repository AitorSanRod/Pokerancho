import { afterEach, describe, expect, it, vi } from 'vitest'
import { FORM_ITEM_IDS, FORM_ITEMS } from '../../data/forms'
import { IncursionId, MAX_KEYS } from '../../data/incursions'
import { route, RouteId, wildSpecies } from '../../data/maps'
import { Nature, NEUTRAL_NATURE } from '../../data/natures'
import { RanchTypeId } from '../../data/ranchTypes'
import { STAR_ITEM_IDS, STAR_ITEMS } from '../../data/starItems'
import { TM_IDS } from '../../data/tms'
import { STARTERS } from '../../data/species'
import { Stone } from '../../data/stones'
import { startRun } from '../run/run'
import { EXPEDITION_DURATIONS } from '../team/expedition'
import { createMon } from '../team/mons'
import { UPGRADES } from '../team/upgrades'
import { stateFromSaved } from './cloudSave'
import { migrateSave, SAVE_MIGRATIONS } from './saveMigration'
import { initialState, MonPlace, monPlace, SAVE_VERSION, type GameState } from './state'
import { backupTeam } from './teamBackup'

vi.mock('../../data/maps/kantoMaps', () => import('./test-map'))

const OLD = SAVE_VERSION - 1
const [A, B, C] = STARTERS
const UNKNOWN_SPECIES = -7

/** Una partida avanzada, con algo en cada campo que se guarda */
function advancedGame(): GameState {
  const s = initialState()
  const first = createMon(A, 12, 0)
  Object.assign(first, { exp: 3, stars: 2, spot: { x: 40, y: 60 } })
  const second = createMon(B, 9, 1)
  s.owned.push(first, second)
  s.activeUid = first.uid
  s.tutorial = null
  Object.assign(s, {
    money: 12_345,
    tickets: 17,
    missingnoShards: 230,
    seen: [...new Set([A, B, C, ...wildSpecies(route(RouteId.PuebloPaleta))])],
    caught: [A, B],
    favorites: [C],
    pieces: { [A]: 4, [C]: 9 },
    upgrades: { ranches: 1, expeditionSlots: UPGRADES.expeditionSlots.prices.length },
    ranchTypeItems: { [Object.values(RanchTypeId)[0]]: 2 },
    ranchTypeOf: { 1: Object.values(RanchTypeId)[0] },
    ranchExtraSlots: { 1: 5 },
    ranchNames: { 0: 'Prado' },
    stones: { [Stone.Fire]: 1, [Stone.Moon]: 3 },
    formItems: [FORM_ITEM_IDS[0]],
    incursionKeys: { [IncursionId.CuevaHelada]: 2 },
    claimedServerGifts: ['regalo-1'],
    // Coherente: con Pueblo Paleta completada, también abierta la ruta que desbloquea
    unlockedRoutes: [RouteId.PuebloPaleta, route(RouteId.PuebloPaleta).unlocks!, RouteId.BosqueVerde],
    completedRoutes: [RouteId.PuebloPaleta],
    // El activo también puede estar de expedición (sin ruta en curso)
    expeditions: [
      { uid: second.uid, routeId: RouteId.PuebloPaleta, durationMin: EXPEDITION_DURATIONS[0], elapsedMin: 2 },
      { uid: first.uid, routeId: RouteId.PuebloPaleta, durationMin: EXPEDITION_DURATIONS.at(-1)!, elapsedMin: 7 },
    ],
    raidPrizes: [{ bossSpeciesId: C, uid: first.uid, money: 80, tickets: 1, pieces: 1, exp: 5 }],
    routeRaidStreaks: { 'bosque-verde/g': { count: 2, lastAt: 1000 } },
    tradeStamp: 4,
    lastTick: Date.now() - 60_000,
  })
  return s
}

/** Como si se hubiera guardado con la versión anterior y se leyera ahora (pasando por JSON, como en el navegador) */
const fromOldVersion = (s: GameState, version = OLD) => JSON.parse(JSON.stringify({ ...s, version }))

const KEPT: (keyof GameState)[] = [
  'money', 'tickets', 'missingnoShards', 'seen', 'caught', 'favorites', 'pieces', 'upgrades', 'ranchTypeItems', 'ranchTypeOf', 'ranchExtraSlots', 'ranchNames',
  'stones', 'formItems', 'incursionKeys', 'claimedServerGifts', 'tutorial', 'unlockedRoutes', 'completedRoutes', 'owned', 'activeUid', 'expeditions', 'raidPrizes', 'routeRaidStreaks', 'tradeStamp', 'lastTick',
]

/** El paso de verdad de la versión anterior, que algún test sustituye por uno de prueba */
const REAL_STEP = SAVE_MIGRATIONS[OLD]

afterEach(() => {
  if (REAL_STEP) SAVE_MIGRATIONS[OLD] = REAL_STEP
  else delete SAVE_MIGRATIONS[OLD]
})

describe('al actualizar el juego no se pierde nada', () => {
  it('las llaves de incursión se quedan si son de una incursión que existe y sin pasar del máximo', () => {
    const save = { ...fromOldVersion(advancedGame()), incursionKeys: { [IncursionId.CuevaHelada]: MAX_KEYS + 1, quitada: 1 } }
    expect(migrateSave(save)!.incursionKeys).toEqual({})
  })

  it('los objetos estelares y las garantías del gacha se quedan si son de un objeto que existe', () => {
    const [withPity] = STAR_ITEM_IDS.filter((id) => STAR_ITEMS[id].pity !== null)
    const [withoutPity] = STAR_ITEM_IDS.filter((id) => STAR_ITEMS[id].pity === null)
    const save = { ...fromOldVersion(advancedGame()), starItems: { [withPity]: 2, quitado: 1 }, gachaPity: { [withPity]: 7, [withoutPity]: 3 } }
    const s = migrateSave(save)!
    expect(s.starItems).toEqual({ [withPity]: 2 })
    expect(s.gachaPity).toEqual({ [withPity]: 7 })
  })

  it('las MTs y lo aprendido con ellas se quedan si son de una MT que existe', () => {
    const [tm] = TM_IDS
    const game = advancedGame()
    const saved = fromOldVersion(game) as { owned: Record<string, unknown>[] }
    saved.owned[0] = { ...saved.owned[0], tmMoves: [tm, 'quitada'] }
    const s = migrateSave({ ...saved, tms: { [tm]: 2, quitada: 1 } })!
    expect(s.tms).toEqual({ [tm]: 2 })
    expect(s.owned[0].tmMoves).toEqual([tm])
  })

  it('un Pokémon de antes de las MTs no ha aprendido ninguna', () => {
    const saved = fromOldVersion(advancedGame()) as { owned: Record<string, unknown>[] }
    for (const mon of saved.owned) delete mon.tmMoves
    expect(migrateSave(saved)!.owned.every((m) => m.tmMoves.length === 0)).toBe(true)
  })

  it('un Pokémon de antes de las naturalezas (o con una que no existe) es neutro; el que tiene una la conserva', () => {
    const saved = fromOldVersion(advancedGame()) as { owned: Record<string, unknown>[] }
    const [, , kept] = Object.values(Nature)
    saved.owned = [{ ...saved.owned[0], nature: kept }, { ...saved.owned[1], nature: 'inventada' }]
    const s = migrateSave(saved)!
    expect(s.owned.map((m) => m.nature)).toEqual([kept, NEUTRAL_NATURE])
    const older = fromOldVersion(advancedGame()) as { owned: Record<string, unknown>[] }
    for (const mon of older.owned) delete mon.nature
    expect(migrateSave(older)!.owned.every((m) => m.nature === NEUTRAL_NATURE)).toBe(true)
  })

  it('los objetos de forma se quedan si existen y un Pokémon con otra forma la conserva', () => {
    const game = advancedGame()
    const { formId } = FORM_ITEMS[FORM_ITEM_IDS[0]]
    game.owned[0].speciesId = formId
    const s = migrateSave({ ...fromOldVersion(game), formItems: [FORM_ITEM_IDS[0], 'quitado'] })!
    expect(s.formItems).toEqual([FORM_ITEM_IDS[0]])
    expect(s.owned[0].speciesId).toBe(formId)
    expect(s.caught).not.toContain(formId)
  })

  it('la incursión en curso se descarta: el Pokémon vuelve al rancho', () => {
    const s = advancedGame()
    const save = { ...fromOldVersion(s), incursion: { uid: s.owned[0].uid } }
    expect(migrateSave(save)!.incursion).toBeNull()
  })

  it('se conserva todo: dinero, tickets, trozos, Pokédex, vistos, piezas, compras, rutas, equipo, expediciones y premios', () => {
    const s = advancedGame()
    const migrated = migrateSave(fromOldVersion(s))!
    expect(migrated.version).toBe(SAVE_VERSION)
    for (const key of KEPT) expect(migrated[key], key).toEqual(s[key])
  })

  it('también pasando por la carga normal (la del navegador y la de la nube)', () => {
    const s = advancedGame()
    const loaded = stateFromSaved(fromOldVersion(s), backupTeam(s))
    for (const key of KEPT) expect(loaded[key], key).toEqual(s[key])
  })

  it('de una partida muy antigua se conserva lo que tenía; lo que no existía entonces toma su valor inicial', () => {
    const s = advancedGame()
    const ancient = fromOldVersion(s, 1)
    for (const key of ['favorites', 'stones', 'ranchTypeOf', 'ranchExtraSlots', 'ranchNames', 'routeRaidStreaks', 'raidPrizes']) delete ancient[key]
    for (const mon of ancient.owned) delete mon.spot
    const migrated = migrateSave(ancient)!
    expect(migrated).toMatchObject({ money: s.money, pieces: s.pieces, completedRoutes: s.completedRoutes, favorites: [], stones: {}, routeRaidStreaks: {} })
    expect(migrated.owned.map((m) => [m.uid, m.level, m.spot])).toEqual(s.owned.map((m) => [m.uid, m.level, null]))
  })

  it('lo que ya no existe en el juego se descarta y el resto se queda', () => {
    const save = fromOldVersion(advancedGame())
    save.seen.push(UNKNOWN_SPECIES)
    save.pieces[UNKNOWN_SPECIES] = 5
    save.completedRoutes.push('ruta-que-ya-no-existe')
    save.stones.piedraInventada = 2
    save.upgrades.ranches = 999
    save.ranchNames = { 0: 'Prado', 1: '   ', 2: 7, 999: 'Lejos' }
    save.ranchExtraSlots = { 1: 5, 999: 5, 0: -5 }
    save.owned.push({ ...save.owned[0], uid: 'raro', speciesId: UNKNOWN_SPECIES })
    save.expeditions.push({ ...save.expeditions[0], uid: 'nadie' })
    const migrated = migrateSave(save)!
    expect(migrated.seen).not.toContain(UNKNOWN_SPECIES)
    expect(migrated.pieces).not.toHaveProperty(String(UNKNOWN_SPECIES))
    expect(migrated.completedRoutes).toEqual([RouteId.PuebloPaleta])
    expect(migrated.stones).not.toHaveProperty('piedraInventada')
    expect(migrated.upgrades.ranches).toBeLessThanOrEqual(UPGRADES.ranches.prices.length)
    expect(migrated.ranchNames).toEqual({ 0: 'Prado' })
    expect(migrated.ranchExtraSlots).toEqual({ 1: 5 })
    expect(migrated.owned).toHaveLength(2)
    expect(migrated.expeditions).toHaveLength(2)
  })

  it('un campo con otra forma toma su valor inicial; los que ya no existen se ignoran', () => {
    const save = fromOldVersion(advancedGame())
    save.money = 'mucho'
    save.campoQueYaNoExiste = 42
    const migrated = migrateSave(save)!
    expect(migrated.money).toBe(initialState().money)
    expect(migrated).not.toHaveProperty('campoQueYaNoExiste')
  })

  it('solo se pierde lo que estaba a medias: la ruta en curso (su Pokémon vuelve al rancho)', () => {
    const s = advancedGame()
    s.expeditions = s.expeditions.filter((e) => e.uid !== s.activeUid)
    startRun(s, RouteId.PuebloPaleta)
    const migrated = migrateSave(fromOldVersion(s))!
    expect(migrated.run).toBeNull()
    expect(monPlace(migrated, migrated.activeUid!)).toBe(MonPlace.Ranch)
  })

  it('los capturados cuentan como vistos y las rutas completadas como desbloqueadas', () => {
    const save = fromOldVersion(advancedGame())
    save.seen = []
    save.unlockedRoutes = []
    const migrated = migrateSave(save)!
    expect(migrated.seen).toEqual(expect.arrayContaining(save.caught))
    expect(migrated.unlockedRoutes).toEqual(expect.arrayContaining(save.completedRoutes))
  })

  it('si un campo cambia de significado, su paso de SAVE_MIGRATIONS lo convierte antes del rescate', () => {
    SAVE_MIGRATIONS[OLD] = (save) => {
      save.money = (save.dinero as number) * 2
    }
    const save = fromOldVersion(advancedGame())
    save.dinero = 50
    expect(migrateSave(save)!.money).toBe(100)
  })

  it('de la 37 a la 38, la incursión en curso se descarta y se devuelve su llave', () => {
    const s = advancedGame()
    const save = { ...fromOldVersion(s, 37), incursion: { incursionId: IncursionId.CuevaHelada, uid: s.owned[0].uid } }
    const migrated = migrateSave(save)!
    expect(migrated.incursion).toBeNull()
    expect(migrated.incursionKeys[IncursionId.CuevaHelada]).toBe(Math.min(MAX_KEYS, (s.incursionKeys[IncursionId.CuevaHelada] ?? 0) + 1))
  })

  it('si la partida guardada está rota, el equipo sale de su copia', () => {
    const s = advancedGame()
    const loaded = stateFromSaved({ ...fromOldVersion(s), owned: 'roto' }, backupTeam(s))
    expect(loaded.owned.map((m) => m.speciesId)).toEqual(s.owned.map((m) => m.speciesId))
    expect(loaded.money).toBe(s.money)
  })

  it('una partida de esta misma versión se carga tal cual', () => {
    const s = advancedGame()
    const loaded = stateFromSaved(JSON.parse(JSON.stringify(s)), null)
    for (const key of KEPT) expect(loaded[key], key).toEqual(s[key])
  })
})
