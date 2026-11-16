import { species } from '../../data/species'
import { act } from '../../store/store'
import type { IncursionProgress } from '../../game/incursion/activeIncursion'
import type { RaidRotation } from '../../game/raid/online/protocol'
import type { TabRaid } from '../../game/raid/raid'
import { bossHpAtJoin, bossShareTaken, finalBossHp } from '../../game/raid/raidFight'
import { collectRaid } from '../../game/raid/raidPlay'
import { roomBoss, type RaidPrize } from '../../game/raid/raidRoom'
import { formatPercent } from '../shared/format'
import type { SceneMon } from '../incursion/sceneState'
import '../incursion/incursion-finale.css'

interface Props {
  rotation: RaidRotation
  tr: TabRaid
  p: IncursionProgress
  party: SceneMon[]
  /** Al recoger: el premio, para enseñarlo */
  onCollected: (prize: RaidPrize) => void
}

/** Cómo acabó: el jefe cayó, la sala cayó entera o se acabó el tiempo y se escapó */
function title(p: IncursionProgress, party: SceneMon[], name: string): string {
  if (finalBossHp(p) === 0) return `¡${name} ha caído!`
  return party.every((m) => m.out || m.hp === 0) ? 'La sala ha caído' : `${name} se ha escapado`
}

/** La parte del premio: por la vida que le quitó la sala desde que entró tu Pokémon (`joinedAt`, null si no llegó) */
function shareText(joinedAt: number | null, share: number): string {
  if (joinedAt === null) return 'Tu Pokémon no llegó a entrar en la pelea: no hay premio.'
  if (share >= 1) return 'Os lleváis el premio entero.'
  const since = joinedAt < 1 ? ' desde que entraste' : ''
  return `Le habéis quitado el ${formatPercent(share)} de su vida${since}: te llevas esa parte del premio.`
}

/** Final de la pelea: cómo acabó, la parte del jefe que le quitó la sala (el premio va por ella) y recogerlo */
export function RaidFinale({ rotation, tr, p, party, onCollected }: Props) {
  const name = species(roomBoss(tr.room).speciesId).name
  const fight = tr.room.fight!
  const joinedAt = bossHpAtJoin(fight, p, tr.uid)
  const share = bossShareTaken(fight, p, tr.uid)
  const collect = () => {
    const prize = act((s) => collectRaid(s, rotation, Date.now()))
    if (prize) onCollected(prize)
  }

  return (
    <section className="card incursion-summary">
      <h3>{title(p, party, name)}</h3>
      <p className="small">{shareText(joinedAt, share)} Tu Pokémon vuelve al rancho con los PS que le queden.</p>
      <button className="btn primary" onClick={collect}>
        Recoger
      </button>
    </section>
  )
}
