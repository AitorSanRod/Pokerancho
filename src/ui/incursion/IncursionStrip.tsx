import { STATUS_INFO } from '../../data/passives'
import { Bar, Sprite } from '../shared/common'
import type { SceneMon } from './sceneState'

/** Franja compacta bajo la escena: cada Pokémon del grupo y cada rival con su icono y sus PS; el detalle va desplegado aparte */
export function IncursionStrip({ party, foes, uid }: { party: SceneMon[]; foes: SceneMon[]; uid: string }) {
  return (
    <div className="incursion-strip">
      <div className="incursion-strip-side">
        {party.map((m) => (
          <StripMon key={m.id} m={m} mine={m.id === uid} />
        ))}
      </div>
      {foes.length > 0 && (
        <div className="incursion-strip-side foes">
          {foes.map((m) => (
            <StripMon key={m.id} m={m} mine={false} />
          ))}
        </div>
      )}
    </div>
  )
}

function StripMon({ m, mine }: { m: SceneMon; mine: boolean }) {
  const gone = m.out || m.hp === 0
  // En la franja no caben todos: el más reciente
  const newest = m.statuses.at(-1)
  return (
    <div className={`incursion-strip-mon ${gone ? 'gone' : ''} ${mine ? 'mine' : ''} ${m.boss ? 'boss' : ''}`} title={m.name}>
      <Sprite id={m.speciesId} size={36} animated={false} />
      {newest && !gone && <span className="incursion-strip-status">{STATUS_INFO[newest].short}</span>}
      <Bar value={m.out ? 0 : m.hp} max={m.maxHp} kind="hp" />
    </div>
  )
}
