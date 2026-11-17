import { POKEMON } from '../../../data/pokemon'
import { TEST_INCURSION } from '../incursion-test-mock'
import { freshMember } from '../party'
import { repertoire } from '../repertoire'
import { createSchedule, type ScheduledIncursion, type ScheduleJoiner } from './scheduledIncursion'
import { MAX_LEAD_MS, SLOT_MS } from './scheduleRules'

// Piezas comunes de los tests de incursiones programadas (con la incursión de prueba de incursion-test-mock.ts).

export const NOW = 2000 * SLOT_MS
/** Una franja válida a partir de ahora, `lead` ms después (por defecto, con tiempo de sobra para darse de baja) */
export const slotIn = (lead: number = MAX_LEAD_MS / 2) => Math.ceil((NOW + lead) / SLOT_MS) * SLOT_MS

export const joiner = (n: number, bond = 100): ScheduleJoiner => ({ playerId: `jugador-${n}`, nickname: `J${n}`, bond })

/** Una incursión programada recién creada por el jugador 0 */
export function newSchedule(startAt = slotIn(), id = 'abcdef12'): ScheduledIncursion {
  const sched = createSchedule(id, TEST_INCURSION.id, startAt, joiner(0), [], NOW)
  if (typeof sched === 'string') throw new Error(sched)
  return sched
}

/** Un Pokémon que puede entrar en la incursión de prueba */
export function member(n: number, level = TEST_INCURSION.minLevel) {
  return freshMember({ id: `mon${n}`, speciesId: POKEMON.Snorlax, level, stars: 0, moveId: repertoire(POKEMON.Snorlax, level)[0].id })
}
