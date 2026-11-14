import { useState } from 'react'

/**
 * Nivel al que ha subido el Pokémon desde que se montó el componente (null si no ha subido). Como clave de la
 * animación, cada nivel nuevo se celebra una vez.
 */
export function useLeveledTo(level: number): number | null {
  const [openedAt] = useState(level)
  return level > openedAt ? level : null
}
