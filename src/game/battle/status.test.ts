import { describe, expect, it } from 'vitest'
import { STATUS_INFO, StatusId } from '../../data/passives'
import { POKEMON } from '../../data/pokemon'
import { makeFighter, type Push } from './battle'
import { blockedByStatus, endOfTurn, inflictStatus } from './status'

const statusWith = (key: 'damagePerTurn' | 'skipChance' | 'skipTurns' | 'selfHitChance') =>
  (Object.keys(STATUS_INFO) as StatusId[]).find((id) => STATUS_INFO[id][key] !== undefined)!

const fighter = () => makeFighter('player', POKEMON.Charmander, 20)
const events = () => {
  const list: Parameters<Push>[0][] = []
  return { list, push: ((e) => void list.push(e)) as Push }
}
const always = () => 0
const never = () => 0.999

describe('estados alterados en combate', () => {
  it('solo uno a la vez, y no a un debilitado', () => {
    const { push } = events()
    const f = fighter()
    const [first, second] = Object.keys(STATUS_INFO) as StatusId[]
    inflictStatus(f, first, push)
    inflictStatus(f, second, push)
    expect(f.status).toBe(first)
    const fainted = { ...fighter(), hp: 0 }
    inflictStatus(fainted, first, push)
    expect(fainted.status).toBeNull()
  })

  it('el que hace perder turnos los quita seguidos y después se pasa', () => {
    const { push } = events()
    const f = fighter()
    const id = statusWith('skipTurns')
    inflictStatus(f, id, push)
    for (let i = 0; i < STATUS_INFO[id].skipTurns!; i++) expect(blockedByStatus(f, push, never)).toBe('skip')
    expect(f.status).toBeNull()
    expect(blockedByStatus(f, push, always)).toBeNull()
  })

  it('el de probabilidad de no moverse o de golpearse depende de la tirada', () => {
    const { push } = events()
    const skip = fighter()
    inflictStatus(skip, statusWith('skipChance'), push)
    expect(blockedByStatus(skip, push, always)).toBe('skip')
    expect(blockedByStatus(skip, push, never)).toBeNull()
    const confused = fighter()
    inflictStatus(confused, statusWith('selfHitChance'), push)
    expect(blockedByStatus(confused, push, always)).toBe('self-hit')
    expect(blockedByStatus(confused, push, never)).toBeNull()
  })

  it('el que quita PS lo hace al final del turno (al menos 1) y puede debilitar', () => {
    const { list, push } = events()
    const f = fighter()
    const id = statusWith('damagePerTurn')
    inflictStatus(f, id, push)
    const before = f.hp
    endOfTurn([f], push)
    expect(f.hp).toBe(before - Math.max(1, Math.floor(f.maxHp * STATUS_INFO[id].damagePerTurn!)))
    f.hp = 1
    endOfTurn([f], push)
    expect(f.hp).toBe(0)
    expect(list.at(-1)!.kind).toBe('faint')
  })
})
