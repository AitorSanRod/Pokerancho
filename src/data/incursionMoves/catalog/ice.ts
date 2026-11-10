import { StatusId } from '../../passives'
import { PokeType } from '../../types'
import { area, inflict, lower, type IncursionMove } from '../effects'
import { catalogMove } from './catalogMove'

// Catálogo de ataques de tipo Hielo: con la precisión de los juegos (catalogMove le suma la mejora). Para editar a mano.

export const ICE_MOVES = {
  PunoHielo: catalogMove('ice-punch', 'Puño Hielo', PokeType.Ice, 75, [inflict(StatusId.Freeze, 0.1)]),
  ColmilloHielo: catalogMove('ice-fang', 'Colmillo Hielo', PokeType.Ice, 65, [inflict(StatusId.Freeze, 0.1)], { accuracy: 95 }),
  Liofilizacion: catalogMove('freeze-dry', 'Liofilización', PokeType.Ice, 70, [inflict(StatusId.Freeze, 0.1)]),
  VientoHielo: catalogMove('icy-wind', 'Viento Hielo', PokeType.Ice, 55, [lower([{ stat: 'spe', stages: -1 }]), area()], { accuracy: 95 }),
  MundoGelido: catalogMove('glaciate', 'Mundo Gélido', PokeType.Ice, 65, [lower([{ stat: 'spe', stages: -1 }]), area()], { accuracy: 95 }),
  RayoAurora: catalogMove('aurora-beam', 'Rayo Aurora', PokeType.Ice, 65),
  VahoGelido: catalogMove('frost-breath', 'Vaho Gélido', PokeType.Ice, 60, [], { accuracy: 90 }),
  Chuzos: catalogMove('icicle-crash', 'Chuzos', PokeType.Ice, 85, [], { accuracy: 90 }),
  MartilloHielo: catalogMove('ice-hammer', 'Martillo Hielo', PokeType.Ice, 100, [], { accuracy: 90 }),
  LlamaGelida: catalogMove('ice-burn', 'Llama Gélida', PokeType.Ice, 140, [inflict(StatusId.Burn, 0.3)], { accuracy: 90 }),
} satisfies Record<string, IncursionMove>
