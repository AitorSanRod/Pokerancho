import { StatusId } from '../../passives'
import { PokeType } from '../../types'
import { area, drain, healAlly, inflict, lower, type IncursionMove } from '../effects'
import { catalogMove, SINGLE_HEAL_POWER } from './catalogMove'

// Catálogo de ataques de tipo Volador: con la precisión de los juegos (catalogMove le suma la mejora). Para editar a mano.

export const FLYING_MOVES = {
  Picotazo: catalogMove('peck', 'Picotazo', PokeType.Flying, 35),
  AtaqueAla: catalogMove('wing-attack', 'Ataque Ala', PokeType.Flying, 60),
  GolpeAereo: catalogMove('aerial-ace', 'Golpe Aéreo', PokeType.Flying, 60),
  Picoteo: catalogMove('pluck', 'Picoteo', PokeType.Flying, 60),
  AireAfilado: catalogMove('air-cutter', 'Aire Afilado', PokeType.Flying, 60, [area()], { accuracy: 95 }),
  Chachara: catalogMove('chatter', 'Cháchara', PokeType.Flying, 65, [inflict(StatusId.Confusion)]),
  TajoAereo: catalogMove('air-slash', 'Tajo Aéreo', PokeType.Flying, 75, [], { accuracy: 95 }),
  PicoTaladro: catalogMove('drill-peck', 'Pico Taladro', PokeType.Flying, 80),
  AlaMortifera: catalogMove('oblivion-wing', 'Ala Mortífera', PokeType.Flying, 80, [drain(0.75)]),
  Bote: catalogMove('bounce', 'Bote', PokeType.Flying, 85, [inflict(StatusId.Paralysis, 0.3)], { accuracy: 85 }),
  Aerochorro: catalogMove('aeroblast', 'Aerochorro', PokeType.Flying, 100, [], { accuracy: 95 }),
  PajaroOsado: catalogMove('brave-bird', 'Pájaro Osado', PokeType.Flying, 120),
  AscensoDraco: catalogMove('dragon-ascent', 'Ascenso Draco', PokeType.Flying, 120),
  DanzaPluma: catalogMove('feather-dance', 'Danza Pluma', PokeType.Flying, 0, [lower([{ stat: 'atk', stages: -2 }])]),
  Respiro: catalogMove('roost', 'Respiro', PokeType.Flying, SINGLE_HEAL_POWER, [healAlly(1)]),
} satisfies Record<string, IncursionMove>
