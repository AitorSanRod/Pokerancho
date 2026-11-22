import type { Nature } from '../../data/natures'
import type { Tm } from '../../data/tms'

// Un Pokémon de la partida y su sitio en el prado (los reexporta state.ts)

export interface OwnedMon {
  uid: string
  speciesId: number
  level: number
  /** EXP acumulada dentro del nivel actual */
  exp: number
  hp: number
  /** Estrellas conseguidas combinando piezas en la Pokédex */
  stars: number
  /** Sube una stat y baja otra (ver team/natures.ts); los de antes de las naturalezas, neutra */
  nature: Nature
  /** Índice del rancho al que pertenece (aunque esté fuera, su hueco sigue ocupado); null si está en la Caja */
  ranch: number | null
  /** Posición en la hierba elegida arrastrándolo, en % del prado; null para la que sale de su uid */
  spot: RanchSpot | null
  /** Ataques de incursión aprendidos con una MT (ver incursion/tms.ts): los tiene para siempre */
  tmMoves: Tm[]
  /** Los ataques que lleva a rutas, torre y raids, elegidos en la ficha (ver combat/moveLoadout.ts); null: los elige el juego */
  routeMoves: string[] | null
  /** Los que lleva a las incursiones, elegidos en la ficha o antes de entrar; null: los elige el juego */
  incursionMoves: string[] | null
  /** Shiny (otros colores): sale al crearlo, por suerte o pagando tickets (ver collection/pieces.ts); lo conserva al evolucionar */
  shiny: boolean
}

export interface RanchSpot {
  x: number
  y: number
}
