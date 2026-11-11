// Leer y escribir un valor del borrador por la ruta de su campo (`rooms.2.slots.0.options.1.weight`), y las acciones de
// lista que comparten las rutas y las incursiones (quitar, subir y bajar).

type Bag = Record<string, unknown>

const parts = (path: string) => path.split('.')

export const getAt = (root: object, path: string): unknown => parts(path).reduce<unknown>((o, k) => (o as Bag)[k], root)

export const listAt = (root: object, path: string) => getAt(root, path) as unknown[]

export function setAt(root: object, path: string, value: unknown) {
  const keys = parts(path)
  const parent = keys.slice(0, -1).reduce<unknown>((o, k) => (o as Bag)[k], root) as Bag
  parent[keys[keys.length - 1]] = value
}

/** Quita el elemento `index` de la lista `list` */
export function removeItem(root: object, { list, index }: DOMStringMap) {
  listAt(root, list!).splice(Number(index), 1)
}

/** Cambia de sitio el elemento `index` de la lista `list` con su vecino (`by`: -1 arriba, 1 abajo) */
export function moveItem(root: object, { list, index }: DOMStringMap, by: number) {
  const items = listAt(root, list!)
  const i = Number(index)
  const j = i + by
  if (j < 0 || j >= items.length) return
  ;[items[i], items[j]] = [items[j], items[i]]
}

/** Inserta una copia del elemento `index` de la lista `list` justo después; `adjust` cambia lo que no debe repetirse */
export function duplicateItem<T>(root: object, { list, index }: DOMStringMap, adjust: (copy: T) => T = (c) => c) {
  const items = listAt(root, list!) as T[]
  const i = Number(index)
  items.splice(i + 1, 0, adjust(structuredClone(items[i])))
}
