import { describe, expect, it } from 'vitest'
import { NodeKind } from './mapCommon'
import { chain, fork, type Stop } from './routeBuilder'

const wild = (id: string, steps = 10): Stop => ({ id, name: id, kind: NodeKind.Wild, steps })
const start: Stop = { id: 's', name: 'Inicio', kind: NodeKind.Start, steps: 0 }
const nextOf = (nodes: ReturnType<typeof chain>, id: string) => nodes.find((n) => n.id === id)!.next

describe('chain', () => {
  it('sin bifurcaciones, cada parada enlaza con la siguiente con los pasos de esta', () => {
    const nodes = chain(start, wild('a', 20), wild('b', 30))
    expect(nextOf(nodes, 's')).toEqual([{ to: 'a', steps: 20 }])
    expect(nextOf(nodes, 'a')).toEqual([{ to: 'b', steps: 30 }])
    expect(nextOf(nodes, 'b')).toEqual([])
    expect(nodes[0]).not.toHaveProperty('steps')
  })

  it('una bifurcación sale de la parada anterior con el nombre de cada camino y se junta en la siguiente', () => {
    const nodes = chain(start, fork({ label: 'Hierba', hint: 'Más salvajes', stops: [wild('h1'), wild('h2')] }, { label: 'Senda', stops: [wild('t', 25)] }), wild('z', 15))
    expect(nextOf(nodes, 's')).toEqual([
      { to: 'h1', steps: 10, label: 'Hierba', hint: 'Más salvajes' },
      { to: 't', steps: 25, label: 'Senda' },
    ])
    expect(nextOf(nodes, 'h1')).toEqual([{ to: 'h2', steps: 10 }])
    expect(nextOf(nodes, 'h2')).toEqual([{ to: 'z', steps: 15 }])
    expect(nextOf(nodes, 't')).toEqual([{ to: 'z', steps: 15 }])
  })

  it('una bifurcación al final deja que cada camino acabe la ruta', () => {
    const nodes = chain(start, fork({ label: 'A', stops: [wild('a')] }, { label: 'B', stops: [wild('b')] }))
    expect(nextOf(nodes, 'a')).toEqual([])
    expect(nextOf(nodes, 'b')).toEqual([])
  })
})
