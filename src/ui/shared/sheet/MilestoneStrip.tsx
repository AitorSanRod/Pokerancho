import type { GameState, OwnedMon } from '../../../game/core/state'
import { LEVEL_MILESTONES, levelMilestoneBonus } from '../../../game/team/milestones'
import { starBonusFor } from '../../../game/team/perks'
import { formatBonus } from '../format'

/**
 * Hitos del Pokémon en la ficha (Datos): los niveles que suben sus stats, marcados los que ya tiene, y lo que suma en
 * combate por ellos y por las especies con 5 ★ de sus tipos
 */
export function MilestoneStrip({ game, mon }: { game: GameState; mon: OwnedMon }) {
  const fromLevel = levelMilestoneBonus(mon.level)
  const fromStars = starBonusFor(game, mon.speciesId)
  return (
    <div className="milestones">
      <div className="milestone-pills">
        {LEVEL_MILESTONES.map((level) => (
          <span key={level} className={`milestone-pill ${mon.level >= level ? 'reached' : ''}`}>
            Nv. {level}
          </span>
        ))}
      </div>
      <p className="tiny muted center">
        En combate: {fromLevel > 0 ? `${formatBonus(fromLevel)} stats por hitos` : 'sin hitos de nivel aún'}
        {fromStars > 0 && ` · ${formatBonus(fromStars)} por 5 ★ de sus tipos`}
      </p>
    </div>
  )
}
