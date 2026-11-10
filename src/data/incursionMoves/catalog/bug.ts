import { StatusId } from '../../passives'
import { PokeType } from '../../types'
import { area, drain, healAlly, inflict, lower, raiseSelf, taunt, type IncursionMove } from '../effects'
import { catalogMove, REDIRECT_GUARD, SINGLE_HEAL_POWER } from './catalogMove'

// Catálogo de ataques de tipo Bicho: con la precisión de los juegos (catalogMove le suma la mejora). Para editar a mano.

export const BUG_MOVES = {
  Acoso: catalogMove('infestation', 'Acoso', PokeType.Bug, 20),
  Estoicismo: catalogMove('struggle-bug', 'Estoicismo', PokeType.Bug, 50, [lower([{ stat: 'atk', stages: -1 }]), area()]),
  Picadura: catalogMove('bug-bite', 'Picadura', PokeType.Bug, 60),
  VientoPlata: catalogMove('silver-wind', 'Viento Plata', PokeType.Bug, 60),
  RodilloDePuas: catalogMove('steamroller', 'Rodillo de Púas', PokeType.Bug, 65),
  IdaYVuelta: catalogMove('u-turn', 'Ida y Vuelta', PokeType.Bug, 70),
  DobleRayo: catalogMove('signal-beam', 'Doble Rayo', PokeType.Bug, 75, [inflict(StatusId.Confusion, 0.1)]),
  Chupavidas: catalogMove('leech-life', 'Chupavidas', PokeType.Bug, 80, [drain(0.5)]),
  Plancha: catalogMove('lunge', 'Plancha', PokeType.Bug, 80, [lower([{ stat: 'atk', stages: -1 }])]),
  AlAtaque: catalogMove('attack-order', 'Al Ataque', PokeType.Bug, 90),
  BolaDePolen: catalogMove('pollen-puff', 'Bola de Polen', PokeType.Bug, 90),
  DisparoDemora: catalogMove('string-shot', 'Disparo Demora', PokeType.Bug, 0, [lower([{ stat: 'spe', stages: -2 }]), area()], { accuracy: 95 }),
  ADefender: catalogMove('defend-order', 'A Defender', PokeType.Bug, 0, [raiseSelf([{ stat: 'def', stages: 1 }])]),
  Auxilio: catalogMove('heal-order', 'Auxilio', PokeType.Bug, SINGLE_HEAL_POWER, [healAlly(1)]),
  PolvoIra: catalogMove('rage-powder', 'Polvo Ira', PokeType.Bug, 0, [taunt(REDIRECT_GUARD)], { priority: 2 }),
} satisfies Record<string, IncursionMove>
