import { IMOVE, type IncursionMove } from './incursionMoves'
import { ITEM, type Item } from './items'
import { PokeType } from './types'

// MTs: objetos de un solo uso que enseñan para siempre un ataque de incursión a un Pokémon de los tipos que dice. No se
// compran: salen como premio de incursión (con poca probabilidad; cada incursión da solo algunas, ver data/incursions) y
// se intercambian entre jugadores. Una por tipo. Para editar a mano.

/**
 * Cada MT por el ataque que enseña (`Tm.Senuelo`, como `IMOVE.Senuelo`). El valor es el id del ataque y se guarda en
 * la partida: no cambiarlo sin subir SAVE_VERSION
 */
export const Tm = {
  Senuelo: 'follow-me',
  Humareda: 'lava-plume',
  Escaldar: 'scald',
  AstaDrenaje: 'horn-leech',
  Chispazo: 'discharge',
  Liofilizacion: 'freeze-dry',
  GanchoAlto: 'sky-uppercut',
  PuyaNociva: 'poison-jab',
  FuerzaTelurica: 'lands-wrath',
  Respiro: 'roost',
  Reflejo: 'reflect',
  BolaDePolen: 'pollen-puff',
  JoyaDeLuz: 'power-gem',
  VientoAciago: 'ominous-wind',
  MartilloDragon: 'dragon-hammer',
  PulsoUmbrio: 'dark-pulse',
  PunoMeteoro: 'meteor-mash',
  CuraFloral: 'floral-healing',
} as const
export type Tm = (typeof Tm)[keyof typeof Tm]

interface TmInfo {
  move: IncursionMove
  /** La aprenden los Pokémon que tienen alguno de estos tipos */
  types: PokeType[]
  item: Item
}

const learnedBy = (move: IncursionMove, type: PokeType, item: Item): TmInfo => ({ move, types: [type], item })

export const TMS: Record<Tm, TmInfo> = {
  [Tm.Senuelo]: learnedBy(IMOVE.Senuelo, PokeType.Normal, ITEM.TmNormal),
  [Tm.Humareda]: learnedBy(IMOVE.Humareda, PokeType.Fire, ITEM.TmFire),
  [Tm.Escaldar]: learnedBy(IMOVE.Escaldar, PokeType.Water, ITEM.TmWater),
  [Tm.AstaDrenaje]: learnedBy(IMOVE.AstaDrenaje, PokeType.Grass, ITEM.TmGrass),
  [Tm.Chispazo]: learnedBy(IMOVE.Chispazo, PokeType.Electric, ITEM.TmElectric),
  [Tm.Liofilizacion]: learnedBy(IMOVE.Liofilizacion, PokeType.Ice, ITEM.TmIce),
  [Tm.GanchoAlto]: learnedBy(IMOVE.GanchoAlto, PokeType.Fighting, ITEM.TmFighting),
  [Tm.PuyaNociva]: learnedBy(IMOVE.PuyaNociva, PokeType.Poison, ITEM.TmPoison),
  [Tm.FuerzaTelurica]: learnedBy(IMOVE.FuerzaTelurica, PokeType.Ground, ITEM.TmGround),
  [Tm.Respiro]: learnedBy(IMOVE.Respiro, PokeType.Flying, ITEM.TmFlying),
  [Tm.Reflejo]: learnedBy(IMOVE.Reflejo, PokeType.Psychic, ITEM.TmPsychic),
  [Tm.BolaDePolen]: learnedBy(IMOVE.BolaDePolen, PokeType.Bug, ITEM.TmBug),
  [Tm.JoyaDeLuz]: learnedBy(IMOVE.JoyaDeLuz, PokeType.Rock, ITEM.TmRock),
  [Tm.VientoAciago]: learnedBy(IMOVE.VientoAciago, PokeType.Ghost, ITEM.TmGhost),
  [Tm.MartilloDragon]: learnedBy(IMOVE.MartilloDragon, PokeType.Dragon, ITEM.TmDragon),
  [Tm.PulsoUmbrio]: learnedBy(IMOVE.PulsoUmbrio, PokeType.Dark, ITEM.TmDark),
  [Tm.PunoMeteoro]: learnedBy(IMOVE.PunoMeteoro, PokeType.Steel, ITEM.TmSteel),
  [Tm.CuraFloral]: learnedBy(IMOVE.CuraFloral, PokeType.Fairy, ITEM.TmFairy),
}

export const TM_IDS = Object.values(Tm)

export const isTm = (v: unknown): v is Tm => (TM_IDS as unknown[]).includes(v)

/** «MT Señuelo» */
export const tmName = (tm: Tm): string => `MT ${TMS[tm].move.name}`
