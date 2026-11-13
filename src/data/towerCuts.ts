// Cortes de poder de la torre infinita (ver game/tower/towerFoes.ts). Este fichero es para editarlo a mano: desde el
// piso `fromFloor`, los rivales tienen que sumar al menos `minPower` entre sus 4 stats base (el mismo total que decide
// la rareza en data/species.ts: Mewtwo, el máximo, suma 480; raro desde 275, épico desde 335, legendario desde 392).
// Quitan a los más débiles de los pisos altos sin dejar solo legendarios: el último corte deja raros y épicos.

export interface TowerCut {
  /** Primer piso en el que se aplica */
  fromFloor: number
  /** Total mínimo de las 4 stats base del rival */
  minPower: number
}

/** En orden de piso; vale el último cuyo `fromFloor` ya se ha alcanzado */
export const TOWER_CUTS: TowerCut[] = [
  { fromFloor: 30, minPower: 200 },
  { fromFloor: 50, minPower: 220 },
  { fromFloor: 70, minPower: 240 },
  { fromFloor: 90, minPower: 255 },
  { fromFloor: 125, minPower: 265 },
  { fromFloor: 150, minPower: 275 },
]
