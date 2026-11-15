import { species } from '../../data/species'
import { act } from '../../store/store'
import type { IncursionProgress } from '../../game/incursion/activeIncursion'
import type { RaidRotation } from '../../game/raid/online/protocol'
import { bossShareTaken, finalBossHp } from '../../game/raid/raidFight'
import { collectRaid } from '../../game/raid/raidPlay'
import type { RaidPrize } from '../../game/raid/raidRoom'
import { formatPercent } from '../shared/format'
import type { SceneMon } from '../incursion/sceneState'

interface Props {
  rotation: RaidRotation
  bossSpeciesId: number
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

/** Final de la pelea: cómo acabó, la parte del jefe que le quitó la sala (el premio va por ella) y recogerlo */
export function RaidFinale({ rotation, bossSpeciesId, p, party, onCollected }: Props) {
  const name = species(bossSpeciesId).name
  const share = bossShareTaken(p)
  const collect = () => {
    const prize = act((s) => collectRaid(s, rotation, Date.now()))
    if (prize) onCollected(prize)
  }

  return (
    <section className="card incursion-summary">
      <h3>{title(p, party, name)}</h3>
      <p className="small">
        {share >= 1
          ? 'Os lleváis el premio entero.'
          : `Le habéis quitado el ${formatPercent(share)} de su vida: os lleváis esa parte del premio.`}{' '}
        Tu Pokémon vuelve al rancho con los PS que le queden.
      </p>
      <button className="btn primary" onClick={collect}>
        Recoger
      </button>
    </section>
  )
}
