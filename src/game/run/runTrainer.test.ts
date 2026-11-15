import { describe, expect, it, vi } from 'vitest'
import { route, RouteId } from '../../data/maps'
import { POKEMON } from '../../data/pokemon'
import { TRAINERS, TrainerId } from '../../data/trainers'
import { expReward } from '../battle/rewards'
import { activeMon, initialState, type GameState } from '../core/state'
import { chooseStarter, seqRng } from '../core/test-utils'
import { MAX_LEVEL, maxHp } from '../team/stats'
import { advanceRun, startRun, walk } from './run'
import { legacyTrainerWho, TRAINER_EXP_MULT } from './runTrainer'
import { fixedWho, trainerIdentity } from './trainerIdentity'

vi.mock('../../data/maps/kantoMaps', () => import('../core/test-map'))
/** Nivel de los Pokémon del entrenador de prueba */
const { FOE_LEVEL } = vi.hoisted(() => ({ FOE_LEVEL: 20 }))
// Entrenador de prueba (de la primera clase, sin nombre): dos Pokémon flojos al mismo nivel
vi.mock('../../data/trainers', async (original) => {
  const real = await original<typeof import('../../data/trainers')>()
  const { POKEMON: P } = await import('../../data/pokemon')
  const team = [
    { speciesId: P.Pidgey, level: FOE_LEVEL },
    { speciesId: P.Rattata, level: FOE_LEVEL },
  ]
  const trainer = { trainerClass: Object.values(real.TrainerClass)[0], team }
  return { ...real, TRAINERS: { ...real.TRAINERS, [real.TrainerId.MarineroDani]: trainer } }
})

const ROUTE = RouteId.SSAnne
const TRAINER = TRAINERS[TrainerId.MarineroDani]

/** Partida con el inicial al nivel `level`, en la ruta y ya delante del entrenador */
function atTheTrainer(level: number, rng = seqRng(0.5)) {
  const s = initialState()
  chooseStarter(s, POKEMON.Squirtle)
  const mon = activeMon(s)!
  mon.level = level
  mon.hp = maxHp(mon)
  s.unlockedRoutes.push(ROUTE)
  startRun(s, ROUTE, undefined, rng)
  walk(s, route(ROUTE).nodes[0].next[0].steps, rng)
  return s
}

/** Acaba el combate en curso (sin pasar al siguiente tramo) */
const finishBattle = (s: GameState, rng = seqRng(0.5)) => advanceRun(s, s.run!.battleMsLeft, rng)

describe('entrenador', () => {
  it('saca su equipo uno tras otro y, vencido el último, la ruta sigue', () => {
    const s = atTheTrainer(MAX_LEVEL)
    TRAINER.team.forEach((foe, i) => {
      expect(s.run!.trainer!.index).toBe(i)
      expect(s.run!.lastBattle!.enemy.speciesId).toBe(foe.speciesId)
      expect(s.run!.lastBattle!.events[0].text).toContain(trainerIdentity(TRAINER, s.run!.trainer!.who).name)
      finishBattle(s)
    })
    expect(s.run!.trainer).toBeNull()
    expect(s.run!.phase).toBe('walking')
    expect(s.run!.battleMsLeft).toBe(0)
  })

  it('cada Pokémon suyo da más EXP que un salvaje de su nivel, sin ser jefe', () => {
    const s = atTheTrainer(FOE_LEVEL)
    expect(s.run!.battleSetup!.prize.exp).toBe(expReward(FOE_LEVEL, FOE_LEVEL) * TRAINER_EXP_MULT)
    expect(s.run!.lastBattle!.boss).toBe(false)
  })

  it('cada Pokémon suyo se descubre al vencerlo, no al verlo', () => {
    const s = atTheTrainer(MAX_LEVEL)
    for (const foe of TRAINER.team) {
      expect(s.seen).not.toContain(foe.speciesId)
      finishBattle(s)
      expect(s.seen).toContain(foe.speciesId)
      expect(s.run!.earned.discovered).toContain(foe.speciesId)
    }
  })

  it('fuera de su parada no hay entrenador', () => {
    const s = atTheTrainer(MAX_LEVEL)
    const who = trainerIdentity(TRAINER, s.run!.trainer!.who).name
    TRAINER.team.forEach(() => finishBattle(s))
    walk(s, route(ROUTE).nodes[1].next[0].steps)
    expect(s.run!.trainer).toBeNull()
    expect(s.run!.lastBattle!.events[0].text).not.toContain(who)
  })

  it('quién es se elige al llegar y se mantiene con todo su equipo', () => {
    const s = atTheTrainer(MAX_LEVEL)
    const who = s.run!.trainer!.who
    finishBattle(s)
    expect(s.run!.trainer!.who).toEqual(who)
  })

  it('una ruta guardada frente a él sin quién es toma lo fijo; fuera de su parada, nada', () => {
    const run = atTheTrainer(MAX_LEVEL).run!
    expect(legacyTrainerWho(run.routeId, run.path, run.stop)).toEqual(fixedWho(TRAINER))
    expect(legacyTrainerWho(run.routeId, run.path, 0)).toBeNull()
    expect(legacyTrainerWho('ruta-quitada', run.path, run.stop)).toBeNull()
  })
})
