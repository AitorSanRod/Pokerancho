import { IMOVE, type IncursionMove } from '../incursionMoves'

// Ajustes de los ataques en combate (rutas, torre y raids): lo que cambia respecto al mismo ataque en las incursiones,
// que no se tocan. Lo que no se ajusta queda igual. Para editar a mano.

/** Lo que se puede cambiar de un ataque en combate: potencia, precisión, prioridad y efectos (la lista entera) */
export type MoveTuning = Partial<Pick<IncursionMove, 'power' | 'accuracy' | 'priority' | 'effects'>>

/**
 * Ajustes por ataque. Los de área, sin área: en un combate de uno contra uno (y contra el jefe de la raid) el área solo
 * resta daño (ver battle/attack.ts › AREA_DAMAGE_MULT); y los de arriba de cada escalera, por encima de los de abajo
 */
export const COMBAT_TUNING: Partial<Record<string, MoveTuning>> = {
  [IMOVE.Avalancha.id]: { effects: [] },
  [IMOVE.OndaToxica.id]: { effects: [] },
  [IMOVE.Terremoto.id]: { effects: [] },
  [IMOVE.FiloDelAbismo.id]: { effects: [] },
  [IMOVE.Ciclon.id]: { effects: [] },
  [IMOVE.BrilloMagico.id]: { effects: [] },
  [IMOVE.Hiperrayo.id]: { accuracy: 90 },
  [IMOVE.Vendaval.id]: { accuracy: 90 },
  [IMOVE.OndaCertera.id]: { accuracy: 90 },
  [IMOVE.ColaFerrea.id]: { power: 120, accuracy: 90 },
  [IMOVE.JuegoSucio.id]: { power: 110 },
  [IMOVE.PulsoDragon.id]: { power: 100 },
  [IMOVE.ColaDragon.id]: { power: 70, accuracy: 100 },
  [IMOVE.Carantona.id]: { power: 75 },
}
