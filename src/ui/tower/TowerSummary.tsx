import { species } from '../../data/species'
import { TowerEnd, type TowerRun } from '../../game/tower/tower'
import { giftText } from '../gift/giftText'
import { Sprite } from '../shared/common'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'

/** Tamaño (px) del sprite de cada especie de la que se ganaron tickets */
const PIECE_SPRITE = 36

/** Cómo acabó la subida y lo ganado en ella */
export function TowerSummary({ tower }: { tower: TowerRun }) {
  const e = tower.earned
  const won = tower.floor - 1
  const pieces = countBySpecies(e.pieces)
  return (
    <div className="card tower-summary">
      <strong>{tower.end === TowerEnd.Left ? `Abandonaste antes del piso ${tower.floor}` : `Cayó en el piso ${tower.floor}`}</strong>
      <span className="small">
        {won} {won === 1 ? 'piso superado' : 'pisos superados'}
        {won > tower.startBest && <strong className="tower-record"> · ¡Nuevo récord!</strong>}
      </span>
      <div className="tower-earned">
        <Earned icon={ICON.Money} text={`₽ ${e.money.toLocaleString('es-ES')}`} />
        <Earned icon={ICON.Exp} text={`${e.exp.toLocaleString('es-ES')} EXP${e.levelsGained > 0 ? ` (+${e.levelsGained} Nv.)` : ''}`} />
      </div>
      {e.prizes.map((p, i) => (
        <Earned key={i} icon={ICON.Gift} text={`Premio: ${giftText(p)}`} />
      ))}
      {pieces.length > 0 && (
        <div className="tower-pieces">
          {pieces.map(([id, count]) => (
            <span key={id} className="tower-piece tiny" title={species(id).name}>
              <Sprite id={id} size={PIECE_SPRITE} animated={false} />×{count}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function Earned({ icon, text }: { icon: Parameters<typeof ItemIcon>[0]['item']; text: string }) {
  return (
    <span className="with-icon small">
      <ItemIcon item={icon} size={24} /> {text}
    </span>
  )
}

/** [especie, tickets] en el orden en que salieron */
function countBySpecies(ids: number[]): [number, number][] {
  const counts = new Map<number, number>()
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1)
  return [...counts]
}
