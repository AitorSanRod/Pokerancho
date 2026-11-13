import { afterEach, describe, expect, it, vi } from 'vitest'
import { RANKING_PRIZES, WeeklyBoard } from '../src/data/rankingPrizes'
import { STARTERS } from '../src/data/species'
import { cloudUpload } from '../src/game/core/cloudSave'
import { rankingWeek } from '../src/game/core/ranking'
import { prizedWeek } from '../src/game/core/rankingPrizes'
import { initialState } from '../src/game/core/state'
import { chooseStarter } from '../src/game/core/test-utils'
import { addDamage } from './db/damageRanking'
import { awardWeeklyPrizes } from './db/rankingAwards'
import { refreshRanking } from './ranking'
import { accountId, player, type Api } from './test/accounts'

vi.mock('./mail', async (original) => ({ ...(await original<typeof import('./mail')>()), sendMail: vi.fn() }))
vi.mock('../src/data/maps/kantoMaps', () => import('../src/game/core/test-map'))
vi.mock('../src/data/rankingCuts', () => ({ RANKING_EXTRA_CUTS: [] }))

const NOW = Date.now()
const LAST_WEEK = prizedWeek(NOW)

/** Sube una partida con `floor` como mejor piso de la torre en la semana `week` */
async function climbed(api: Api, floor: number, week = LAST_WEEK) {
  const s = initialState()
  chooseStarter(s, STARTERS[0])
  s.towerWeek = { week, best: floor }
  await api.call('/api/save', { body: { baseRevision: null, ...cloudUpload(s) } })
}

/** Los premios del ranking que ve la cuenta entre sus regalos del servidor (las migraciones ponen otros para todos) */
const giftsOf = async (api: Api) =>
  ((await api.call('/api/server-gifts')).data.gifts as { id: string; money: number; tickets: number }[]).filter((g) => g.id.startsWith('ranking-'))

const countGifts = async (api: Api) => (await api.env.DB.prepare("SELECT COUNT(*) AS n FROM server_gifts WHERE id LIKE 'ranking-%'").first<number>('n')) ?? 0

afterEach(() => vi.useRealTimers())

describe('premios semanales del ranking', () => {
  it('la torre: podio para los tres primeros y premio de participación para los demás; solo la semana que acabó', async () => {
    const names = ['Ash', 'Gary', 'Misty', 'Brock', 'Tracey']
    const first = await player('p0@kanto.es', names[0])
    const players = [first]
    for (let i = 1; i < names.length; i++) players.push(await player(`p${i}@kanto.es`, names[i], first.env))
    const floors = [40, 30, 20, 10]
    for (let i = 0; i < floors.length; i++) await climbed(players[i], floors[i])
    await climbed(players[4], 99, rankingWeek(NOW))

    await awardWeeklyPrizes(first.env.DB, NOW)

    const { podium, rest } = RANKING_PRIZES[WeeklyBoard.Tower]
    const expected = [...podium, rest]
    for (let i = 0; i < expected.length; i++) {
      const gifts = await giftsOf(players[i])
      expect(gifts).toHaveLength(1)
      expect(gifts[0]).toMatchObject({ money: expected[i].money, tickets: expected[i].tickets })
    }
    expect(await giftsOf(players[4])).toEqual([])
  })

  it('cada ranking se reparte una sola vez por semana', async () => {
    const ash = await player('ash@kanto.es', 'Ash')
    await climbed(ash, 12)
    await awardWeeklyPrizes(ash.env.DB, NOW)
    const count = await countGifts(ash)
    await climbed(ash, 50)
    await awardWeeklyPrizes(ash.env.DB, NOW + 60_000)
    expect(await countGifts(ash)).toBe(count)
  })

  it('el daño a jefes: el de la semana pasada sigue ahí al rehacer las fotos y se premia', async () => {
    const ash = await player('ash@kanto.es', 'Ash')
    await addDamage(ash.env.DB, [{ playerId: await accountId(ash), uid: 'mon-1', speciesId: STARTERS[0], damage: 500 }], LAST_WEEK + 1000)
    await refreshRanking(ash.env.DB, NOW)
    await awardWeeklyPrizes(ash.env.DB, NOW)
    const [gift] = await giftsOf(ash)
    expect(gift.id).toContain(WeeklyBoard.Damage)
    expect(gift).toMatchObject({ money: RANKING_PRIZES[WeeklyBoard.Damage].podium[0].money })
  })
})
