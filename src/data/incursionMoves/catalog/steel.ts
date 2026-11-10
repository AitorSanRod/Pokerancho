import { PokeType } from '../../types'
import { lower, raiseSelf, type IncursionMove } from '../effects'
import { catalogMove } from './catalogMove'

// Catálogo de ataques de tipo Acero: con la precisión de los juegos (catalogMove le suma la mejora). Para editar a mano.

export const STEEL_MOVES = {
  BombaIman: catalogMove('magnet-bomb', 'Bomba Imán', PokeType.Steel, 60),
  DisparoEspejo: catalogMove('mirror-shot', 'Disparo Espejo', PokeType.Steel, 65, [], { accuracy: 85 }),
  AlaDeAcero: catalogMove('steel-wing', 'Ala de Acero', PokeType.Steel, 70, [], { accuracy: 90 }),
  CuernoCertero: catalogMove('smart-strike', 'Cuerno Certero', PokeType.Steel, 70),
  Anclaje: catalogMove('anchor-shot', 'Anclaje', PokeType.Steel, 80),
  PunoMeteoro: catalogMove('meteor-mash', 'Puño Meteoro', PokeType.Steel, 90, [], { accuracy: 90 }),
  Meteoimpacto: catalogMove('sunsteel-strike', 'Meteoimpacto', PokeType.Steel, 100),
  Metalaser: catalogMove('steel-beam', 'Metaláser', PokeType.Steel, 140, [], { accuracy: 95 }),
  EcoMetalico: catalogMove('metal-sound', 'Eco Metálico', PokeType.Steel, 0, [lower([{ stat: 'def', stages: -2 }])], { accuracy: 85 }),
  Aligerar: catalogMove('autotomize', 'Aligerar', PokeType.Steel, 0, [raiseSelf([{ stat: 'spe', stages: 2 }])]),
  Cambiomarcha: catalogMove('shift-gear', 'Cambiomarcha', PokeType.Steel, 0, [raiseSelf([{ stat: 'atk', stages: 1 }, { stat: 'spe', stages: 2 }])]),
} satisfies Record<string, IncursionMove>
