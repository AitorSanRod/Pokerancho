import type { IncursionProgress } from '../../game/incursion/activeIncursion'
import { partyDamage } from '../../game/incursion/damageTally'
import { Bar, Sprite } from '../shared/common'
import { memberNote } from './memberNote'
import type { SceneMon } from './sceneState'

interface Props {
  p: IncursionProgress
  party: SceneMon[]
  uid: string
  nicknames: Record<string, string>
}

/** Quién ha hecho más daño en toda la incursión: una línea por Pokémon del grupo, de más a menos */
export function DamageTally({ p, party, uid, nicknames }: Props) {
  const lines = partyDamage(p)
  const top = lines[0]?.damage ?? 0
  return (
    <div className="incursion-roster-col">
      {lines.map(({ id, damage }, i) => {
        const m = party.find((x) => x.id === id)
        if (!m) return null
        const note = memberNote(id, uid, nicknames)
        return (
          <div key={id} className={`incursion-line ${id === uid ? 'mine' : ''}`}>
            <span className="incursion-damage-rank tiny">{i + 1}.</span>
            <Sprite id={m.speciesId} size={32} animated={false} />
            <div className="incursion-line-main">
              <span className="incursion-line-name tiny">
                <strong>{m.name}</strong>
                {note && <em> · {note}</em>}
              </span>
              <Bar value={damage} max={top} kind="exp" />
            </div>
            <strong className="incursion-damage-total small">{damage}</strong>
          </div>
        )
      })}
    </div>
  )
}
