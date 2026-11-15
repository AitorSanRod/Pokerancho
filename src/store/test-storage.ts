import type { SaveStorage } from './persistence'

/** Almacenamiento en memoria para los tests, con lo guardado a la vista en `data` */
export function memoryStorage(): SaveStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
}
