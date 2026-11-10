import { StatusId } from '../../passives'
import { PokeType } from '../../types'
import { area, inflict, lower, raiseSelf, type IncursionMove } from '../effects'
import { catalogMove } from './catalogMove'

// Catálogo de ataques de tipo Veneno: con la precisión de los juegos (catalogMove le suma la mejora). Para editar a mano.

export const POISON_MOVES = {
  PicotazoVeneno: catalogMove('poison-sting', 'Picotazo Veneno', PokeType.Poison, 15, [inflict(StatusId.Poison, 0.3)]),
  Polucion: catalogMove('smog', 'Polución', PokeType.Poison, 30, [inflict(StatusId.Poison, 0.4)], { accuracy: 70 }),
  BombaAcida: catalogMove('acid-spray', 'Bomba Ácida', PokeType.Poison, 40, [lower([{ stat: 'def', stages: -2 }])]),
  ColmilloVeneno: catalogMove('poison-fang', 'Colmillo Veneno', PokeType.Poison, 50, [inflict(StatusId.Poison, 0.5)]),
  ColaVeneno: catalogMove('poison-tail', 'Cola Veneno', PokeType.Poison, 50, [inflict(StatusId.Poison, 0.1)]),
  NieblaClara: catalogMove('clear-smog', 'Niebla Clara', PokeType.Poison, 50),
  Residuos: catalogMove('sludge', 'Residuos', PokeType.Poison, 65, [inflict(StatusId.Poison, 0.3)]),
  VenenoX: catalogMove('cross-poison', 'Veneno X', PokeType.Poison, 70, [inflict(StatusId.Poison, 0.1)]),
  PuyaNociva: catalogMove('poison-jab', 'Puya Nociva', PokeType.Poison, 80, [inflict(StatusId.Poison, 0.3)]),
  PolvoVeneno: catalogMove('poison-powder', 'Polvo Veneno', PokeType.Poison, 0, [inflict(StatusId.Poison)], { accuracy: 75 }),
  GasVenenoso: catalogMove('poison-gas', 'Gas Venenoso', PokeType.Poison, 0, [inflict(StatusId.Poison), area()], { accuracy: 90 }),
  HiloVenenoso: catalogMove('toxic-thread', 'Hilo Venenoso', PokeType.Poison, 0, [inflict(StatusId.Poison), lower([{ stat: 'spe', stages: -1 }])]),
  ArmaduraAcida: catalogMove('acid-armor', 'Armadura Ácida', PokeType.Poison, 0, [raiseSelf([{ stat: 'def', stages: 2 }])]),
  Enrosque: catalogMove('coil', 'Enrosque', PokeType.Poison, 0, [raiseSelf([{ stat: 'atk', stages: 1 }, { stat: 'def', stages: 1 }])]),
} satisfies Record<string, IncursionMove>
