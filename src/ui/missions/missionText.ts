import { MissionKind } from '../../data/dailyMissions'
import type { Item } from '../../data/items'
import { findRoute } from '../../data/maps'
import { species } from '../../data/species'
import type { Mission } from '../../game/collection/missions'
import { ICON } from '../shared/icons'

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

/** Lo que pide la misión, para leerlo: «Gana 20 combates en ruta» */
export function missionText(m: Mission): string {
  const n = m.goal
  switch (m.kind) {
    case MissionKind.WinBattles:
      return `Gana ${n} ${plural(n, 'combate', 'combates')} en ruta`
    case MissionKind.CompleteRoutes:
      return `Completa ${n} ${plural(n, 'ruta', 'rutas')}`
    case MissionKind.CompleteRoute:
      return `Completa ${findRoute(m.routeId ?? '')?.name ?? 'la ruta'}${n > 1 ? ` ${n} veces` : ''}`
    case MissionKind.CompleteRouteWith:
      return `Completa ${n > 1 ? `${n} rutas` : 'una ruta'} con ${m.speciesId ? species(m.speciesId).name : 'tu compañero'} de compañero`
    case MissionKind.SpendMoney:
      return `Gasta ${n} ₽`
    case MissionKind.CreateMons:
      return `Crea ${n} ${plural(n, 'Pokémon nuevo', 'Pokémon nuevos')}`
    case MissionKind.PullGacha:
      return `Abre ${n} ${plural(n, 'ticket', 'tickets')} de gacha`
    case MissionKind.FinishExpeditions:
      return `Recoge ${n} ${plural(n, 'expedición', 'expediciones')}`
  }
}

/** Icono de cada clase de misión */
export const MISSION_ICON: Record<MissionKind, Item> = {
  [MissionKind.WinBattles]: ICON.Wins,
  [MissionKind.CompleteRoutes]: ICON.Route,
  [MissionKind.CompleteRoute]: ICON.Route,
  [MissionKind.CompleteRouteWith]: ICON.Active,
  [MissionKind.SpendMoney]: ICON.Money,
  [MissionKind.CreateMons]: ICON.Piece,
  [MissionKind.PullGacha]: ICON.Gacha,
  [MissionKind.FinishExpeditions]: ICON.Expedition,
}
