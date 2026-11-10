import { StatusId } from '../../passives'
import { PokeType } from '../../types'
import { area, areaAll, inflict, lower, raiseSelf, type IncursionMove } from '../effects'
import { catalogMove } from './catalogMove'

// Catálogo de ataques de tipo Fuego: con la precisión de los juegos (catalogMove le suma la mejora). Para editar a mano.

export const FIRE_MOVES = {
  PunoFuego: catalogMove('fire-punch', 'Puño Fuego', PokeType.Fire, 75, [inflict(StatusId.Burn, 0.1)]),
  RuedaFuego: catalogMove('flame-wheel', 'Rueda Fuego', PokeType.Fire, 60, [inflict(StatusId.Burn, 0.1)]),
  ColmilloIgneo: catalogMove('fire-fang', 'Colmillo Ígneo', PokeType.Fire, 65, [inflict(StatusId.Burn, 0.1)], { accuracy: 95 }),
  PatadaIgnea: catalogMove('blaze-kick', 'Patada Ígnea', PokeType.Fire, 85, [inflict(StatusId.Burn, 0.1)], { accuracy: 90 }),
  OndaIgnea: catalogMove('heat-wave', 'Onda Ígnea', PokeType.Fire, 95, [inflict(StatusId.Burn, 0.1), area()], { accuracy: 90 }),
  Humareda: catalogMove('lava-plume', 'Humareda', PokeType.Fire, 80, [inflict(StatusId.Burn, 0.3), areaAll()]),
  BombaIgnea: catalogMove('searing-shot', 'Bomba Ígnea', PokeType.Fire, 100, [inflict(StatusId.Burn, 0.3), areaAll()]),
  Calcinacion: catalogMove('incinerate', 'Calcinación', PokeType.Fire, 60, [area()]),
  EnviteIgneo: catalogMove('flare-blitz', 'Envite Ígneo', PokeType.Fire, 120, [inflict(StatusId.Burn, 0.1)]),
  Infierno: catalogMove('inferno', 'Infierno', PokeType.Fire, 100, [inflict(StatusId.Burn)], { accuracy: 50 }),
  FuegoSagrado: catalogMove('sacred-fire', 'Fuego Sagrado', PokeType.Fire, 100, [inflict(StatusId.Burn, 0.5)], { accuracy: 95 }),
  LlamaAzul: catalogMove('blue-flare', 'Llama Azul', PokeType.Fire, 130, [inflict(StatusId.Burn, 0.2)], { accuracy: 85 }),
  BalonIgneo: catalogMove('pyro-ball', 'Balón Ígneo', PokeType.Fire, 120, [inflict(StatusId.Burn, 0.1)], { accuracy: 90 }),
  LlamaFusion: catalogMove('fusion-flare', 'Llama Fusión', PokeType.Fire, 100),
  Nitrocarga: catalogMove('flame-charge', 'Nitrocarga', PokeType.Fire, 50, [raiseSelf([{ stat: 'spe', stages: 1 }])]),
  CantoArdiente: catalogMove('torch-song', 'Canto Ardiente', PokeType.Fire, 80, [raiseSelf([{ stat: 'atk', stages: 1 }])]),
  LlamaEmbrujada: catalogMove('mystical-fire', 'Llama Embrujada', PokeType.Fire, 75, [lower([{ stat: 'atk', stages: -1 }])]),
  LatigoIgneo: catalogMove('fire-lash', 'Látigo Ígneo', PokeType.Fire, 80, [lower([{ stat: 'def', stages: -1 }])]),
  GiroFuego: catalogMove('fire-spin', 'Giro Fuego', PokeType.Fire, 35, [], { accuracy: 85 }),
  Pirotecnia: catalogMove('flame-burst', 'Pirotecnia', PokeType.Fire, 70),
  LluviaIgnea: catalogMove('magma-storm', 'Lluvia Ígnea', PokeType.Fire, 100, [], { accuracy: 75 }),
  LlamaFinal: catalogMove('burn-up', 'Llama Final', PokeType.Fire, 130),
  AnilloIgneo: catalogMove('blast-burn', 'Anillo Ígneo', PokeType.Fire, 150, [], { accuracy: 90 }),
  VDeFuego: catalogMove('v-create', 'V de Fuego', PokeType.Fire, 180, [], { accuracy: 95 }),
  CanonArmadura: catalogMove('armor-cannon', 'Cañón Armadura', PokeType.Fire, 120),
} satisfies Record<string, IncursionMove>
