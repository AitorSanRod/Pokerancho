import { DAILY_MISSIONS, MISSIONS_PER_DAY, MissionKind, type MissionTemplate } from '../../data/dailyMissions'
import { baseSpeciesOf, SPECIES } from '../../data/species'
import type { Rng } from '../core/random'
import { ownedOfSpecies, type GameState } from '../core/state'
import { expeditionRouteBlocker } from '../team/expedition'
import { isSeen } from './dex'
import { dayKey, type Mission } from './missions'
import { PIECES_PER_COMBINE, piecesOf } from './pieces'

// Qué misiones salen cada día: MISSIONS_PER_DAY distintas al azar, solo de las que el jugador puede cumplir.

/** Especies con las que puede salir de ruta: las que tiene y las que puede crear ya con sus tickets */
export function companionChoices(s: GameState): number[] {
  const owned = s.owned.map((m) => baseSpeciesOf(m.speciesId))
  const creatable = SPECIES.filter((sp) => isSeen(s, sp.id) && !ownedOfSpecies(s, sp.id) && piecesOf(s, sp.id) >= PIECES_PER_COMBINE).map((sp) => sp.id)
  return [...new Set([...owned, ...creatable])]
}

const pickOne = <T>(list: T[], rng: Rng): T | undefined => list[Math.floor(rng() * list.length)]

/** La misión de esa plantilla para este jugador; null si ahora no la puede cumplir */
function missionFor(s: GameState, t: MissionTemplate, rng: Rng): Mission | null {
  const base: Mission = { kind: t.kind, goal: t.goal, progress: 0, claimed: false, reward: t.reward, routeId: null, speciesId: null }
  switch (t.kind) {
    case MissionKind.CompleteRoute: {
      const routeId = pickOne(s.unlockedRoutes, rng)
      return routeId ? { ...base, routeId } : null
    }
    case MissionKind.CompleteRouteWith: {
      const speciesId = pickOne(companionChoices(s), rng)
      return speciesId !== undefined ? { ...base, speciesId } : null
    }
    case MissionKind.FinishExpeditions:
      return s.owned.length > 1 && s.completedRoutes.some((id) => !expeditionRouteBlocker(s, id)) ? base : null
    default:
      return base
  }
}

/** Las de un día nuevo: plantillas distintas al azar, saltando las que no puede cumplir */
function pickMissions(s: GameState, rng: Rng): Mission[] {
  const pool = [...DAILY_MISSIONS]
  const out: Mission[] = []
  while (out.length < MISSIONS_PER_DAY && pool.length > 0) {
    const [t] = pool.splice(Math.floor(rng() * pool.length), 1)
    const m = missionFor(s, t, rng)
    if (m) out.push(m)
  }
  return out
}

/** Al cambiar de día (y ya sin tutorial), las misiones nuevas sustituyen a las de antes, cobradas o no */
export function refreshMissions(s: GameState, now: number, rng: Rng = Math.random) {
  if (s.tutorial !== null) return
  const day = dayKey(now)
  if (s.missions?.day !== day) s.missions = { day, list: pickMissions(s, rng) }
}
