import { StatusId } from '../../passives'
import { PokeType } from '../../types'
import { inflict, type IncursionMove } from '../effects'
import { catalogMove } from './catalogMove'

// Catálogo de ataques de tipo Fantasma: con la precisión de los juegos (catalogMove le suma la mejora). Para editar a mano.

export const GHOST_MOVES = {
  Lenguetazo: catalogMove('lick', 'Lengüetazo', PokeType.Ghost, 30, [inflict(StatusId.Paralysis, 0.3)]),
  Impresionar: catalogMove('astonish', 'Impresionar', PokeType.Ghost, 30),
  PunoSombra: catalogMove('shadow-punch', 'Puño Sombra', PokeType.Ghost, 60),
  VientoAciago: catalogMove('ominous-wind', 'Viento Aciago', PokeType.Ghost, 60),
  GarraUmbria: catalogMove('shadow-claw', 'Garra Umbría', PokeType.Ghost, 70),
} satisfies Record<string, IncursionMove>
