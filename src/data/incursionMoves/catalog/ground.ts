import { StatusId } from '../../passives'
import { PokeType } from '../../types'
import { area, areaAll, healAlly, inflict, lower, type IncursionMove } from '../effects'
import { catalogMove, SINGLE_HEAL_POWER } from './catalogMove'

// Catálogo de ataques de tipo Tierra: con la precisión de los juegos (catalogMove le suma la mejora). Para editar a mano.

export const GROUND_MOVES = {
  BucleArena: catalogMove('sand-tomb', 'Bucle Arena', PokeType.Ground, 35, [], { accuracy: 85 }),
  DisparoLodo: catalogMove('mud-shot', 'Disparo Lodo', PokeType.Ground, 55, [lower([{ stat: 'spe', stages: -1 }])], { accuracy: 95 }),
  Terratemblor: catalogMove('bulldoze', 'Terratemblor', PokeType.Ground, 60, [lower([{ stat: 'spe', stages: -1 }]), areaAll()]),
  HuesoPalo: catalogMove('bone-club', 'Hueso Palo', PokeType.Ground, 65, [], { accuracy: 85 }),
  BombaFango: catalogMove('mud-bomb', 'Bomba Fango', PokeType.Ground, 65, [], { accuracy: 85 }),
  ArenasArdientes: catalogMove('scorching-sands', 'Arenas Ardientes', PokeType.Ground, 70, [inflict(StatusId.Burn, 0.3)]),
  Excavar: catalogMove('dig', 'Excavar', PokeType.Ground, 80),
  Taladradora: catalogMove('drill-run', 'Taladradora', PokeType.Ground, 80, [], { accuracy: 95 }),
  MilFlechas: catalogMove('thousand-arrows', 'Mil Flechas', PokeType.Ground, 90, [area()]),
  MilTemblores: catalogMove('thousand-waves', 'Mil Temblores', PokeType.Ground, 90, [area()]),
  FuerzaTelurica: catalogMove('lands-wrath', 'Fuerza Telúrica', PokeType.Ground, 90, [area()]),
  FuerzaEquina: catalogMove('high-horsepower', 'Fuerza Equina', PokeType.Ground, 95, [], { accuracy: 95 }),
  Recogearena: catalogMove('shore-up', 'Recogearena', PokeType.Ground, SINGLE_HEAL_POWER, [healAlly(1)]),
} satisfies Record<string, IncursionMove>
