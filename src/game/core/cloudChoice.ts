import type { GameState } from './state'

// Qué ha cambiado en este dispositivo desde la última vez que su partida quedó igual que la de la nube, y cuál de las dos
// se recomienda cuando hay que elegir. Lo que falta aquí porque se vendió, se intercambió o se recreó en otro
// dispositivo no es progreso de aquí: solo cuenta lo que mejora lo que había al sincronizar.

/** Progreso de una partida en un momento: nivel y ★ de cada Pokémon por uid, y rutas completadas */
export interface SyncSnapshot {
  mons: Record<string, [level: number, stars: number]>
  routes: string[]
}

/** Cuál de las dos partidas */
export const SaveSide = { Cloud: 'cloud', Local: 'local' } as const
export type SaveSide = (typeof SaveSide)[keyof typeof SaveSide]

export function syncSnapshot(s: GameState): SyncSnapshot {
  return { mons: Object.fromEntries(s.owned.map((m) => [m.uid, [m.level, m.stars]])), routes: [...s.completedRoutes] }
}

/** La instantánea guardada tiene la forma esperada (si no, se trata como si no la hubiera) */
export function isSyncSnapshot(v: unknown): v is SyncSnapshot {
  const snap = v as Partial<SyncSnapshot> | null
  const pair = (p: unknown) => Array.isArray(p) && p.length === 2 && p.every(Number.isInteger)
  return (
    !!snap &&
    typeof snap.mons === 'object' &&
    snap.mons !== null &&
    Object.values(snap.mons).every(pair) &&
    Array.isArray(snap.routes) &&
    snap.routes.every((r) => typeof r === 'string')
  )
}

/** Aquí se ha jugado algo desde la instantánea: un Pokémon nuevo, con más nivel o ★, o una ruta completada nueva */
export function progressSince(s: GameState, snapshot: SyncSnapshot): boolean {
  const improved = s.owned.some((m) => {
    const before = snapshot.mons[m.uid]
    return !before || m.level > before[0] || m.stars > before[1]
  })
  const routes = new Set(snapshot.routes)
  return improved || s.completedRoutes.some((r) => !routes.has(r))
}

/** La que se jugó después (horas reales en ms); con empate, la de la nube */
export const recommendedSave = (cloudPlayedAt: number, localPlayedAt: number): SaveSide => (localPlayedAt > cloudPlayedAt ? SaveSide.Local : SaveSide.Cloud)
