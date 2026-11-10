import { StatusId } from '../../passives'
import { PokeType } from '../../types'
import { area, areaAll, healTeam, inflict, lower, raiseSelf, type IncursionMove } from '../effects'
import { catalogMove, TEAM_HEAL_POWER } from './catalogMove'

// Catálogo de ataques de tipo Agua: con la precisión de los juegos (catalogMove le suma la mejora). Para editar a mano.

export const WATER_MOVES = {
  Burbuja: catalogMove('bubble', 'Burbuja', PokeType.Water, 40, [area()]),
  RayoBurbuja: catalogMove('bubble-beam', 'Rayo Burbuja', PokeType.Water, 65),
  Hidropulso: catalogMove('water-pulse', 'Hidropulso', PokeType.Water, 60, [inflict(StatusId.Confusion, 0.2)]),
  Tenaza: catalogMove('clamp', 'Tenaza', PokeType.Water, 35, [], { accuracy: 85 }),
  Torbellino: catalogMove('whirlpool', 'Torbellino', PokeType.Water, 35, [], { accuracy: 85 }),
  Pulpocanon: catalogMove('octazooka', 'Pulpocañón', PokeType.Water, 65, [], { accuracy: 85 }),
  Cascada: catalogMove('waterfall', 'Cascada', PokeType.Water, 80),
  Buceo: catalogMove('dive', 'Buceo', PokeType.Water, 80),
  Escaldar: catalogMove('scald', 'Escaldar', PokeType.Water, 80, [inflict(StatusId.Burn, 0.3)]),
  ConchaFilo: catalogMove('razor-shell', 'Concha Filo', PokeType.Water, 75, [], { accuracy: 95 }),
  Hidroariete: catalogMove('liquidation', 'Hidroariete', PokeType.Water, 85),
  AcuaCola: catalogMove('aqua-tail', 'Acua Cola', PokeType.Water, 90, [], { accuracy: 90 }),
  AguaLodosa: catalogMove('muddy-water', 'Agua Lodosa', PokeType.Water, 90, [area()], { accuracy: 85 }),
  AriaBurbuja: catalogMove('sparkling-aria', 'Aria Burbuja', PokeType.Water, 90, [areaAll()]),
  Martillazo: catalogMove('crabhammer', 'Martillazo', PokeType.Water, 100, [], { accuracy: 90 }),
  PulsoPrimigenio: catalogMove('origin-pulse', 'Pulso Primigenio', PokeType.Water, 110, [area()], { accuracy: 85 }),
  DisparoCertero: catalogMove('snipe-shot', 'Disparo Certero', PokeType.Water, 80),
  Viraje: catalogMove('flip-turn', 'Viraje', PokeType.Water, 60),
  PunoJet: catalogMove('jet-punch', 'Puño Jet', PokeType.Water, 60, [], { priority: 1 }),
  AguaFria: catalogMove('chilling-water', 'Agua Fría', PokeType.Water, 50, [lower([{ stat: 'atk', stages: -1 }])]),
  Refugio: catalogMove('withdraw', 'Refugio', PokeType.Water, 0, [raiseSelf([{ stat: 'def', stages: 1 }])]),
  RocioVital: catalogMove('life-dew', 'Rocío Vital', PokeType.Water, TEAM_HEAL_POWER, [healTeam(1)]),
} satisfies Record<string, IncursionMove>
