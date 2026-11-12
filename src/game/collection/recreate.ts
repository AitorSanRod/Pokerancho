import { MissionKind } from '../../data/dailyMissions'
import { RARITY_INFO, rarityOf, species } from '../../data/species'
import type { Rng } from '../core/random'
import { MonPlace, monPlace, ownedOfSpecies, type GameState } from '../core/state'
import { spendMoney } from '../core/wallet'
import { createMon, NEW_MON_LEVEL } from '../team/mons'
import { randomNature } from '../team/natures'
import { advanceMission } from './missions'
import { CombineKind, PIECES_PER_COMBINE, piecesOf, SHINY_CHANCE, type CombineResult } from './pieces'
import { spendStarItem, starItemBlocker, starItemFor } from './starItems'

// Volver a crear un Pokémon que ya se tiene: se borra el actual y sale uno nuevo, como recién creado (nivel de los
// nuevos, sin ★ ni MT, naturaleza y shiny al azar). Cuesta lo mismo que crearlo y ocupa su mismo hueco.

/** ₽ que cuesta volver a crearlo: lo mismo que crearlo */
export const recreatePrice = (speciesId: number): number => RARITY_INFO[rarityOf(species(speciesId))].createPrice

/** Por qué no se puede volver a crear ahora (null si se puede): hay que tenerlo en casa y pagar lo de crearlo */
export function recreateBlocker(s: GameState, speciesId: number): string | null {
  const mon = ownedOfSpecies(s, speciesId)
  if (!mon) return 'Aún no lo tienes.'
  const place = monPlace(s, mon.uid)
  if (place !== MonPlace.Ranch && place !== MonPlace.Box) return 'Está fuera del rancho.'
  if (piecesOf(s, speciesId) < PIECES_PER_COMBINE) return `Faltan tickets: tienes ${piecesOf(s, speciesId)} de ${PIECES_PER_COMBINE}.`
  if (s.money < recreatePrice(speciesId)) return `Necesitas ₽ ${recreatePrice(speciesId)}.`
  return starItemBlocker(s, speciesId)
}

/** Borra el Pokémon de la especie y crea otro en su lugar (sigue de compañero si lo era); null si no se puede */
export function recreate(s: GameState, speciesId: number, rng: Rng = Math.random): CombineResult | null {
  if (recreateBlocker(s, speciesId)) return null
  const old = ownedOfSpecies(s, speciesId)!
  const item = starItemFor(speciesId)
  if (item) spendStarItem(s, item)
  spendMoney(s, recreatePrice(speciesId))
  s.pieces[speciesId] -= PIECES_PER_COMBINE

  const mon = createMon(speciesId, NEW_MON_LEVEL, old.ranch, randomNature(rng), rng() < SHINY_CHANCE)
  s.owned[s.owned.indexOf(old)] = mon
  if (s.activeUid === old.uid) s.activeUid = mon.uid
  advanceMission(s, MissionKind.CreateMons)
  return { kind: CombineKind.Unlock, speciesId, level: mon.level, nature: mon.nature, shiny: mon.shiny }
}
