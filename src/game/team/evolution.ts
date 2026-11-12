import { evolutionTo, type Evolution } from '../../data/evolutions'
import { RARITY_INFO, rarityOf, species } from '../../data/species'
import { STONES } from '../../data/stones'
import { markCaught } from '../collection/dex'
import { spendStarItem, starItemBlocker, starItemFor } from '../collection/starItems'
import { findMon, MonPlace, monPlace, ownedOfSpecies, type GameState, type OwnedMon } from '../core/state'
import { maxHp } from './stats'
import { spendStone, stonesOf } from './stones'

// Evolución desde la ficha: al llegar al nivel de su evolución o gastando una piedra, pagando según la rareza de la
// evolución (y su objeto estelar si no es común). Es el mismo Pokémon con otra especie: conserva nivel y EXP, pierde
// las ★ y queda con todos sus PS, en el mismo sitio (todos ocupan un espacio).

export interface EvolveResult {
  fromId: number
  intoId: number
}

/** ₽ que cuesta evolucionar a `intoId` (según su rareza) */
export const evolvePrice = (intoId: number): number => RARITY_INFO[rarityOf(species(intoId))].evolvePrice

/** Lo que pide la evolución en sí: su nivel o su piedra (null si lo cumple) */
function requirementBlocker(s: GameState, mon: OwnedMon, evo: Evolution): string | null {
  if (evo.stone !== undefined) return stonesOf(s, evo.stone) < 1 ? `Necesitas una ${STONES[evo.stone].name}.` : null
  return mon.level < evo.level ? `A Nv. ${evo.level} podrá evolucionar.` : null
}

/** Por qué no puede evolucionar a `intoId` (null si puede) */
export function evolveBlocker(s: GameState, uid: string, intoId: number): string | null {
  const mon = findMon(s, uid)
  if (!mon) return 'Ese Pokémon no existe.'
  const evo = evolutionTo(mon.speciesId, intoId)
  if (!evo) return `${species(mon.speciesId).name} no evoluciona a ${species(intoId).name}.`
  const place = monPlace(s, uid)
  if (place !== MonPlace.Ranch && place !== MonPlace.Box) return 'Solo puede evolucionar en el rancho o en la Caja.'
  const requirement = requirementBlocker(s, mon, evo)
  if (requirement) return requirement
  if (ownedOfSpecies(s, intoId)) return `Ya tienes a ${species(intoId).name}.`
  if (s.money < evolvePrice(intoId)) return `Necesitas ₽ ${evolvePrice(intoId)}.`
  const missingItem = starItemBlocker(s, intoId)
  if (missingItem) return missingItem
  return null
}

/**
 * Evoluciona: paga, gasta la piedra y el objeto estelar si hacen falta y el Pokémon cambia de especie. En la Pokédex
 * la especie de antes sigue como capturada y se puede volver a crear con sus piezas
 */
export function evolve(s: GameState, uid: string, intoId: number): EvolveResult | null {
  if (evolveBlocker(s, uid, intoId)) return null
  const mon = findMon(s, uid)!
  const evo = evolutionTo(mon.speciesId, intoId)!
  const fromId = mon.speciesId
  s.money -= evolvePrice(intoId)
  const item = starItemFor(intoId)
  if (item) spendStarItem(s, item)
  if (evo.stone !== undefined) spendStone(s, evo.stone)
  Object.assign(mon, { speciesId: intoId, stars: 0 })
  mon.hp = maxHp(mon)
  markCaught(s, intoId)
  return { fromId, intoId }
}
