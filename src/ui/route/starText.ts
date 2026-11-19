import { species } from '../../data/species'
import { TYPE_INFO, type PokeType } from '../../data/types'
import { StarGoal, type RouteStar } from '../../game/run/routeStars'

/** «Agua», «Agua o Planta», «Agua, Planta o Bicho» */
function typeList(types: PokeType[]): string {
  const names = types.map((t) => TYPE_INFO[t].name)
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} o ${names[names.length - 1]}`
}

/** Qué hay que hacer para conseguir la estrella */
export function starGoalText(star: RouteStar): string {
  switch (star.goal) {
    case StarGoal.Complete:
      return 'Completa la ruta'
    case StarGoal.LevelCap:
      return `Complétala saliendo con un Pokémon de Nv. ${star.level} o menos`
    case StarGoal.SeeAll:
      return 'Complétala con todas sus especies descubiertas en la Pokédex'
    case StarGoal.WithSpecies:
      return `Complétala con ${species(star.speciesId).name} o una de sus evoluciones`
    case StarGoal.MonType:
      return `Complétala con un Pokémon de tipo ${TYPE_INFO[star.type].name}`
    case StarGoal.NoRanchPassives:
      return 'Complétala sin ninguna pasiva de rancho'
    case StarGoal.OnlyPassiveTypes:
      return `Complétala con pasivas de rancho solo de tipo ${typeList(star.types)}`
    case StarGoal.MinHp:
      return `Complétala sin bajar nunca del ${star.percent} % de PS`
  }
}
