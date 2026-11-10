import { StatusId } from '../../passives'
import { PokeType } from '../../types'
import { inflict, type IncursionMove } from '../effects'
import { catalogMove } from './catalogMove'

// Catálogo de ataques de tipo Dragón: con la precisión de los juegos (catalogMove le suma la mejora). Para editar a mano.

export const DRAGON_MOVES = {
  Dragoaliento: catalogMove('dragon-breath', 'Dragoaliento', PokeType.Dragon, 60, [inflict(StatusId.Paralysis, 0.3)]),
  ColaDragon: catalogMove('dragon-tail', 'Cola Dragón', PokeType.Dragon, 60, [], { accuracy: 90 }),
  MartilloDragon: catalogMove('dragon-hammer', 'Martillo Dragón', PokeType.Dragon, 90),
  CargaDragon: catalogMove('dragon-rush', 'Carga Dragón', PokeType.Dragon, 100, [], { accuracy: 75 }),
  CorteVacio: catalogMove('spacial-rend', 'Corte Vacío', PokeType.Dragon, 100, [], { accuracy: 95 }),
  CometaDraco: catalogMove('draco-meteor', 'Cometa Draco', PokeType.Dragon, 130, [], { accuracy: 90 }),
  Distorsion: catalogMove('roar-of-time', 'Distorsión', PokeType.Dragon, 150, [], { accuracy: 90 }),
} satisfies Record<string, IncursionMove>
