import { describe, expect, it, vi } from 'vitest'
import { POKEMON } from '../src/data/pokemon'
import { rankingWeek, type MonDamage } from '../src/game/core/ranking'
import { addDamage } from './db/damageRanking'
import { refreshRanking } from './ranking'
import { accountId, player, type Api } from './test/accounts'

vi.mock('./mail', async (original) => ({ ...(await original<typeof import('./mail')>()), sendMail: vi.fn() }))
vi.mock('../src/data/maps/kantoMaps', () => import('../src/game/core/test-map'))
vi.mock('../src/data/rankingCuts', () => ({ RANKING_EXTRA_CUTS: [] }))

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
/** Id de un jugador sin cuenta (el anónimo de las raids) */
const ANONYMOUS = 'anonimo-0001'

/** El daño de una pelea terminada de un Pokémon de un jugador, como lo apunta el servidor al acabar una sala */
const fought = (playerId: string, uid: string, damage: number, speciesId: number = POKEMON.Pikachu): MonDamage => ({ playerId, uid, speciesId, damage })

const save = (api: Api, tally: MonDamage[]) => addDamage(api.env.DB, tally)

const damageRanking = async (api: Api) => {
  await refreshRanking(api.env.DB, Date.now())
  return (await api.call('/api/ranking')).data.damage
}

describe('ranking de daño a los jefes', () => {
  it('suma el daño de cada pelea terminada y elige el Pokémon que más ha hecho', async () => {
    const ash = await player('ash@paleta.es', 'Ash')
    const gary = await player('gary@paleta.es', 'Gary', ash.env)
    const [ashId, garyId] = [await accountId(ash), await accountId(gary)]
    await save(ash, [fought(ashId, 'pika', 30), fought(garyId, 'eevee', 50, POKEMON.Eevee)])
    await save(ash, [fought(ashId, 'pika', 30)])
    await save(ash, [fought(ashId, 'bulba', 10, POKEMON.Bulbasaur)])

    const damage = await damageRanking(ash)
    expect(damage.top.map((e: { nickname: string }) => e.nickname)).toEqual(['Ash', 'Gary'])
    expect(damage.mine).toEqual({ rank: 1, damage: 70, topMon: { speciesId: POKEMON.Pikachu, damage: 60 } })
    expect(damage.top[1]).toMatchObject({ rank: 2, damage: 50, mine: false })
    expect(damage.total).toBe(2)
  })

  it('cada lunes empieza de cero', async () => {
    const ash = await player('ash@paleta.es', 'Ash')
    await save(ash, [fought(await accountId(ash), 'pika', 30)])
    const nextWeek = rankingWeek(Date.now()) + WEEK_MS
    await refreshRanking(ash.env.DB, nextWeek - 1)
    expect((await ash.call('/api/ranking')).data.damage.mine.damage).toBe(30)
    await refreshRanking(ash.env.DB, nextWeek)
    expect((await ash.call('/api/ranking')).data.damage).toMatchObject({ mine: null, total: 0 })
  })

  it('el daño de quien juega sin cuenta no se apunta', async () => {
    const ash = await player('ash@paleta.es', 'Ash')
    await save(ash, [fought(ANONYMOUS, 'pika', 30)])
    expect((await damageRanking(ash)).total).toBe(0)
  })

  it('quien se oculta del ranking tampoco sale en el de daño', async () => {
    const ash = await player('ash@paleta.es', 'Ash')
    await save(ash, [fought(await accountId(ash), 'pika', 30)])
    await ash.call('/api/auth/ranked', { body: { ranked: false } })
    await refreshRanking(ash.env.DB, Date.now())
    await ash.call('/api/auth/ranked', { body: { ranked: true } })
    expect((await ash.call('/api/ranking')).data.damage).toMatchObject({ mine: null, total: 0 })
  })
})
