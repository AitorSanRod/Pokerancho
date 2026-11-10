import { PokeType } from '../../types'
import { area, lower, raiseSelf, type IncursionMove } from '../effects'
import { catalogMove } from './catalogMove'

// Catálogo de ataques de tipo Siniestro: con la precisión de los juegos (catalogMove le suma la mejora). Para editar a mano.

export const DARK_MOVES = {
  Ladron: catalogMove('thief', 'Ladrón', PokeType.Dark, 60),
  Finta: catalogMove('feint-attack', 'Finta', PokeType.Dark, 60),
  Alarido: catalogMove('snarl', 'Alarido', PokeType.Dark, 55, [lower([{ stat: 'atk', stages: -1 }]), area()], { accuracy: 95 }),
  Desarme: catalogMove('knock-off', 'Desarme', PokeType.Dark, 65),
  TajoUmbrio: catalogMove('night-slash', 'Tajo Umbrío', PokeType.Dark, 70),
  PulsoUmbrio: catalogMove('dark-pulse', 'Pulso Umbrío', PokeType.Dark, 80),
  GolpeMordaza: catalogMove('throat-chop', 'Golpe Mordaza', PokeType.Dark, 80),
  LariatOscuro: catalogMove('darkest-lariat', 'Lariat Oscuro', PokeType.Dark, 85),
  CercoDimension: catalogMove('hyperspace-fury', 'Cerco Dimensión', PokeType.Dark, 100),
  Maquinacion: catalogMove('nasty-plot', 'Maquinación', PokeType.Dark, 0, [raiseSelf([{ stat: 'atk', stages: 2 }])]),
  Afilagarras: catalogMove('hone-claws', 'Afilagarras', PokeType.Dark, 0, [raiseSelf([{ stat: 'atk', stages: 1 }])]),
} satisfies Record<string, IncursionMove>
