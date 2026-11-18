// Reglas de las incursiones programadas (ver docs/incursiones.md): franjas de hora, plazos de la sala, fianza y topes
// por jugador. Las usan el móvil y el servidor.

const MINUTE_MS = 60_000

/** Parte del dinero del jugador que se retiene como fianza al crear o aceptar una incursión (hacia abajo, ₽ enteros) */
export const BOND_FRACTION = 0.1
/** La hora de comienzo va en franjas de este tamaño (:00, :15, :30, :45) */
export const SLOT_MS = 15 * MINUTE_MS
/** Antelación mínima con la que se puede programar una incursión */
export const MIN_LEAD_MS = 15 * MINUTE_MS
/** Antelación máxima con la que se puede programar una incursión */
export const MAX_LEAD_MS = 7 * 24 * 60 * MINUTE_MS
/** La sala del checkin abre esto antes del comienzo */
export const CHECKIN_OPEN_MS = 10 * MINUTE_MS
/**
 * Hasta esto antes del comienzo, un apuntado puede darse de baja y el creador cancelarla, con la fianza devuelta (al
 * cancelar, la de todos); después, ya no
 */
export const CANCEL_DEADLINE_MS = 3 * 60 * MINUTE_MS
/** Incursiones programadas creadas y aún sin empezar que puede tener un jugador a la vez */
export const MAX_CREATED = 3
/** Incursiones programadas aceptadas (sin contar las creadas) y aún sin empezar que puede tener un jugador a la vez */
export const MAX_JOINED = 5
/** Jugadores con Pokémon que hacen falta para empezar; con menos, se cancela */
export const MIN_PLAYERS = 2
/** Separación mínima entre los comienzos de dos incursiones de un jugador (la más larga dura 25 min, más la sala y margen) */
export const SCHEDULE_GAP_MS = 45 * MINUTE_MS
/** Lo que el servidor guarda una incursión programada después de su hora de comienzo (para liquidar las fianzas) */
export const SCHEDULE_TTL_MS = 7 * 24 * 60 * MINUTE_MS

/** En qué momento está una incursión programada */
export const SchedulePhase = {
  /** Se puede aceptar, darse de baja y cancelarla */
  Open: 'open',
  /** Se puede aceptar, pero ya no darse de baja ni cancelarla */
  Committed: 'committed',
  /** Sala abierta: checkin, elegir Pokémon y fijarlo */
  CheckIn: 'checkin',
  Started: 'started',
  Cancelled: 'cancelled',
} as const
export type SchedulePhase = (typeof SchedulePhase)[keyof typeof SchedulePhase]

/**
 * Por qué se canceló: el creador antes de abrir la sala; nadie más se apuntó (se devuelven todas las fianzas, como al
 * cancelarla el creador); o a la hora había menos de MIN_PLAYERS jugadores con Pokémon (los ausentes pierden la fianza)
 */
export const ScheduleCancel = { Creator: 'creator', Alone: 'alone', TooFew: 'nobody' } as const
export type ScheduleCancel = (typeof ScheduleCancel)[keyof typeof ScheduleCancel]

/** La fianza que se retiene con ese dinero */
export const bondFor = (money: number): number => Math.max(0, Math.floor(money * BOND_FRACTION))

export const checkInOpensAt = (startAt: number): number => startAt - CHECKIN_OPEN_MS
/** Hasta cuándo se puede dar de baja o cancelarla con la fianza devuelta */
export const leaveDeadline = (startAt: number): number => startAt - CANCEL_DEADLINE_MS

/** Si `startAt` es una franja válida para programar ahora */
export const isValidSlot = (startAt: number, now: number): boolean =>
  Number.isSafeInteger(startAt) && startAt % SLOT_MS === 0 && startAt - now >= MIN_LEAD_MS && startAt - now <= MAX_LEAD_MS

/** Las franjas que se pueden elegir ahora, de la más cercana a la más lejana */
export function validSlots(now: number): number[] {
  const first = Math.ceil((now + MIN_LEAD_MS) / SLOT_MS) * SLOT_MS
  const slots: number[] = []
  for (let t = first; t - now <= MAX_LEAD_MS; t += SLOT_MS) slots.push(t)
  return slots
}

/** Se devuelven todas las fianzas, sin reparto */
export const refundsAll = (cancelledBy: ScheduleCancel | null): boolean => cancelledBy === ScheduleCancel.Creator || cancelledBy === ScheduleCancel.Alone

/** `groupId`: si ya se formó el grupo (puede ser antes de la hora, si todos fijaron su Pokémon) */
export function schedulePhase(sched: { startAt: number; cancelledBy: ScheduleCancel | null; groupId?: string | null }, now: number): SchedulePhase {
  if (sched.cancelledBy) return SchedulePhase.Cancelled
  if (sched.groupId || now >= sched.startAt) return SchedulePhase.Started
  if (now >= checkInOpensAt(sched.startAt)) return SchedulePhase.CheckIn
  return now >= leaveDeadline(sched.startAt) ? SchedulePhase.Committed : SchedulePhase.Open
}

/** Aún no ha empezado ni se ha cancelado: cuenta para los topes y la separación */
export const isPending = (phase: SchedulePhase): boolean => phase !== SchedulePhase.Started && phase !== SchedulePhase.Cancelled
