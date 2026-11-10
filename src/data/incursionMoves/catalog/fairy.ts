import { StatusId } from '../../passives'
import { PokeType } from '../../types'
import { area, drain, healAlly, inflict, lower, type IncursionMove } from '../effects'
import { catalogMove, SINGLE_HEAL_POWER } from './catalogMove'

// Catálogo de ataques de tipo Hada: con la precisión de los juegos (catalogMove le suma la mejora). Para editar a mano.

export const FAIRY_MOVES = {
  VozCautivadora: catalogMove('disarming-voice', 'Voz Cautivadora', PokeType.Fairy, 40, [area()]),
  BesoDrenaje: catalogMove('draining-kiss', 'Beso Drenaje', PokeType.Fairy, 50, [drain(0.75)]),
  Carantona: catalogMove('play-rough', 'Carantoña', PokeType.Fairy, 90, [], { accuracy: 90 }),
  CanonFloral: catalogMove('fleur-cannon', 'Cañón Floral', PokeType.Fairy, 130, [], { accuracy: 90 }),
  Encanto: catalogMove('charm', 'Encanto', PokeType.Fairy, 0, [lower([{ stat: 'atk', stages: -2 }])]),
  OjitosTiernos: catalogMove('baby-doll-eyes', 'Ojitos Tiernos', PokeType.Fairy, 0, [lower([{ stat: 'atk', stages: -1 }])], { priority: 1 }),
  BesoDulce: catalogMove('sweet-kiss', 'Beso Dulce', PokeType.Fairy, 0, [inflict(StatusId.Confusion)], { accuracy: 75 }),
  CuraFloral: catalogMove('floral-healing', 'Cura Floral', PokeType.Fairy, SINGLE_HEAL_POWER, [healAlly(1)]),
} satisfies Record<string, IncursionMove>
