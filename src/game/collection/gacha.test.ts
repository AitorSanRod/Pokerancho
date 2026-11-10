import { describe, expect, it } from 'vitest'
import { Rarity } from '../../data/species'
import { initialState } from '../core/state'
import { seqRng } from '../core/test-utils'
import { buyTicket, maxTicketsToBuy, MONEY_PRIZES, MONEY_SLOT_CHANCE, PIECES_PER_PULL, pull, TICKET_PRICE } from './gacha'
import { piecesOf } from './pieces'

// El primer número de cada tirada decide si sale dinero (y, si sale, el siguiente cuál); luego, si sale objeto
// estelar; el resto, rareza y especie de cada pieza
const NOTHING = 0.99
// rng = 0 siempre cae en la primera especie legendaria; 0.99 cae en común
const LEGENDARY = seqRng(NOTHING, NOTHING, ...Array<number>(2 * PIECES_PER_PULL).fill(0))
const COMMON = seqRng(NOTHING)
// Dinero (el primer premio), sin objeto y piezas comunes: justo los números de una tirada, para que todas empiecen igual
const MONEY = seqRng(0, 0, NOTHING, ...Array<number>(2 * (PIECES_PER_PULL - 1)).fill(NOTHING))

describe('pull', () => {
  it('no permite tirar sin tickets', () => {
    const s = initialState()
    s.tickets = 0
    expect(pull(s, 1, LEGENDARY)).toEqual({ pieces: [], money: [], starItems: [] })
    expect(s.pieces).toEqual({})
  })

  it('cada tirada gasta un ticket y da sus piezas', () => {
    const s = initialState()
    s.tickets = 1
    const { pieces, money } = pull(s, 1, COMMON)
    expect(pieces).toHaveLength(PIECES_PER_PULL)
    expect(money).toEqual([])
    expect(s.tickets).toBe(0)
  })

  it('las piezas se suman por especie sin marcarla como vista ni como capturada', () => {
    const s = initialState()
    s.tickets = 1
    const [drop] = pull(s, 1, LEGENDARY).pieces
    expect(drop.rarity).toBe(Rarity.Legendary)
    expect(piecesOf(s, drop.speciesId)).toBe(PIECES_PER_PULL)
    expect(s.seen).not.toContain(drop.speciesId)
    expect(s.caught).not.toContain(drop.speciesId)
    expect(s.owned).toHaveLength(0)
  })

  it('tira varias veces mientras queden tickets', () => {
    const s = initialState()
    s.tickets = 2
    expect(pull(s, 10, COMMON).pieces).toHaveLength(2 * PIECES_PER_PULL)
    expect(s.tickets).toBe(0)
  })

  it('si sale dinero, una sola casilla de la tirada lo da en vez de pieza', () => {
    const s = initialState()
    const money = s.money
    s.tickets = 2
    const result = pull(s, 2, MONEY)
    expect(result.money).toEqual([MONEY_PRIZES[0].amount, MONEY_PRIZES[0].amount])
    expect(result.pieces).toHaveLength(2 * (PIECES_PER_PULL - 1))
    expect(s.money).toBe(money + 2 * MONEY_PRIZES[0].amount)
  })

  it('el dinero sale solo por debajo de su probabilidad', () => {
    const s = initialState()
    s.tickets = 1
    expect(pull(s, 1, seqRng(MONEY_SLOT_CHANCE)).money).toEqual([])
  })

  it('el premio de dinero se sortea entre todos los posibles', () => {
    const s = initialState()
    s.tickets = 1
    const last = MONEY_PRIZES[MONEY_PRIZES.length - 1].amount
    expect(pull(s, 1, seqRng(0, 0.999999)).money).toEqual([last])
  })
})

describe('buyTicket', () => {
  it('cambia pokécuartos por un ticket', () => {
    const s = initialState()
    s.money = TICKET_PRICE
    buyTicket(s)
    expect(s.money).toBe(0)
    expect(s.tickets).toBe(initialState().tickets + 1)
  })

  it('no hace nada si no hay dinero suficiente', () => {
    const s = initialState()
    s.money = TICKET_PRICE - 1
    expect(buyTicket(s)).toBe(false)
    expect(s.money).toBe(TICKET_PRICE - 1)
  })

  it('compra varios de una vez si llega el dinero para todos', () => {
    const s = initialState()
    const tickets = s.tickets
    s.money = TICKET_PRICE * 3 + 1
    expect(maxTicketsToBuy(s)).toBe(3)
    expect(buyTicket(s, 4)).toBe(false)
    expect(s.tickets).toBe(tickets)
    expect(buyTicket(s, 3)).toBe(true)
    expect(s.tickets).toBe(tickets + 3)
    expect(s.money).toBe(1)
  })
})
