/**
 * Partida de demostración para las capturas de los tutoriales. Se ejecuta DENTRO del navegador (con `page.evaluate`)
 * e importa los módulos del juego desde el servidor de desarrollo de Vite, así que no puede usar nada de fuera.
 * `scenario` añade lo que necesite cada captura: ruta en curso, expedición, Pokémon contra el jefe o premio de raid.
 */
export async function buildDemoSave(scenario) {
  const { initialState } = await import('/src/game/core/state.ts')
  const { createMon } = await import('/src/game/team/mons.ts')
  const { markCaught, markSeen } = await import('/src/game/collection/dex.ts')
  const { addPieces, PIECES_PER_COMBINE } = await import('/src/game/collection/pieces.ts')
  const { startRun } = await import('/src/game/run/run.ts')
  const { sendExpedition, EXPEDITION_DURATIONS } = await import('/src/game/team/expedition.ts')
  const { ensureRaid, joinRaid } = await import('/src/game/raid/raid.ts')
  const { RouteId } = await import('/src/data/maps/mapCommon.ts')
  const { POKEMON: P } = await import('/src/data/pokemon.ts')
  const { Stone } = await import('/src/data/stones.ts')
  const { RANCH_TYPE_IDS } = await import('/src/data/ranchTypes.ts')

  const s = initialState()
  s.tutorial = null
  s.money = 12500
  s.tickets = 3
  const team = [
    [P.Charmander, 16],
    [P.Bulbasaur, 16],
    [P.Pidgey, 12],
    [P.Pikachu, 14],
    [P.Eevee, 10],
    [P.Oddish, 11],
    [P.Rattata, 9],
  ]
  for (const [id, level] of team) {
    const mon = createMon(id, level)
    s.owned.push(mon)
    markCaught(s, id)
  }
  s.activeUid = s.owned[0].uid
  for (const id of [P.Caterpie, P.Weedle, P.Spearow, P.Abra, P.Geodude]) markSeen(s, id)
  addPieces(s, P.Pidgey, PIECES_PER_COMBINE)
  addPieces(s, P.Abra, PIECES_PER_COMBINE)
  addPieces(s, P.Geodude, 2)
  s.stones[Stone.Fire] = 1
  s.stones[Stone.Moon] = 2
  s.ranchTypeItems[RANCH_TYPE_IDS[0]] = 1
  s.unlockedRoutes = [RouteId.PuebloPaleta, RouteId.Ruta1, RouteId.Ruta1Boss, RouteId.BosqueVerde]
  s.completedRoutes = [RouteId.PuebloPaleta, RouteId.Ruta1]

  const uidOf = (speciesId) => s.owned.find((m) => m.speciesId === speciesId).uid
  if (scenario.run) startRun(s, RouteId.Ruta1)
  if (scenario.expedition) {
    sendExpedition(s, uidOf(P.Pidgey), RouteId.Ruta1, EXPEDITION_DURATIONS[1])
    sendExpedition(s, uidOf(P.Rattata), RouteId.PuebloPaleta, EXPEDITION_DURATIONS[0])
    s.upgrades.expeditionSlots = 1
  }
  if (scenario.raid) {
    ensureRaid(s)
    joinRaid(s, uidOf(P.Pikachu))
  }
  if (scenario.raidPrize) {
    s.raidPrizes.push({ bossSpeciesId: P.Snorlax, uid: uidOf(P.Pikachu), money: 1500, tickets: 2, pieces: 1, exp: 250 })
  }
  s.incursionKeys.prueba = 2
  if (scenario.incursionQueue) {
    const { repertoire } = await import('/src/game/incursion/repertoire.ts')
    const uid = uidOf(P.Charmander)
    s.incursionQueue = { incursionId: 'prueba', uid, moveId: repertoire(P.Charmander, 16)[0].id, since: Date.now() - 12_000 }
  }
  if (scenario.incursion) await setUpIncursion(s, uidOf(P.Charmander), scenario.incursion)
  s.lastTick = Date.now()
  return JSON.stringify(s)

  /**
   * La incursión de prueba con Charmander y bots, en el momento que pide la captura: `tap` (en la primera ventana de
   * toques), `battle` (combatiendo en la primera sala), `regroup` (en la sala de reorganizar) o `finished` (superada). Prueba semillas hasta dar con una que llegue
   */
  async function setUpIncursion(s, uid, moment) {
    const { advanceIncursion, startIncursion } = await import('/src/game/incursion/incursionGame.ts')
    const { recordOf, startNextLeg, REGROUP_MS } = await import('/src/game/incursion/activeIncursion.ts')
    const { eventStartMs, legDuration } = await import('/src/game/incursion/incursionTimeline.ts')
    const { repertoire } = await import('/src/game/incursion/repertoire.ts')
    const { seededRng } = await import('/src/game/core/random.ts')
    const now = Date.now()
    /** Juega el tramo sin tocar en sus ventanas (se cierran solas al pasar su hora) y lo devuelve terminado */
    const playLeg = (a, leg) => {
      for (;;) {
        const played = recordOf(a).legs[leg]
        if (played.outcome !== 'waiting') return played
        advanceIncursion(s, a.legStarts[leg] + legDuration(played))
      }
    }
    const moveId = repertoire(s.owned.find((m) => m.uid === uid).speciesId, 16)[0].id
    for (let seed = 1; seed < 200; seed++) {
      s.incursionKeys.prueba = 2
      startIncursion(s, 'prueba', uid, moveId, now, seededRng(seed))
      const a = s.incursion
      if (moment === 'tap') {
        const waiting = recordOf(a).legs[0]
        // La ventana empieza un poco después: hasta la captura pasan unos segundos (carga y toques de navegación)
        a.legStarts = [now - eventStartMs(waiting, waiting.events.length - 1) + 1_000]
        return
      }
      if (moment === 'battle') {
        a.legStarts = [now - 20_000]
        return
      }
      const first = playLeg(a, 0)
      if (first.outcome === 'regroup') {
        const end0 = legDuration(first)
        if (moment === 'regroup') {
          a.legStarts = [now - end0 - 25_000]
          return
        }
        startNextLeg(a, a.legStarts[0] + end0, {})
        const second = playLeg(a, 1)
        if (second.outcome === 'win') {
          const start0 = now - end0 - REGROUP_MS - legDuration(second) - 5_000
          a.legStarts = [start0, start0 + end0 + REGROUP_MS]
          return
        }
      }
      s.incursion = null
    }
    throw new Error(`Ninguna semilla llega a «${moment}» en la incursión de prueba`)
  }
}

