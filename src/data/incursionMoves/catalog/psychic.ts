import { StatusId } from '../../passives'
import { PokeType } from '../../types'
import { inflict, raise, raiseSelf, type IncursionMove } from '../effects'
import { catalogMove } from './catalogMove'

// Catálogo de ataques de tipo Psíquico: con la precisión de los juegos (catalogMove le suma la mejora). Para editar a mano.

export const PSYCHIC_MOVES = {
  Psicorrayo: catalogMove('psybeam', 'Psicorrayo', PokeType.Psychic, 65, [inflict(StatusId.Confusion, 0.1)]),
  Psicocorte: catalogMove('psycho-cut', 'Psicocorte', PokeType.Psychic, 70),
  Resplandor: catalogMove('luster-purge', 'Resplandor', PokeType.Psychic, 70),
  BolaNeblina: catalogMove('mist-ball', 'Bola Neblina', PokeType.Psychic, 70),
  CabezazoZen: catalogMove('zen-headbutt', 'Cabezazo Zen', PokeType.Psychic, 80, [], { accuracy: 90 }),
  Psicocarga: catalogMove('psyshock', 'Psicocarga', PokeType.Psychic, 80),
  Paranormal: catalogMove('extrasensory', 'Paranormal', PokeType.Psychic, 80),
  Psicocolmillo: catalogMove('psychic-fangs', 'Psicocolmillo', PokeType.Psychic, 85),
  GeiserFotonico: catalogMove('photon-geyser', 'Géiser Fotónico', PokeType.Psychic, 100),
  LaserPrisma: catalogMove('prismatic-laser', 'Láser Prisma', PokeType.Psychic, 160),
  PazMental: catalogMove('calm-mind', 'Paz Mental', PokeType.Psychic, 0, [raiseSelf([{ stat: 'atk', stages: 1 }, { stat: 'def', stages: 1 }])]),
  Agilidad: catalogMove('agility', 'Agilidad', PokeType.Psychic, 0, [raiseSelf([{ stat: 'spe', stages: 2 }])]),
  Barrera: catalogMove('barrier', 'Barrera', PokeType.Psychic, 0, [raiseSelf([{ stat: 'def', stages: 2 }])]),
  Amnesia: catalogMove('amnesia', 'Amnesia', PokeType.Psychic, 0, [raiseSelf([{ stat: 'def', stages: 2 }])]),
  MasaCosmica: catalogMove('cosmic-power', 'Masa Cósmica', PokeType.Psychic, 0, [raiseSelf([{ stat: 'def', stages: 1 }])]),
  Meditacion: catalogMove('meditate', 'Meditación', PokeType.Psychic, 0, [raiseSelf([{ stat: 'atk', stages: 1 }])]),
  Reflejo: catalogMove('reflect', 'Reflejo', PokeType.Psychic, 0, [raise([{ stat: 'def', stages: 1 }])]),
  PantallaDeLuz: catalogMove('light-screen', 'Pantalla de Luz', PokeType.Psychic, 0, [raise([{ stat: 'def', stages: 1 }])]),
  Hipnosis: catalogMove('hypnosis', 'Hipnosis', PokeType.Psychic, 0, [inflict(StatusId.Sleep)], { accuracy: 60 }),
} satisfies Record<string, IncursionMove>
