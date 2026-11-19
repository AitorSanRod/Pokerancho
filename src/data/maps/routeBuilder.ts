import type { RouteEdge, RouteNode } from './mapCommon'

// Atajos para escribir las paradas de una ruta en orden (kantoMaps.ts): `chain(parada, parada, fork(…), parada)`.

/** Una parada escrita en orden: `steps` son los pasos del tramo que llega a ella */
export type Stop = Omit<RouteNode, 'next'> & { steps: number }

/** Uno de los caminos de una bifurcación: cómo se llama al elegirlo, qué tiene de especial y sus paradas, en orden */
export interface Branch {
  label: string
  hint?: string
  stops: [Stop, ...Stop[]]
}

interface Fork {
  branches: Branch[]
}

/**
 * Bifurcación dentro de `chain`: el jugador elige uno de los caminos antes de salir. Todos salen de la parada anterior
 * y, si hay una parada después, se juntan en ella (si no, cada camino acaba la ruta por su cuenta)
 */
export const fork = (...branches: Branch[]): Fork => ({ branches })

const isFork = (item: Stop | Fork): item is Fork => 'branches' in item

function toNode({ steps: _steps, ...stop }: Stop): RouteNode {
  return { ...stop, next: [] }
}

/** Paradas en orden: cada una enlaza con la siguiente; una bifurcación (`fork`) enlaza con todos sus caminos */
export function chain(...items: (Stop | Fork)[]): RouteNode[] {
  const nodes: RouteNode[] = []
  let tails: RouteNode[] = []
  const link = (stop: Stop, edge: Omit<RouteEdge, 'to' | 'steps'> = {}): RouteNode => {
    const n = toNode(stop)
    nodes.push(n)
    for (const tail of tails) tail.next.push({ to: n.id, steps: stop.steps, ...edge })
    return n
  }
  for (const item of items) {
    if (!isFork(item)) {
      tails = [link(item)]
      continue
    }
    const before = tails
    const ends = item.branches.map(({ label, hint, stops: [first, ...rest] }) => {
      tails = before
      let last = link(first, hint ? { label, hint } : { label })
      for (const stop of rest) {
        tails = [last]
        last = link(stop)
      }
      return last
    })
    tails = ends
  }
  return nodes
}
