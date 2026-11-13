import { ExpeditionFocus } from '../../game/team/expeditionFocus'

/** Nombre de cada enfoque de expedición y lo que trae de más */
export const FOCUS_INFO: Record<ExpeditionFocus, { label: string; note: string }> = {
  [ExpeditionFocus.Exp]: { label: 'EXP', note: 'Más EXP; menos ₽ y botín.' },
  [ExpeditionFocus.Money]: { label: 'Dinero', note: 'Más ₽; menos EXP y botín.' },
  [ExpeditionFocus.Loot]: { label: 'Botín', note: 'Más tickets y piezas; menos EXP y ₽.' },
}
