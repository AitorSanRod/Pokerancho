import { useEffect, useState } from 'react'

/** Segundos que pasea (sprite fijo, a saltitos) antes de pararse; se elige al azar entre los dos */
const WALK_SECONDS = [7, 16] as const
/** Segundos que se queda parado moviéndose como en su GIF animado */
const POSE_SECONDS = [3, 7] as const

const randomMs = ([min, max]: readonly [number, number]) => (min + Math.random() * (max - min)) * 1000

/**
 * Alterna, cada Pokémon a su ritmo, entre pasear por el prado y quedarse quieto en su sitio con su animación.
 * Si no puede moverse (debilitado, arrastrándolo) siempre pasea, que es como se ve quieto.
 */
export function useRanchPose(canPose: boolean): boolean {
  const [posing, setPosing] = useState(false)

  useEffect(() => {
    if (!canPose) return
    const timer = setTimeout(() => setPosing((p) => !p), randomMs(posing ? POSE_SECONDS : WALK_SECONDS))
    return () => clearTimeout(timer)
  }, [canPose, posing])

  return canPose && posing
}
