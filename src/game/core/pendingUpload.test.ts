import { describe, expect, it, vi } from 'vitest'
import { STARTERS } from '../../data/species'
import { cloudUpload, type CloudLink, type CloudSave } from './cloudSave'
import { adoptOwnUpload, isPendingList, MAX_PENDING_UPLOADS, nextRevision, pendingUpload, withPending } from './pendingUpload'
import { initialState, type GameState } from './state'
import { chooseStarter } from './test-utils'

vi.mock('../../data/maps/kantoMaps', () => import('./test-map'))

const USER = 'user-1'

function playedGame(lastTick: number) {
  const s = initialState()
  chooseStarter(s, STARTERS[0])
  s.lastTick = lastTick
  return s
}

const cloudOf = (s: GameState, revision: number): CloudSave => ({ ...structuredClone(cloudUpload(s)), revision, updatedAt: 0 })

describe('subidas sin confirmar', () => {
  it('la revisión pendiente es la que dará el servidor', () => {
    expect(pendingUpload(4, playedGame(1)).revision).toBe(nextRevision(4))
    expect(pendingUpload(null, playedGame(1)).revision).toBe(nextRevision(null))
  })

  it('si la nube tiene una subida de aquí, se adopta su revisión con su instantánea y sin pendientes', () => {
    const local = playedGame(1000)
    const pending = pendingUpload(3, local)
    const link = withPending({ userId: USER, revision: 3 }, pending)
    expect(adoptOwnUpload(link, cloudOf(local, pending.revision))).toEqual({ userId: USER, revision: pending.revision, snapshot: pending.snapshot })
  })

  it('la partida de otro dispositivo con la misma revisión no es de aquí', () => {
    const pending = pendingUpload(3, playedGame(1000))
    const link = withPending({ userId: USER, revision: 3 }, pending)
    expect(adoptOwnUpload(link, cloudOf(playedGame(2000), pending.revision))).toBeNull()
  })

  it('sin pendientes o sin nube no se adopta nada', () => {
    const local = playedGame(1000)
    expect(adoptOwnUpload({ userId: USER, revision: 3 }, cloudOf(local, 4))).toBeNull()
    expect(adoptOwnUpload(withPending({ userId: USER, revision: 3 }, pendingUpload(3, local)), null)).toBeNull()
  })

  it('se recuerdan solo las últimas subidas', () => {
    let link: CloudLink = { userId: USER, revision: 3 }
    for (let i = 0; i <= MAX_PENDING_UPLOADS; i++) link = withPending(link, pendingUpload(3, playedGame(i)))
    expect(link.pending).toHaveLength(MAX_PENDING_UPLOADS)
    expect(link.pending!.at(-1)!.lastTick).toBe(MAX_PENDING_UPLOADS)
  })

  it('valida la forma de lo guardado', () => {
    expect(isPendingList([pendingUpload(1, playedGame(1))])).toBe(true)
    expect(isPendingList([{ revision: 1 }])).toBe(false)
    expect(isPendingList('x')).toBe(false)
  })
})
