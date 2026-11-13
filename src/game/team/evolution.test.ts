import { describe, expect, it } from 'vitest'
import { EVOLVING_SPECIES, evolutionsOf, type Evolution } from '../../data/evolutions'
import { RouteId } from '../../data/maps'
import { SPECIES } from '../../data/species'
import { addStarItems, starItemFor, starItemsOf } from '../collection/starItems'
import { initialState } from '../core/state'
import { chooseStarter } from '../core/test-utils'
import { evolve, evolveBlocker, evolvePrice } from './evolution'
import { createMon, NEW_MON_LEVEL } from './mons'
import { RANCH_SLOTS, usedSlots } from './ranches'
import { maxHp } from './stats'
import { ExpeditionFocus } from './expeditionFocus'
import { stonesOf } from './stones'

const firstEvolution = (match: (from: number, e: Evolution) => boolean) => {
  for (const from of EVOLVING_SPECIES) for (const e of evolutionsOf(from)) if (match(from, e)) return { from, evo: e }
  return undefined
}
const BY_LEVEL = firstEvolution((_, e) => e.level !== undefined)!
const BY_STONE = firstEvolution((_, e) => e.stone !== undefined)
/** Una evolución por nivel a una especie que pide objeto estelar */
const TO_STAR_ITEM = firstEvolution((_, e) => e.level !== undefined && starItemFor(e.into) !== null)
const BRANCHING = EVOLVING_SPECIES.find((id) => evolutionsOf(id).length > 1)

const FROM = BY_LEVEL.from
const INTO = BY_LEVEL.evo.into
const LEVEL = BY_LEVEL.evo.level!
const NOT_INTO = SPECIES.find((sp) => sp.id !== FROM && !evolutionsOf(FROM).some((e) => e.into === sp.id))!.id

/** Partida con un Pokémon activo de `from` al nivel `level`, con ★ y PS a medias, y el dinero y el objeto justos para evolucionar */
function stateReady(from = FROM, level = LEVEL, into = INTO) {
  const s = initialState()
  chooseStarter(s, from)
  const mon = s.owned[0]
  Object.assign(mon, { level, stars: 2, exp: 3 })
  mon.hp = Math.floor(maxHp(mon) / 2)
  s.money = evolvePrice(into)
  const item = starItemFor(into)
  if (item) addStarItems(s, item, 1)
  return { s, mon }
}

/** Llena el rancho del Pokémon con otros que no son su evolución */
function fillRanch(s: ReturnType<typeof stateReady>['s'], ranch: number, avoid: number) {
  const filler = SPECIES.find((sp) => sp.id !== avoid)!.id
  while (usedSlots(s, ranch) < RANCH_SLOTS) s.owned.push(createMon(filler, NEW_MON_LEVEL, ranch))
}

describe('evolve', () => {
  it('al llegar a su nivel cambia de especie: conserva nivel, EXP y uid, pierde las ★ y queda con todos sus PS', () => {
    const { s, mon } = stateReady()
    const uid = mon.uid
    expect(evolve(s, uid, INTO)).toEqual({ fromId: FROM, intoId: INTO })
    expect(s.owned).toHaveLength(1)
    expect(s.owned[0]).toMatchObject({ uid, speciesId: INTO, level: LEVEL, exp: 3, stars: 0 })
    expect(s.owned[0].hp).toBe(maxHp(s.owned[0]))
    expect(s.activeUid).toBe(uid)
  })

  it('un shiny sigue siéndolo al evolucionar', () => {
    const { s, mon } = stateReady()
    mon.shiny = true
    evolve(s, mon.uid, INTO)
    expect(s.owned[0].shiny).toBe(true)
  })

  it('en la Pokédex la especie de antes sigue como capturada', () => {
    const { s, mon } = stateReady()
    evolve(s, mon.uid, INTO)
    expect(s.caught).toContain(INTO)
    expect(s.caught).toContain(FROM)
  })

  it('antes de su nivel no puede evolucionar', () => {
    const { s, mon } = stateReady(FROM, LEVEL - 1)
    expect(evolveBlocker(s, mon.uid, INTO)).toMatch(String(LEVEL))
    expect(evolve(s, mon.uid, INTO)).toBeNull()
    expect(mon.speciesId).toBe(FROM)
  })

  it('cobra según la rareza de la evolución y no evoluciona sin dinero suficiente', () => {
    const { s, mon } = stateReady()
    s.money = evolvePrice(INTO) - 1
    expect(evolveBlocker(s, mon.uid, INTO)).toMatch(/₽/)
    s.money = evolvePrice(INTO)
    evolve(s, mon.uid, INTO)
    expect(s.money).toBe(0)
  })

  it('no evoluciona si ya tienes esa especie', () => {
    const { s, mon } = stateReady()
    s.owned.push(createMon(INTO, NEW_MON_LEVEL, null))
    expect(evolveBlocker(s, mon.uid, INTO)).toMatch(/Ya tienes/)
  })

  it('no evoluciona a una especie que no le corresponde ni fuera del rancho o la Caja', () => {
    const { s, mon } = stateReady()
    expect(evolveBlocker(s, mon.uid, NOT_INTO)).not.toBeNull()
    s.expeditions.push({ uid: mon.uid, routeId: RouteId.PuebloPaleta, durationMin: 15, focus: ExpeditionFocus.Exp, elapsedMin: 0 })
    expect(evolveBlocker(s, mon.uid, INTO)).toMatch(/rancho/)
  })

  it('evoluciona aunque su rancho esté lleno y se queda en él, en el mismo sitio', () => {
    const { s, mon } = stateReady()
    fillRanch(s, mon.ranch!, INTO)
    mon.spot = { x: 30, y: 40 }
    expect(evolve(s, mon.uid, INTO)).not.toBeNull()
    expect(mon).toMatchObject({ ranch: 0, spot: { x: 30, y: 40 } })
  })

  it('en la Caja evoluciona y se queda en ella', () => {
    const { s, mon } = stateReady()
    s.owned.push(createMon(NOT_INTO, NEW_MON_LEVEL))
    mon.ranch = null
    s.activeUid = s.owned[1].uid
    evolve(s, mon.uid, INTO)
    expect(mon.ranch).toBeNull()
  })

  it.runIf(BY_STONE)('por piedra evoluciona a cualquier nivel gastando la piedra y pagando su rareza', () => {
    const { from, evo } = BY_STONE!
    const { s, mon } = stateReady(from, NEW_MON_LEVEL, evo.into)
    expect(evolveBlocker(s, mon.uid, evo.into)).toMatch(/Piedra/)
    s.stones[evo.stone!] = 1
    expect(evolve(s, mon.uid, evo.into)).not.toBeNull()
    expect(stonesOf(s, evo.stone!)).toBe(0)
    expect(s.money).toBe(0)
  })

  it.runIf(BRANCHING)('con varias opciones se elige a cuál evoluciona', () => {
    const last = evolutionsOf(BRANCHING!).at(-1)!
    const { s, mon } = stateReady(BRANCHING!, last.level ?? NEW_MON_LEVEL, last.into)
    if (last.stone) s.stones[last.stone] = 1
    expect(evolve(s, mon.uid, last.into)?.intoId).toBe(last.into)
    expect(mon.speciesId).toBe(last.into)
  })

  it.runIf(TO_STAR_ITEM)('a una especie no común pide su objeto estelar y lo gasta', () => {
    const { from, evo } = TO_STAR_ITEM!
    const { s, mon } = stateReady(from, evo.level!, evo.into)
    const item = starItemFor(evo.into)!
    s.starItems[item] = 0
    expect(evolveBlocker(s, mon.uid, evo.into)).not.toBeNull()
    expect(evolve(s, mon.uid, evo.into)).toBeNull()
    s.starItems[item] = 1
    expect(evolve(s, mon.uid, evo.into)).not.toBeNull()
    expect(starItemsOf(s, item)).toBe(0)
  })
})
