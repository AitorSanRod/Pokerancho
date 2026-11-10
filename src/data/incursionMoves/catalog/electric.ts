import { StatusId } from '../../passives'
import { PokeType } from '../../types'
import { area, areaAll, drain, inflict, lower, type IncursionMove } from '../effects'
import { catalogMove } from './catalogMove'

// Catálogo de ataques de tipo Eléctrico: con la precisión de los juegos (catalogMove le suma la mejora). Para editar a mano.

export const ELECTRIC_MOVES = {
  PunoTrueno: catalogMove('thunder-punch', 'Puño Trueno', PokeType.Electric, 75, [inflict(StatusId.Paralysis, 0.1)]),
  ColmilloRayo: catalogMove('thunder-fang', 'Colmillo Rayo', PokeType.Electric, 65, [inflict(StatusId.Paralysis, 0.1)], { accuracy: 95 }),
  Chispa: catalogMove('spark', 'Chispa', PokeType.Electric, 65, [inflict(StatusId.Paralysis, 0.3)]),
  Chispazo: catalogMove('discharge', 'Chispazo', PokeType.Electric, 80, [inflict(StatusId.Paralysis, 0.3), areaAll()]),
  MofleteEstatico: catalogMove('nuzzle', 'Moflete Estático', PokeType.Electric, 20, [inflict(StatusId.Paralysis)]),
  Electrocanon: catalogMove('zap-cannon', 'Electrocañón', PokeType.Electric, 120, [inflict(StatusId.Paralysis)], { accuracy: 50 }),
  AtaqueFulgor: catalogMove('bolt-strike', 'Ataque Fulgor', PokeType.Electric, 130, [inflict(StatusId.Paralysis, 0.2)], { accuracy: 85 }),
  OndaVoltio: catalogMove('shock-wave', 'Onda Voltio', PokeType.Electric, 60),
  RayoCarga: catalogMove('charge-beam', 'Rayo Carga', PokeType.Electric, 50, [], { accuracy: 90 }),
  Electrotela: catalogMove('electroweb', 'Electrotela', PokeType.Electric, 55, [lower([{ stat: 'spe', stages: -1 }]), area()], { accuracy: 95 }),
  CargaParabola: catalogMove('parabolic-charge', 'Carga Parábola', PokeType.Electric, 65, [drain(0.5), areaAll()]),
  Voltiocambio: catalogMove('volt-switch', 'Voltiocambio', PokeType.Electric, 70),
  VoltioCruel: catalogMove('wild-charge', 'Voltio Cruel', PokeType.Electric, 90),
  Electropunzada: catalogMove('zing-zap', 'Electropunzada', PokeType.Electric, 80),
  RayoFusion: catalogMove('fusion-bolt', 'Rayo Fusión', PokeType.Electric, 100),
  PunosPlasma: catalogMove('plasma-fists', 'Puños Plasma', PokeType.Electric, 100),
  OndaAnomala: catalogMove('eerie-impulse', 'Onda Anómala', PokeType.Electric, 0, [lower([{ stat: 'atk', stages: -2 }])]),
} satisfies Record<string, IncursionMove>
