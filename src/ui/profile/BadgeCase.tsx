import { BADGE_IDS, BADGES } from '../../data/badges'
import type { GameState } from '../../game/core/state'
import { BadgeIcon } from './BadgeIcon'

/** Estuche de medallas: las 8 de la región, las ganadas a color y las demás apagadas */
export function BadgeCase({ game }: { game: GameState }) {
  return (
    <div className="badge-case">
      {BADGE_IDS.map((b) => {
        const earned = game.badges.includes(b)
        return (
          <div key={b} className={`badge-slot ${earned ? 'earned' : ''}`} title={`${BADGES[b].name} · ${BADGES[b].city}`}>
            <BadgeIcon badge={b} size={44} off={!earned} />
            <span className="tiny">{earned ? BADGES[b].name.replace('Medalla ', '') : '¿?'}</span>
          </div>
        )
      })}
    </div>
  )
}
