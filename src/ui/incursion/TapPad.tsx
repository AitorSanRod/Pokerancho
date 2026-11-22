import { TapKind, type IncursionMove } from '../../data/incursionMoves'
import { tapChallengeOf } from '../../game/incursion/tapChallenge'
import { MashPad } from './MashPad'
import { RingsPad } from './RingsPad'
import './tap-pad.css'

export interface TapPadProps {
  /** El ataque que usará tu Pokémon este turno: dice el reto y lo que mejora */
  move: IncursionMove
  /** Clave fija de la ventana (ver critTiming.ts › ringKey): de ella salen los anillos */
  seed: number
  msLeft: number
  lastTick: number
  /**
   * Lo conseguido cada vez que sube (de 0 a 1) y, con `done`, que el reto ha acabado: se apunta en la partida (sin
   * servidor) o se avisa al servidor
   */
  onScore: (score: number, done: boolean) => void
}

/**
 * Ventana de toques antes del turno del grupo: toda la escena es el botón y el reto es el del ataque (machacar o
 * anillos). Quien lo pinta le da una `key` por ventana y ataque, para que el reto empiece de cero
 */
export function TapPad(props: TapPadProps) {
  const ch = tapChallengeOf(props.move)
  return ch.kind === TapKind.Mash ? <MashPad {...props} challenge={ch} /> : <RingsPad {...props} challenge={ch} />
}
