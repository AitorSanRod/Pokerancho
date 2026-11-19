import { GYMS } from '../../data/gyms'
import { node, NodeKind, type Route } from '../../data/maps'
import { TYPE_SCENERY } from '../shared/sheet/scenery'

// Fondo estático de las rutas de gimnasio y del Alto Mando: el fondo de combate del tipo del líder (los mismos de la
// ficha, ver docs/diseno.md), en lugar del paisaje pixel art que se desplaza.

/** Paradas del camino con líder: su posición y su fondo */
function gymStops(r: Route, path: string[]): { stop: number; image: string }[] {
  return path.flatMap((id, stop) => {
    const n = node(r, id)
    return n.kind === NodeKind.Gym && n.gym ? [{ stop, image: TYPE_SCENERY[GYMS[n.gym].type] }] : []
  })
}

/**
 * Fondo de la ruta en la parada `stop` del camino: el del líder de esa parada o, si no es de gimnasio, el del siguiente
 * (en el Alto Mando cambia con cada uno). Null si la ruta no tiene gimnasios: entonces va su paisaje pixel art
 */
export function gymScenery(r: Route, path: string[], stop: number): string | null {
  const gyms = gymStops(r, path)
  return (gyms.find((g) => g.stop >= stop) ?? gyms[gyms.length - 1])?.image ?? null
}
