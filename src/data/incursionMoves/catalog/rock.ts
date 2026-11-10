import { PokeType } from '../../types'
import { lower, raiseSelf, type IncursionMove } from '../effects'
import { catalogMove } from './catalogMove'

// Catálogo de ataques de tipo Roca: con la precisión de los juegos (catalogMove le suma la mejora). Para editar a mano.

export const ROCK_MOVES = {
  RocaVeloz: catalogMove('accelerock', 'Roca Veloz', PokeType.Rock, 40, [], { priority: 1 }),
  Antiaereo: catalogMove('smack-down', 'Antiaéreo', PokeType.Rock, 50),
  PoderPasado: catalogMove('ancient-power', 'Poder Pasado', PokeType.Rock, 60),
  TumbaRocas: catalogMove('rock-tomb', 'Tumba Rocas', PokeType.Rock, 60, [lower([{ stat: 'spe', stages: -1 }])], { accuracy: 95 }),
  JoyaDeLuz: catalogMove('power-gem', 'Joya de Luz', PokeType.Rock, 80),
  Romperrocas: catalogMove('rock-wrecker', 'Romperrocas', PokeType.Rock, 150, [], { accuracy: 90 }),
  Pulimento: catalogMove('rock-polish', 'Pulimento', PokeType.Rock, 0, [raiseSelf([{ stat: 'spe', stages: 2 }])]),
} satisfies Record<string, IncursionMove>
