import { describe, expect, it } from 'vitest'
import { entrant } from '../raid-test-utils'
import { RaidAction, RaidRotation } from './protocol'
import { cleanNickname, parseRequest } from './requests'

const who = { playerId: 'jugador-1234', nickname: '  Ash   Ketchum ' }
const ROOM = 'tab/ordered/3/abc123'

describe('peticiones de raids', () => {
  it('acepta entrar con un Pokémon que conoce su ataque y limpia el apodo', () => {
    const { member } = entrant('mon1')
    const req = parseRequest({ ...who, action: RaidAction.Join, rotation: RaidRotation.Hard, member })
    expect(req).toMatchObject({ action: RaidAction.Join, rotation: RaidRotation.Hard, nickname: 'Ash Ketchum', member: { id: 'mon1' } })
  })

  it('rechaza un ataque que no puede llevar, una rotación que no existe o un Pokémon debilitado', () => {
    const { member } = entrant('mon1')
    expect(parseRequest({ ...who, action: RaidAction.Join, rotation: 'x', member })).toBeNull()
    expect(parseRequest({ ...who, action: RaidAction.Join, rotation: RaidRotation.Ordered, member: { ...member, moveId: 'nada' } })).toBeNull()
    expect(parseRequest({ ...who, action: RaidAction.Join, rotation: RaidRotation.Ordered, member: { ...member, hpFraction: 0 } })).toBeNull()
  })

  it('acepta las de una sala con lo suyo y rechaza las que no encajan', () => {
    expect(parseRequest({ ...who, action: RaidAction.Tap, roomId: ROOM, turn: 3 })).toMatchObject({ action: RaidAction.Tap, turn: 3 })
    expect(parseRequest({ ...who, action: RaidAction.Pick, roomId: ROOM, moveId: 'placaje', target: null })).toMatchObject({ target: null })
    expect(parseRequest({ ...who, action: RaidAction.Crit, roomId: ROOM })).toMatchObject({ action: RaidAction.Crit })
    expect(parseRequest({ ...who, action: RaidAction.Sync, roomId: 'route/x' })).toBeNull()
    expect(parseRequest({ ...who, action: RaidAction.Tap, roomId: ROOM, turn: -1 })).toBeNull()
    expect(parseRequest({ ...who, playerId: 'x', action: RaidAction.Board })).toBeNull()
  })

  it('un apodo vacío pasa a ser el de por defecto', () => {
    expect(cleanNickname('   ')).not.toBe('')
  })
})
