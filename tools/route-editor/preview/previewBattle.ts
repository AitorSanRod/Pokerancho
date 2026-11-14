// Un combate quieto, en su primer momento, para pintar con RouteBattle cómo se ve un rival de la ruta (salvaje, jefe,
// entrenador o líder) sin jugarlo.

import { species } from '../../../src/data/species'
import type { BattleRecord, BattleSide } from '../../../src/game/battle/battle'
import type { BattleFrame } from '../../../src/ui/route/battleFrame'

/** PS de mentira: las barras salen llenas */
const FULL_HP = 100

const side = (speciesId: number, level: number): BattleSide => ({ speciesId, name: species(speciesId).name, level, maxHp: FULL_HP })

export interface PreviewBattle {
  record: BattleRecord
  frame: BattleFrame
}

export function previewBattle(player: { speciesId: number; level: number }, foe: { speciesId: number; level: number }, boss: boolean): PreviewBattle {
  const event = { kind: 'info' as const, text: '', playerHp: FULL_HP, enemyHp: FULL_HP, playerStatus: null, enemyStatus: null }
  const record: BattleRecord = {
    player: side(player.speciesId, player.level),
    enemy: side(foe.speciesId, foe.level),
    events: [event],
    outcome: 'win',
    boss,
    rewards: { money: 0, tickets: 0, exp: 0, piece: false, moneyLost: 0 },
  }
  return { record, frame: { index: 0, event, ended: false } }
}
