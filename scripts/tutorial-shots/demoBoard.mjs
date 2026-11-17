/**
 * Respuestas de muestra del servidor de incursiones programadas para las capturas (con `npm run dev` no hay servidor).
 * Se ejecuta DENTRO del navegador (con `page.evaluate`) e importa los módulos del juego desde Vite. `kind`: 'board'
 * (una incursión de otros en el tablón) o 'room' (la sala del checkin abierta, con el jugador dentro). Devuelve la
 * respuesta al tablón y la de cualquier otra petición.
 */
export async function buildDemoBoard(kind) {
  const { createSchedule, joinSchedule } = await import('/src/game/incursion/schedule/scheduledIncursion.ts')
  const { checkInSchedule, markSchedule } = await import('/src/game/incursion/schedule/scheduleRoom.ts')
  const { scheduleView } = await import('/src/game/incursion/schedule/scheduleView.ts')
  const { CHECKIN_OPEN_MS, MIN_LEAD_MS, SLOT_MS } = await import('/src/game/incursion/schedule/scheduleRules.ts')
  const { freshMember } = await import('/src/game/incursion/party.ts')
  const { repertoire } = await import('/src/game/incursion/repertoire.ts')
  const { IncursionId } = await import('/src/data/incursions/index.ts')
  const { POKEMON: P } = await import('/src/data/pokemon.ts')

  const ME = 'demo-jugador-0001'
  const room = kind === 'room'
  const start = Math.ceil((Date.now() + (room ? 8 * 60_000 : 2 * 60 * 60_000)) / SLOT_MS) * SLOT_MS
  const created = start - MIN_LEAD_MS * 8
  const sched = createSchedule('a1b2c3d4', IncursionId.BosqueVerde, start, { playerId: 'demo-rocio-0001', nickname: 'Rocío', bond: 900 }, [], created)
  joinSchedule(sched, { playerId: 'demo-hugo-0001', nickname: 'Hugo', bond: 400 }, [], created)
  if (room) joinSchedule(sched, { playerId: ME, nickname: 'Tú', bond: 1250 }, [], created)
  const now = room ? start - CHECKIN_OPEN_MS + 4 * 60_000 : Date.now()
  if (room) {
    for (const id of ['demo-rocio-0001', ME]) checkInSchedule(sched, id, now)
    const level = 18
    markSchedule(sched, 'demo-rocio-0001', freshMember({ id: 'rocio-mon', speciesId: P.Pikachu, level, stars: 0, moveId: repertoire(P.Pikachu, level)[0].id }), now)
  }
  const view = scheduleView(sched, ME, now)
  const board = room ? { open: [], mine: [view], serverNow: now } : { open: [view], mine: [], serverNow: now }
  return { board: { board }, other: { schedule: view }, start }
}
