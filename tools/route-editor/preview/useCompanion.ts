import { useState } from 'react'
import { POKEMON } from '../../../src/data/pokemon'
import type { Companion } from './simulate'

const STORAGE_KEY = 'route-editor-companion'
const DEFAULT: Companion = { speciesId: POKEMON.Blastoise, level: 50 }

function readStored(): Companion {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') }
  } catch {
    return DEFAULT
  }
}

/** El Pokémon del jugador en la vista previa y en la simulación; se recuerda entre visitas */
export function useCompanion(): [Companion, (c: Companion) => void] {
  const [companion, setCompanion] = useState(readStored)
  const update = (c: Companion) => {
    setCompanion(c)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
    } catch {
      // Sin almacenamiento: vale para esta visita
    }
  }
  return [companion, update]
}
