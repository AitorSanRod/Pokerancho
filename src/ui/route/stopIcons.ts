import type { Item } from '../../data/items'
import { ITEM } from '../../data/items'
import { NodeKind } from '../../data/maps'

/** Icono de cada tipo de parada en el mapa de la ruta en curso (StopTrack) y en el editor de rutas */
export const STOP_ICON: Record<NodeKind, Item> = {
  [NodeKind.Start]: ITEM.TownMap,
  [NodeKind.Wild]: ITEM.PokeBall,
  [NodeKind.Boss]: ITEM.RelicCrown,
  [NodeKind.Raid]: ITEM.DynamaxBand,
  [NodeKind.Heal]: ITEM.Potion,
  [NodeKind.Gym]: ITEM.VsSeeker,
  [NodeKind.Trainer]: ITEM.VsRecorder,
}
