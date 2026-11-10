import { StatusId } from '../../passives'
import { PokeType } from '../../types'
import { drain, inflict, lower, raiseSelf, type IncursionMove } from '../effects'
import { catalogMove } from './catalogMove'

// Catálogo de ataques de tipo Lucha: con la precisión de los juegos (catalogMove le suma la mejora). Para editar a mano.

export const FIGHTING_MOVES = {
  GolpeRoca: catalogMove('rock-smash', 'Golpe Roca', PokeType.Fighting, 40),
  OndaVacio: catalogMove('vacuum-wave', 'Onda Vacío', PokeType.Fighting, 40, [], { priority: 1 }),
  PunoIncremento: catalogMove('power-up-punch', 'Puño Incremento', PokeType.Fighting, 40, [raiseSelf([{ stat: 'atk', stages: 1 }])]),
  Palmeo: catalogMove('force-palm', 'Palmeo', PokeType.Fighting, 60, [inflict(StatusId.Paralysis, 0.3)]),
  PatadaGiro: catalogMove('rolling-kick', 'Patada Giro', PokeType.Fighting, 60, [], { accuracy: 85 }),
  LlaveGiro: catalogMove('circle-throw', 'Llave Giro', PokeType.Fighting, 60, [], { accuracy: 90 }),
  Puntapie: catalogMove('low-sweep', 'Puntapié', PokeType.Fighting, 65, [lower([{ stat: 'spe', stages: -1 }])]),
  TiroVital: catalogMove('vital-throw', 'Tiro Vital', PokeType.Fighting, 70, [], { priority: -1 }),
  Demolicion: catalogMove('brick-break', 'Demolición', PokeType.Fighting, 75),
  PunoDrenaje: catalogMove('drain-punch', 'Puño Drenaje', PokeType.Fighting, 75, [drain(0.5)]),
  Sumision: catalogMove('submission', 'Sumisión', PokeType.Fighting, 80, [], { accuracy: 80 }),
  GanchoAlto: catalogMove('sky-uppercut', 'Gancho Alto', PokeType.Fighting, 85, [], { accuracy: 90 }),
  EspadaMistica: catalogMove('secret-sword', 'Espada Mística', PokeType.Fighting, 85),
  EspadaSanta: catalogMove('sacred-sword', 'Espada Santa', PokeType.Fighting, 90),
  TajoCruzado: catalogMove('cross-chop', 'Tajo Cruzado', PokeType.Fighting, 100, [], { accuracy: 80 }),
  Machada: catalogMove('hammer-arm', 'Machada', PokeType.Fighting, 100, [], { accuracy: 90 }),
  PatadaSalto: catalogMove('jump-kick', 'Patada Salto', PokeType.Fighting, 100, [], { accuracy: 95 }),
  Punodinamico: catalogMove('dynamic-punch', 'Puñodinámico', PokeType.Fighting, 100, [inflict(StatusId.Confusion)], { accuracy: 50 }),
  FuerzaBruta: catalogMove('superpower', 'Fuerza Bruta', PokeType.Fighting, 120),
  PatadaSaltoAlta: catalogMove('high-jump-kick', 'Patada Salto Alta', PokeType.Fighting, 130, [], { accuracy: 90 }),
  BastionFinal: catalogMove('no-retreat', 'Bastión Final', PokeType.Fighting, 0, [raiseSelf([{ stat: 'atk', stages: 1 }, { stat: 'def', stages: 1 }, { stat: 'spe', stages: 1 }])]),
} satisfies Record<string, IncursionMove>
