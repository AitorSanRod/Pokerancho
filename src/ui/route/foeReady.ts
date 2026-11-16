import { useEffect, useState } from 'react'
import { sprite } from '../../data/species'
import type { BattleHold } from '../../game/core/tick'
import { preloadAnimated } from '../shared/animatedSprite'
import { measureBounds } from '../shared/spriteBounds'

// El rival de un combate de ruta o de la torre no sale hasta tener sus imágenes: mientras, tu Pokémon sigue andando y
// el combate espera (el bucle de App.tsx pasa `battleHold` a tick). Las imágenes se piden antes, al caminar, para
// que casi nunca haga falta esperar.

/** Lo más que espera un combate a la imagen del rival (sin conexión o si falla, empieza igual) */
const MAX_WAIT_MS = 5000

/** Combates que esperan a que se vea el rival; lo lee el bucle de juego (App.tsx) */
export const battleHold: BattleHold = { run: false, tower: false }

/** Rivales con todo cargado: así un rival ya visto sale sin esperar ni un instante */
const ready = new Set<string>()

const foeKey = (speciesId: number, shiny: boolean) => `${speciesId}:${shiny}`

/** Pide las imágenes con las que se pinta un rival en combate (ver Sprite en common.tsx): la que se ve y su contorno */
export function preloadFoe(speciesId: number, shiny = false): Promise<void> {
  return Promise.all([preloadAnimated(speciesId, shiny), measureBounds(sprite.front(speciesId, shiny))]).then(() => {
    ready.add(foeKey(speciesId, shiny))
  })
}

/**
 * Si ya se puede enseñar el rival `foe` (null: no hay combate). Mientras no, pone en espera el combate `holdKey`;
 * al desmontarse lo suelta
 */
export function useFoeShown(foe: { speciesId: number; shiny?: boolean } | null, holdKey: keyof BattleHold): boolean {
  const speciesId = foe?.speciesId ?? null
  const shiny = foe?.shiny === true
  const key = speciesId === null ? null : foeKey(speciesId, shiny)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const shown = key === null || loadedKey === key || ready.has(key)

  useEffect(() => {
    if (speciesId === null || shown) return
    let alive = true
    const done = () => alive && setLoadedKey(foeKey(speciesId, shiny))
    const timer = setTimeout(done, MAX_WAIT_MS)
    void preloadFoe(speciesId, shiny).then(done)
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [speciesId, shiny, shown])

  useEffect(() => {
    battleHold[holdKey] = !shown
    return () => {
      battleHold[holdKey] = false
    }
  }, [shown, holdKey])

  return shown
}
