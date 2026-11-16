import { animatedSources } from '../../data/species'

// No todas las especies tienen GIF en todas las carpetas de PokeAPI (ver animatedSources): las que fallan se apuntan
// para no volver a pedirlas en esta sesión y pasar directamente a la siguiente.

const missing = new Set<string>()

/** Apunta que `src` no existe o no se pudo cargar */
export function markMissing(src: string): void {
  missing.add(src)
}

/** El primer GIF animado de la especie que no ha fallado; null si ninguno (se usa el PNG) */
export function animatedSrc(id: number, shiny: boolean, back: boolean): string | null {
  return animatedSources(id, shiny, back).find((src) => !missing.has(src)) ?? null
}

function loads(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = src
  })
}

/** Pide el GIF que se va a ver (probando los siguientes si falla); null si no hay ninguno */
export async function preloadAnimated(id: number, shiny: boolean, back = false): Promise<string | null> {
  for (let src = animatedSrc(id, shiny, back); src; src = animatedSrc(id, shiny, back)) {
    if (await loads(src)) return src
    markMissing(src)
  }
  return null
}
