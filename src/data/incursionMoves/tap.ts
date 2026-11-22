// El reto de la ventana de toques de un ataque de incursión (ver game/incursion/tapChallenge.ts, que da el de cada
// ataque por regla salvo que el ataque lleve el suyo a mano): machacar la pantalla o tocar anillos que se cierran.

export const TapKind = {
  /** Tocar todo lo posible: cada toque acerca a la meta y la mejora va según la parte conseguida */
  Mash: 'mash',
  /** Anillos que se cierran uno tras otro en sitios distintos: cada uno se toca una vez, encima y a tiempo */
  Rings: 'rings',
} as const
export type TapKind = (typeof TapKind)[keyof typeof TapKind]

export type TapChallenge =
  | {
      kind: typeof TapKind.Mash
      /** Toques para la mejora entera */
      goal: number
      /** Mejora con la meta entera (0.1 = +10%); con parte de ella, esa parte */
      bonus: number
    }
  | {
      kind: typeof TapKind.Rings
      /** Anillos que salen como poco y como mucho: cada turno, un número entre los dos */
      min: number
      max: number
      /** Mejora si se aciertan todos menos alguno, por la parte acertada; acertarlos todos es crítico */
      bonus: number
    }
