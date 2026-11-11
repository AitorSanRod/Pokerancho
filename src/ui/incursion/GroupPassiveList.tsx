import { TYPE_INFO } from '../../data/types'
import type { GroupPassive } from '../../game/incursion/groupPassives'
import { groupPassiveText } from '../shared/passiveText'

/** Pasivas que tiene ahora el grupo: tipo y nivel, y lo que da cada una a todos */
export function GroupPassiveList({ passives }: { passives: GroupPassive[] }) {
  return (
    <ul className="incursion-passives">
      {passives.map((ps) => (
        <li key={ps.type} className="incursion-passive-row">
          <span className="incursion-passive tiny" style={{ ['--type-color' as string]: TYPE_INFO[ps.type].color }}>
            {TYPE_INFO[ps.type].name} · Nv. {ps.level}
          </span>
          <span className="small">{groupPassiveText(ps.type, ps.level)}</span>
        </li>
      ))}
    </ul>
  )
}
