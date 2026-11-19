import { incursion, IncursionId, MAX_KEYS } from '../../data/incursions'
import { isValidPath, route } from '../../data/maps'
import { NEUTRAL_NATURE } from '../../data/natures'
import { isRanchBackdrop } from '../../data/ranchBackdrops'
import { RANCH_TYPES } from '../../data/ranchTypes'
import { isFormItem } from '../../data/forms'
import { baseSpeciesOf, isKnownSpecies, SPECIES } from '../../data/species'
import { isStarItem, STAR_ITEMS } from '../../data/starItems'
import { Stone } from '../../data/stones'
import { isTm } from '../../data/tms'
import { refundLostBonds, salvageBonds } from '../incursion/schedule/scheduleSalvage'
import { ExpeditionFocus } from '../team/expeditionFocus'
import { repairExpeditions } from '../team/expeditionSalvage'
import { legacyTrainerWho } from '../run/runTrainer'
import { isBadge } from '../../data/badges'
import { salvageMissions } from '../collection/missions'
import { SERVER_GIFT_ID } from '../collection/serverGifts'
import { createMon } from '../team/mons'
import { isNature } from '../team/natures'
import { RANCH_EXPANSION_MAX, RANCH_EXPANSION_SLOTS } from '../team/ranchExpansion'
import { cleanRanchName } from '../team/ranchNames'
import { expToNext, MAX_LEVEL, MAX_STARS, maxHp } from '../team/stats'
import { UPGRADES } from '../team/upgrades'
import { carriedProgress } from './progressCarry'
import { initialState, SAVE_VERSION, TutorialStep, type GameState, type OwnedMon } from './state'

// Una partida guardada con otra versión del juego no se tira: se pasa por los pasos de SAVE_MIGRATIONS (los cambios
// de significado) y después se rescata campo a campo todo lo que encaje con la forma de ahora. Lo que ya no existe en
// el juego (una especie o una ruta quitadas) se descarta; los campos nuevos toman su valor inicial. Lo que estaba a
// medias (IN_PROGRESS) sigue si su forma no ha cambiado desde entonces (progressCarry.ts); si no, se pierde. Las
// expediciones siempre siguen y terminan con las condiciones con las que salieron (team/expeditionSalvage.ts).

type Save = Record<string, unknown>

/**
 * Pasos de migración: SAVE_MIGRATIONS[v] convierte una partida de la versión v en una de la v + 1. Solo hace falta
 * cuando un campo cambia de nombre o de significado; los campos nuevos o quitados ya los resuelve el rescate
 */
export const SAVE_MIGRATIONS: Partial<Record<number, (save: Save) => void>> = {
  // Las expediciones eligen ahora qué sacar (enfoque); las que ya estaban fuera, EXP
  52: (save) => {
    if (Array.isArray(save.expeditions)) for (const e of save.expeditions) if (isRecord(e)) e.focus ??= ExpeditionFocus.Exp
  },
  // La torre sube sola sin límite (paseo entre pisos en lugar de pisos sin pantalla) y da Huevos Suerte
  58: (save) => {
    const t = save.tower
    if (!isRecord(t)) return
    delete t.awayFloors
    t.gapMsLeft = 0
    if (isRecord(t.earned)) t.earned.eggs ??= 0
    if (isRecord(t.prize)) t.prize.egg ??= false
  },
  // El ataque elegido pasa del gimnasio a toda la ruta; el piso de la torre en curso no se puede volver a jugar
  59: (save) => {
    const run = save.run
    if (isRecord(run)) {
      const gym = isRecord(run.gym) ? run.gym : null
      if (typeof run.moveId !== 'string') run.moveId = typeof gym?.moveId === 'string' ? gym.moveId : ''
      if (gym) delete gym.moveId
    }
    if (isRecord(save.tower)) save.tower.battle ??= null
  },
  // La parada de jefe comunitario es un combate más de la ruta (sin sala): la ruta que estaba luchando en una se pierde.
  // Las salas de la pestaña Raids cambian de forma (progressCarry.ts) y las del servidor de antes ya no existen
  61: (save) => {
    const run = save.run
    if (isRecord(run)) {
      if (run.phase === 'raid') save.run = null
      delete run.raid
      delete run.raidRejoinHp
      // El entrenador de la parada lleva ahora quién le ha tocado ser (al azar desde esta versión)
      if (isRecord(run.trainer)) run.trainer.who ??= legacyTrainerWho(run.routeId, run.path, run.stop)
    }
    save.roomsToLeave = []
  },
  // El Huevo Suerte de la torre ya no va solo a la Mochila: sale en la escena y hay que tocarlo
  60: (save) => {
    if (isRecord(save.tower)) save.tower.egg ??= null
  },
  // Se puede entrar en la pelea de la raid ya empezada: las salas de antes no tienen ninguna entrada pendiente. Siguen
  // (la pelea en marcha se recalcula con las reglas nuevas: revivires de cada Pokémon y ventanas aunque no quede nadie)
  62: (save) => {
    if (isRecord(save.raids)) for (const tr of Object.values(save.raids)) if (isRecord(tr)) tr.pendingJoin ??= false
  },
}

/**
 * Si la incursión en curso se descarta al cambiar de versión (ver progressCarry.ts), su llave, gastada al entrar, vuelve
 * a la Mochila (sin pasar del máximo; las gratuitas no la piden)
 */
function refundIncursionKey(save: Save) {
  const id = isRecord(save.incursion) ? save.incursion.incursionId : null
  if (!isIncursionId(id) || incursion(id).free) return
  const keys = isRecord(save.incursionKeys) ? save.incursionKeys : {}
  keys[id] = Math.min(MAX_KEYS, (isInt(keys[id]) ? keys[id] : 0) + 1)
  save.incursionKeys = keys
}

/**
 * Lo que estaba a medias: sigue solo si su forma no ha cambiado (progressCarry.ts). Si no, la ruta se pierde (lo ganado
 * en ella ya se sumó al ganarlo), igual que la sala de raid, la incursión en curso (se devuelve su llave) y el checkin
 * de una incursión programada, y el Pokémon vuelve al rancho. El multiplicador de tiempo (solo de desarrollo) vuelve siempre a x1
 */
const IN_PROGRESS: (keyof GameState)[] = ['run', 'raids', 'incursion', 'incursionCheckin', 'tower', 'timeScale']
/** Ranchos que puede llegar a tener el jugador: el primero más todos los de la tienda */
const MAX_RANCHES = 1 + UPGRADES.ranches.prices.length

const SPECIES_IDS = new Set(SPECIES.map((sp) => sp.id))
const isRecord = (v: unknown): v is Save => typeof v === 'object' && v !== null && !Array.isArray(v)
const isInt = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number => Number.isInteger(v) && (v as number) >= min && (v as number) <= max
const isRanch = (k: string) => isInt(Number(k), 0, MAX_RANCHES - 1)
const isSpecies = (v: unknown): v is number => SPECIES_IDS.has(v as number)
const isRoute = (v: unknown): v is string => {
  try {
    return typeof v === 'string' && !!route(v)
  } catch {
    return false
  }
}
const isIncursionId = (v: unknown): v is IncursionId => (Object.values(IncursionId) as unknown[]).includes(v)

/** Lista sin repetir de los valores que valen */
const listOf = <T>(v: unknown, valid: (x: unknown) => x is T): T[] | undefined => (Array.isArray(v) ? [...new Set(v.filter(valid))] : undefined)

const isText = (x: unknown): x is string => typeof x === 'string'

/** Tabla ruta → valor con solo las rutas que existen y los valores que acepta `valid` (undefined lo quita) */
function byRoute<T>(v: unknown, valid: (x: unknown, routeId: string) => T | undefined): Record<string, T> | undefined {
  if (!isRecord(v)) return undefined
  const kept = Object.entries(v).flatMap(([id, x]) => {
    const value = isRoute(id) ? valid(x, id) : undefined
    return value === undefined ? [] : [[id, value] as const]
  })
  return Object.fromEntries(kept)
}

/** Tabla clave → cantidad con solo las claves que valen y cantidades enteras no negativas */
function countsOf(v: unknown, validKey: (k: string) => boolean, max = Number.MAX_SAFE_INTEGER): Record<string, number> | undefined {
  if (!isRecord(v)) return undefined
  return Object.fromEntries(Object.entries(v).filter((e): e is [string, number] => validKey(e[0]) && isInt(e[1], 0, max)))
}

/** Un Pokémon guardado, con la forma de ahora: lo que falte, de un Pokémon nuevo; lo que no encaje, se arregla o se descarta */
function salvageMon(v: unknown): OwnedMon | null {
  if (!isRecord(v) || !isKnownSpecies(v.speciesId) || !isInt(v.level, 1, MAX_LEVEL) || typeof v.uid !== 'string' || !v.uid) return null
  const ranch = v.ranch === null || isInt(v.ranch, 0, MAX_RANCHES - 1) ? v.ranch : 0
  const mon = { ...createMon(v.speciesId, v.level, ranch), uid: v.uid } as OwnedMon & Save
  for (const key of Object.keys(mon)) if (typeof v[key] === typeof mon[key] && v[key] !== null) mon[key] = v[key]
  mon.exp = isInt(v.exp) ? Math.min(v.exp, expToNext(mon.level) - 1) : 0
  mon.stars = isInt(v.stars, 0, MAX_STARS) ? v.stars : 0
  // Los de antes de las naturalezas (o con una que ya no existe), neutra
  mon.nature = isNature(v.nature) ? v.nature : NEUTRAL_NATURE
  mon.hp = typeof v.hp === 'number' && v.hp >= 0 ? Math.min(v.hp, maxHp(mon)) : maxHp(mon)
  mon.spot = isRecord(v.spot) && typeof v.spot.x === 'number' && typeof v.spot.y === 'number' ? { x: v.spot.x, y: v.spot.y } : null
  mon.tmMoves = listOf(v.tmMoves, isTm) ?? []
  return mon
}

/** Un premio de raid pendiente con la forma de ahora (lo que le falte, a 0): que no se pierda ni salga NaN al recogerlo */
function salvagePrize(v: unknown) {
  if (!isRecord(v) || !isSpecies(v.bossSpeciesId)) return null
  const n = (x: unknown) => (isInt(x) ? x : 0)
  return { bossSpeciesId: v.bossSpeciesId, uid: typeof v.uid === 'string' ? v.uid : '', money: n(v.money), tickets: n(v.tickets), pieces: n(v.pieces), exp: n(v.exp) }
}

/** Reglas de los campos que hay que comprobar a fondo; los demás se rescatan si tienen la misma forma que el inicial */
const RULES: Partial<Record<keyof GameState, (v: unknown) => unknown>> = {
  money: (v) => (isInt(v) ? v : undefined),
  tickets: (v) => (isInt(v) ? v : undefined),
  missingnoShards: (v) => (isInt(v) ? v : undefined),
  tradeStamp: (v) => (isInt(v) ? v : undefined),
  seen: (v) => listOf(v, isSpecies),
  caught: (v) => listOf(v, isSpecies),
  favorites: (v) => listOf(v, isSpecies),
  pieces: (v) => countsOf(v, (k) => isSpecies(Number(k))),
  upgrades: (v) => (isRecord(v) ? Object.fromEntries(Object.entries(v).filter(([k, n]) => k in UPGRADES && isInt(n, 0, UPGRADES[k as keyof typeof UPGRADES].prices.length))) : undefined),
  ranchTypeItems: (v) => countsOf(v, (k) => k in RANCH_TYPES),
  ranchTypeOf: (v) => (isRecord(v) ? Object.fromEntries(Object.entries(v).filter(([k, t]) => isRanch(k) && typeof t === 'string' && t in RANCH_TYPES)) : undefined),
  ranchExtraSlots: (v) => countsOf(v, isRanch, RANCH_EXPANSION_MAX * RANCH_EXPANSION_SLOTS),
  ranchNames: (v) =>
    isRecord(v) ? Object.fromEntries(Object.entries(v).filter(([k, n]) => isRanch(k) && typeof n === 'string' && n === cleanRanchName(n) && n)) : undefined,
  ranchBackdropOf: (v) => (isRecord(v) ? Object.fromEntries(Object.entries(v).filter(([k, b]) => isRanch(k) && isRanchBackdrop(b))) : undefined),
  stones: (v) => countsOf(v, (k) => (Object.values(Stone) as string[]).includes(k)),
  formItems: (v) => listOf(v, isFormItem),
  mints: (v) => (isInt(v) ? v : undefined),
  neutralMints: (v) => (isInt(v) ? v : undefined),
  luckyEggs: (v) => (isInt(v) ? v : undefined),
  towerBest: (v) => (isInt(v) ? v : undefined),
  badges: (v) => listOf(v, isBadge),
  towerWeek: (v) => (isRecord(v) && isInt(v.week) && isInt(v.best) ? { week: v.week, best: v.best } : undefined),
  starItems: (v) => countsOf(v, isStarItem),
  tms: (v) => countsOf(v, isTm),
  gachaPity: (v) => countsOf(v, (k) => isStarItem(k) && STAR_ITEMS[k].pity !== null),
  incursionKeys: (v) => countsOf(v, isIncursionId, MAX_KEYS),
  freeIncursionsPlayed: (v) => listOf(v, isIncursionId),
  incursionBonds: (v) => salvageBonds(v),
  tutorial: (v) => (v === null || (Object.values(TutorialStep) as unknown[]).includes(v) ? v : undefined),
  unlockedRoutes: (v) => listOf(v, isRoute),
  completedRoutes: (v) => listOf(v, isRoute),
  routeStars: (v) => byRoute(v, (keys) => listOf(keys, isText)),
  routePaths: (v) => byRoute(v, (path, id) => (Array.isArray(path) && isValidPath(route(id), path) ? path : undefined)),
  owned: (v) => (Array.isArray(v) ? v.map(salvageMon).filter((m): m is OwnedMon => m !== null) : undefined),
  // El compañero empieza en null y sameShape no aceptaría su uid: sin esta regla se cambiaba en cada versión
  activeUid: (v) => (typeof v === 'string' && v ? v : undefined),
  raidPrizes: (v) => (Array.isArray(v) ? v.map(salvagePrize).filter((x) => x !== null) : undefined),
  routeRaidStreaks: (v) =>
    isRecord(v) ? Object.fromEntries(Object.entries(v).filter(([, r]) => isRecord(r) && isInt(r.count) && typeof r.lastAt === 'number')) : undefined,
  missions: (v) => salvageMissions(v) ?? undefined,
  roomsToLeave: (v) => listOf(v, (x): x is string => typeof x === 'string'),
  claimedServerGifts: (v) => listOf(v, (x): x is string => typeof x === 'string' && SERVER_GIFT_ID.test(x)),
  lastTick: (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(v, Date.now()) : undefined),
}

/** Mismo tipo de valor que el inicial (número, texto, lista, tabla…): para los campos sin regla propia */
function sameShape(initial: unknown, v: unknown): boolean {
  if (Array.isArray(initial)) return Array.isArray(v)
  if (initial === null) return v === null || typeof v === 'object'
  return typeof v === typeof initial && !Array.isArray(v)
}

/** Lo que depende de otros campos: Pokémon únicos, activo, expediciones (terminables) de Pokémon que existen, ranchos comprados */
function linkUp(s: GameState) {
  const seenUids = new Set<string>()
  s.owned = s.owned.filter((m) => !seenUids.has(m.uid) && seenUids.add(m.uid))
  if (!s.owned.some((m) => m.uid === s.activeUid)) s.activeUid = (s.owned.find((m) => m.ranch !== null) ?? s.owned[0])?.uid ?? null
  repairExpeditions(s)
  s.caught = [...new Set([...s.caught, ...s.owned.map((m) => baseSpeciesOf(m.speciesId))])]
  s.seen = [...new Set([...s.seen, ...s.caught])]
  s.unlockedRoutes = [...new Set([...initialState().unlockedRoutes, ...s.unlockedRoutes, ...s.completedRoutes])]
  const lastRanch = Math.max(0, ...s.owned.map((m) => m.ranch ?? 0))
  if (lastRanch > (s.upgrades.ranches ?? 0)) s.upgrades.ranches = lastRanch
  if (s.owned.length > 0 && s.tutorial === TutorialStep.Starter) s.tutorial = null
}

/** La partida de otra versión pasada a esta, sin perder nada de lo que siga existiendo; null si no es una partida */
export function migrateSave(saved: unknown): GameState | null {
  if (!isRecord(saved) || !isInt(saved.version)) return null
  const save = structuredClone(saved)
  for (let v = save.version as number; v < SAVE_VERSION; v++) SAVE_MIGRATIONS[v]?.(save)
  const carried = carriedProgress(save, saved.version)
  if (!carried.incursion) refundIncursionKey(save)
  refundLostBonds(save)
  const s = initialState()
  const fields = s as unknown as Save
  for (const key of Object.keys(s) as (keyof GameState)[]) {
    if (key === 'version' || IN_PROGRESS.includes(key) || !(key in save)) continue
    const rule = RULES[key]
    const value = rule ? rule(save[key]) : sameShape(s[key], save[key]) ? save[key] : undefined
    if (value !== undefined) fields[key] = value
  }
  Object.assign(s, carried)
  linkUp(s)
  return s
}
