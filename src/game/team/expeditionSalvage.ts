import { allRoutes, findRoute, type Route } from '../../data/maps'
import { isKnownSpecies } from '../../data/species'
import type { Expedition, ExpeditionTerms, GameState } from '../core/state'
import { expeditionTerms } from './expedition'
import { ExpeditionFocus, isExpeditionFocus } from './expeditionFocus'

// Una expedición en curso nunca se pierde al cambiar de versión: termina con las condiciones con las que salió
// (Expedition.terms). Las de antes de guardarlas, o con unas que ya no se pueden usar, las sacan de su ruta tal como
// está ahora; si la ruta ya no existe o no tiene salvajes, de la más avanzada que haya completado el jugador.

type Saved = Record<string, unknown>

const isRecord = (v: unknown): v is Saved => typeof v === 'object' && v !== null && !Array.isArray(v)
const isCount = (v: unknown, min: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min

/** Ruta con salvajes en la que se resuelve una expedición cuya ruta ya no sirve: la más avanzada de las completadas */
function fallbackRoute(s: GameState): Route {
  const wild = allRoutes().filter((r) => r.encounters.length > 0)
  const done = wild.filter((r) => s.completedRoutes.includes(r.id))
  return done.length > 0 ? done.reduce((a, b) => (b.levels[1] > a.levels[1] ? b : a)) : wild[0]
}

/** Condiciones guardadas que se pueden usar tal cual (números válidos y salvajes que siguen existiendo) */
function isUsableTerms(v: unknown): v is ExpeditionTerms {
  if (!isRecord(v) || typeof v.routeName !== 'string' || !Array.isArray(v.levels) || !Array.isArray(v.encounters)) return false
  const [min, max] = v.levels as unknown[]
  const levelsOk = v.levels.length === 2 && isCount(min, 1) && isCount(max, min)
  const encountersOk = v.encounters.length > 0 && v.encounters.every((e) => isRecord(e) && isKnownSpecies(e.speciesId) && isCount(e.chance, 0))
  const numbersOk = isCount(v.legSteps, 0) && isCount(v.battles, 1) && [v.expMult, v.moneyMult, v.lootMult].every((m) => isCount(m, 0))
  return levelsOk && encountersOk && numbersOk
}

/** Las condiciones de una expedición guardada: las suyas si se pueden usar; si no, las de su ruta (o la de reserva) ahora */
export function savedTerms(s: GameState, e: { routeId: string; durationMin: number; focus: ExpeditionFocus; terms?: unknown }): ExpeditionTerms {
  if (isUsableTerms(e.terms)) return e.terms
  const r = findRoute(e.routeId)
  return expeditionTerms(r && r.encounters.length > 0 ? r : fallbackRoute(s), e.durationMin, e.focus)
}

/** Una expedición guardada, terminable; null solo si no se puede leer (sin Pokémon, duración o minutos) */
function salvageExpedition(s: GameState, v: unknown): Expedition | null {
  if (!isRecord(v) || typeof v.uid !== 'string' || !isCount(v.durationMin, 1) || !isCount(v.elapsedMin, 0)) return null
  const routeId = typeof v.routeId === 'string' ? v.routeId : ''
  const focus = isExpeditionFocus(v.focus) ? v.focus : ExpeditionFocus.Exp
  const e = { uid: v.uid, routeId, durationMin: v.durationMin, focus, elapsedMin: Math.min(v.elapsedMin, v.durationMin) }
  return { ...e, terms: savedTerms(s, { ...e, terms: v.terms }) }
}

/**
 * Al cargar la partida (de esta versión o de otra): todas las expediciones en curso siguen y se pueden terminar, aunque
 * su ruta, su duración o su enfoque ya no existan. Solo se quitan las de un Pokémon que ya no está o repetidas
 */
export function repairExpeditions(s: GameState) {
  const owned = new Set(s.owned.map((m) => m.uid))
  const away = new Set<string>()
  s.expeditions = (s.expeditions as unknown[]).flatMap((v) => {
    const e = salvageExpedition(s, v)
    if (!e || !owned.has(e.uid) || away.has(e.uid)) return []
    away.add(e.uid)
    return [e]
  })
}
