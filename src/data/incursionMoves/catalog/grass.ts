import { StatusId } from '../../passives'
import { PokeType } from '../../types'
import { area, areaAll, drain, inflict, lower, raiseSelf, type IncursionMove } from '../effects'
import { catalogMove } from './catalogMove'

// Catálogo de ataques de tipo Planta: con la precisión de los juegos (catalogMove le suma la mejora). Para editar a mano.

export const GRASS_MOVES = {
  Absorber: catalogMove('absorb', 'Absorber', PokeType.Grass, 20, [drain(0.5)]),
  Megaagotar: catalogMove('mega-drain', 'Megaagotar', PokeType.Grass, 40, [drain(0.5)]),
  Gigadrenado: catalogMove('giga-drain', 'Gigadrenado', PokeType.Grass, 75, [drain(0.5)]),
  AstaDrenaje: catalogMove('horn-leech', 'Asta Drenaje', PokeType.Grass, 75, [drain(0.5)]),
  Follaje: catalogMove('leafage', 'Follaje', PokeType.Grass, 40),
  HojaAfilada: catalogMove('razor-leaf', 'Hoja Afilada', PokeType.Grass, 55, [area()], { accuracy: 95 }),
  HojaMagica: catalogMove('magical-leaf', 'Hoja Mágica', PokeType.Grass, 60),
  BrazoPincho: catalogMove('needle-arm', 'Brazo Pincho', PokeType.Grass, 60),
  CiclonDeHojas: catalogMove('leaf-tornado', 'Ciclón de Hojas', PokeType.Grass, 65, [], { accuracy: 90 }),
  PatadaTropical: catalogMove('trop-kick', 'Patada Tropical', PokeType.Grass, 70, [lower([{ stat: 'atk', stages: -1 }])]),
  BombaGermen: catalogMove('seed-bomb', 'Bomba Germen', PokeType.Grass, 80),
  AcidoMalico: catalogMove('apple-acid', 'Ácido Málico', PokeType.Grass, 80, [lower([{ stat: 'def', stages: -1 }])]),
  FuerzaG: catalogMove('grav-apple', 'Fuerza G', PokeType.Grass, 80, [lower([{ stat: 'def', stages: -1 }])]),
  BateriaAsalto: catalogMove('drum-beating', 'Batería Asalto', PokeType.Grass, 80, [lower([{ stat: 'spe', stages: -1 }])]),
  HojaAguda: catalogMove('leaf-blade', 'Hoja Aguda', PokeType.Grass, 90),
  TormentaFloral: catalogMove('petal-blizzard', 'Tormenta Floral', PokeType.Grass, 90, [areaAll()]),
  DanzaPetalo: catalogMove('petal-dance', 'Danza Pétalo', PokeType.Grass, 120),
  Latigazo: catalogMove('power-whip', 'Latigazo', PokeType.Grass, 120, [], { accuracy: 85 }),
  Mazazo: catalogMove('wood-hammer', 'Mazazo', PokeType.Grass, 120),
  Fogonazo: catalogMove('seed-flare', 'Fogonazo', PokeType.Grass, 120, [], { accuracy: 85 }),
  CuchillaSolar: catalogMove('solar-blade', 'Cuchilla Solar', PokeType.Grass, 125),
  LluviaHojas: catalogMove('leaf-storm', 'Lluvia Hojas', PokeType.Grass, 130, [], { accuracy: 90 }),
  Paralizador: catalogMove('stun-spore', 'Paralizador', PokeType.Grass, 0, [inflict(StatusId.Paralysis)], { accuracy: 75 }),
  Esporagodon: catalogMove('cotton-spore', 'Esporagodón', PokeType.Grass, 0, [lower([{ stat: 'spe', stages: -2 }]), area()]),
  RizoAlgodon: catalogMove('cotton-guard', 'Rizo Algodón', PokeType.Grass, 0, [raiseSelf([{ stat: 'def', stages: 3 }])]),
} satisfies Record<string, IncursionMove>
