import { vi } from 'vitest'
import { POKEMON } from '../../src/data/pokemon'
import { TEST_INCURSION } from '../../src/game/incursion/incursion-test-mock'
import { freshMember } from '../../src/game/incursion/party'
import { repertoire } from '../../src/game/incursion/repertoire'
import { ScheduleAction } from '../../src/game/incursion/schedule/scheduleProtocol'
import { checkInOpensAt, MAX_LEAD_MS, SLOT_MS } from '../../src/game/incursion/schedule/scheduleRules'
import type { testWorker } from './api'

// Incursiones programadas en los tests del Worker (con la incursión de prueba de incursion-test-mock.ts): crear,
// apuntarse, hacer el checkin y llegar a la hora de comienzo.

export const NOW = 1_700_000_000_000
/** Una franja válida desde NOW, con tiempo de sobra para darse de baja o cancelarla */
export const START = Math.ceil((NOW + MAX_LEAD_MS / 2) / SLOT_MS) * SLOT_MS
const LEVEL = TEST_INCURSION.minLevel

type Api = ReturnType<typeof testWorker>

export const who = (n: number) => ({ playerId: `jugador-${n}`, nickname: `J${n}` })
export const member = (n: number) => freshMember({ id: `mon${n}`, speciesId: POKEMON.Snorlax, level: LEVEL, stars: 0, moveId: repertoire(POKEMON.Snorlax, LEVEL)[0].id })

export const call = (api: Api, body: object) => api.call('/api/incursion-schedule', { body })

export async function create(api: Api, n = 0, bond = 100, startAt = START) {
  return call(api, { action: ScheduleAction.Create, ...who(n), incursionId: TEST_INCURSION.id, startAt, bond })
}

/** Hace el checkin y marca su Pokémon con la sala abierta */
export async function checkIn(api: Api, scheduleId: string, n: number) {
  vi.setSystemTime(checkInOpensAt(START))
  await call(api, { action: ScheduleAction.CheckIn, ...who(n), scheduleId })
  return call(api, { action: ScheduleAction.Mark, ...who(n), scheduleId, incursionId: TEST_INCURSION.id, member: member(n) })
}

/** Programada por el jugador 0 con el 1 apuntado, los dos con su checkin hecho, y ya a la hora de comienzo: el grupo de incursión del 0 */
export async function startedGroup(api: Api) {
  const id = (await create(api)).data.schedule.id as string
  await call(api, { action: ScheduleAction.Join, ...who(1), scheduleId: id, bond: 50 })
  await checkIn(api, id, 0)
  await checkIn(api, id, 1)
  vi.setSystemTime(START)
  return (await call(api, { action: ScheduleAction.Sync, ...who(0), scheduleId: id })).data.group as { groupId: string; members: unknown[]; you: string }
}
