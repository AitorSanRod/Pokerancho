import { isValidPath, node, NodeKind, pathFrom, type Route, type RouteEdge } from '../../data/maps'
import type { GameState } from '../core/state'

// Bifurcaciones de una ruta (`fork` en kantoMaps.ts): el jugador elige cada camino antes de salir y la ruta lo recorre
// sola. El último camino elegido en cada ruta se recuerda y sale marcado la próxima vez.

/** Lo que hay en un camino de una bifurcación, hasta que se junta con los demás o acaba la ruta */
export interface BranchSummary {
  /** Paradas con combate (salvajes, jefes, entrenadores y líderes) */
  fights: number
  /** De esas, las de entrenador o líder */
  trainers: number
  heals: number
  steps: number
}

export interface BranchOption {
  /** Primera parada del camino */
  to: string
  label: string
  hint?: string
  summary: BranchSummary
}

/** Un cruce del camino: la parada donde se bifurca, sus caminos y el elegido */
export interface ForkChoice {
  at: string
  options: BranchOption[]
  chosen: string
}

const FIGHTS: NodeKind[] = [NodeKind.Wild, NodeKind.Boss, NodeKind.Raid, NodeKind.Trainer, NodeKind.Gym]
const TRAINERS: NodeKind[] = [NodeKind.Trainer, NodeKind.Gym]

/** Cuántos caminos llegan a cada parada: más de uno es donde se juntan los de una bifurcación */
function arrivals(r: Route): Map<string, number> {
  const count = new Map<string, number>()
  for (const n of r.nodes) for (const e of n.next) count.set(e.to, (count.get(e.to) ?? 0) + 1)
  return count
}

/** Paradas del camino que empieza en `edge`, hasta que se junta con otro, vuelve a bifurcarse o acaba la ruta */
export function branchSummary(r: Route, edge: RouteEdge): BranchSummary {
  const joins = arrivals(r)
  const sum: BranchSummary = { fights: 0, trainers: 0, heals: 0, steps: edge.steps }
  for (let n = node(r, edge.to); ; ) {
    if (FIGHTS.includes(n.kind)) sum.fights++
    if (TRAINERS.includes(n.kind)) sum.trainers++
    if (n.kind === NodeKind.Heal) sum.heals++
    const next = n.next.length === 1 ? n.next[0] : null
    if (!next || (joins.get(next.to) ?? 0) > 1) return sum
    sum.steps += next.steps
    n = node(r, next.to)
  }
}

/** Cruces que se encuentran por `path`, en orden */
export function forksOn(r: Route, path: string[]): ForkChoice[] {
  return path.flatMap((at, i) => {
    const n = node(r, at)
    if (n.next.length < 2) return []
    const options = n.next.map((e) => ({ to: e.to, label: e.label ?? node(r, e.to).name, hint: e.hint, summary: branchSummary(r, e) }))
    return [{ at, options, chosen: path[i + 1] }]
  })
}

export const hasForks = (r: Route): boolean => r.nodes.some((n) => n.next.length > 1)

/** Sigue desde `prefix` hasta el final eligiendo en cada cruce lo que ya estaba en `preferred` (o el primer camino) */
function follow(r: Route, prefix: string[], preferred: string[]): string[] {
  const path = [...prefix]
  for (let n = node(r, path[path.length - 1]); n.next.length > 0; n = node(r, path[path.length - 1])) {
    path.push((n.next.find((e) => preferred.includes(e.to)) ?? n.next[0]).to)
  }
  return path
}

/** El camino al elegir `to` en el cruce `at`: igual hasta el cruce y, después, lo ya elegido en los demás cruces */
export function choosePath(r: Route, path: string[], at: string, to: string): string[] {
  const i = path.indexOf(at)
  if (i < 0 || !node(r, at).next.some((e) => e.to === to)) return path
  return follow(r, [...path.slice(0, i + 1), to], path)
}

/** El camino que sale marcado al ir a la ruta: el último elegido en ella (lo que siga existiendo) o el principal */
export function preferredPath(s: GameState, r: Route): string[] {
  const start = pathFrom(r)[0]
  return follow(r, [start], s.routePaths[r.id] ?? [])
}

/** Recuerda el camino elegido para la próxima vez (solo en las rutas con bifurcaciones) */
export function rememberPath(s: GameState, r: Route, path: string[]) {
  if (hasForks(r) && isValidPath(r, path)) s.routePaths[r.id] = path
}
