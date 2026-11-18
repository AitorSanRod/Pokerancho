import { incursion } from '../../data/incursions'
import { ScheduleRefusal } from '../../game/incursion/schedule/scheduledIncursion'
import { MAX_CREATED, MAX_JOINED, MIN_PLAYERS, ScheduleCancel, SchedulePhase } from '../../game/incursion/schedule/scheduleRules'
import type { ScheduleView } from '../../game/incursion/schedule/scheduleView'
import { PARTY_SIZE } from '../../game/incursion/party'
import { formatMoney } from '../shared/format'

// Textos de las incursiones programadas: por qué no se ha podido hacer algo y qué pasó con la fianza.

export const REFUSAL_TEXT: Record<ScheduleRefusal | 'offline', string> = {
  [ScheduleRefusal.Full]: 'Ya no quedan huecos.',
  [ScheduleRefusal.AlreadyIn]: 'Ya estás apuntado.',
  [ScheduleRefusal.NotIn]: 'No estás apuntado a esta incursión.',
  [ScheduleRefusal.TooManyCreated]: `Ya tienes ${MAX_CREATED} incursiones programadas por ti sin empezar.`,
  [ScheduleRefusal.TooManyJoined]: `Ya estás apuntado a ${MAX_JOINED} incursiones sin empezar.`,
  [ScheduleRefusal.Overlap]: 'Tienes otra incursión que empieza demasiado cerca de esa hora.',
  [ScheduleRefusal.BadSlot]: 'Esa hora ya no se puede elegir. Prueba con otra.',
  [ScheduleRefusal.NotCreator]: 'Solo quien la programó puede cancelarla.',
  [ScheduleRefusal.WrongPhase]: 'Ya no se puede hacer: la incursión ha cambiado de momento.',
  [ScheduleRefusal.Locked]: 'Ya has fijado tu Pokémon.',
  [ScheduleRefusal.BadMember]: 'Ese Pokémon no puede entrar en esta incursión.',
  offline: 'No hay conexión con el servidor. Prueba otra vez en un rato.',
}

/** Por qué no puede aceptarla desde el tablón (null si puede), sin contar lo que pide de la partida */
export function boardBlocker(view: ScheduleView): string | null {
  if (view.phase !== SchedulePhase.Open && view.phase !== SchedulePhase.Committed) return 'La sala ya está abierta: ya no se puede aceptar.'
  return view.seats.length >= PARTY_SIZE ? REFUSAL_TEXT[ScheduleRefusal.Full] : null
}

/** Qué pasó con la fianza de una ya terminada o cancelada */
export function settledText(view: ScheduleView): string {
  if (view.cancelledBy === ScheduleCancel.Creator) return 'La canceló quien la programó: recuperaste tu fianza.'
  if (view.cancelledBy === ScheduleCancel.Alone) return 'Nadie más se apuntó: se cerró y recuperaste tu fianza.'
  const you = view.you
  if (!you?.checkedIn) return `No hiciste el checkin: perdiste tu fianza (${formatMoney(you?.bond ?? 0)}).`
  const share = view.shares ? ` y ${formatMoney(view.shares)} del reparto de los ausentes` : ''
  const how = view.cancelledBy ? `Se canceló porque no había ${MIN_PLAYERS} jugadores con Pokémon. ` : ''
  return `${how}Recuperaste tu fianza${share}.`
}

export const scheduleName = (view: ScheduleView): string => incursion(view.incursionId).name
