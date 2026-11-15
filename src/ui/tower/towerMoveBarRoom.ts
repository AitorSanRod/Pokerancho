import type { OwnedMon } from '../../game/core/state'
import { towerMoveChoices } from '../../game/tower/towerMoves'

/** Alto (px) de la barra sin ataques (cabecera y márgenes) y de cada fila de ataques; se ven como mucho dos filas */
const BAR_BASE = 54
const BAR_ROW = 60
const MAX_ROWS = 2

/** Lo que ocupa abajo la barra de ese Pokémon: la escena de la subida acaba encima */
export const towerMoveBarRoom = (mon: OwnedMon): number =>
  BAR_BASE + BAR_ROW * Math.min(MAX_ROWS, Math.max(1, Math.ceil(towerMoveChoices(mon).length / 2)))
