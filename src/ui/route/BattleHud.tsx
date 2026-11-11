import type { CSSProperties } from 'react'
import { STATUS_INFO, type StatusId } from '../../data/passives'
import { species } from '../../data/species'
import { TYPE_INFO, type PokeType } from '../../data/types'
import type { BattleRecord } from '../../game/battle/battle'
import { Bar } from '../shared/common'
import './battle-hud.css'

/** Por debajo de esta fracción de PS el marco de la barra se pone rojo */
const LOW_HP = 0.2

const typeColor = (type: PokeType) => ({ ['--type-color' as string]: TYPE_INFO[type].color }) as CSSProperties

interface BattleHudProps {
  fighter: BattleRecord['player']
  hp: number
  /** Sus estados alterados (un jefe de incursión puede llevar varios) */
  statuses: readonly StatusId[]
  boss?: boolean
  /** Lo acaban de golpear: el marcador da un respingo */
  struck?: boolean
}

/**
 * Marcador de un combatiente, igual para los dos lados: tipos, nombre y nivel; debajo, la barra de PS con su etiqueta
 * y, si los tiene, los estados alterados (o «DEB» si se ha debilitado). Con pocos PS el marco de la barra se pone rojo.
 */
export function BattleHud({ fighter, hp, statuses, boss = false, struck = false }: BattleHudProps) {
  const { types } = species(fighter.speciesId)
  const low = hp > 0 && hp / fighter.maxHp <= LOW_HP
  const classes = ['battle-hud', boss && 'boss', low && 'low', hp === 0 && 'down', struck && 'struck'].filter(Boolean)

  return (
    <div className={classes.join(' ')} style={typeColor(types[0])}>
      <div className="hud-title">
        <span className="hud-types">
          {types.map((t) => (
            <i key={t} style={typeColor(t)} title={TYPE_INFO[t].name} />
          ))}
        </span>
        {boss && <span className="hud-boss">JEFE</span>}
        <strong className="hud-name">{fighter.name}</strong>
        <span className="hud-level">
          <small>Nv.</small>
          {fighter.level}
        </span>
      </div>
      <div className="hud-bar">
        <span className="hud-ps">PS</span>
        <Bar value={hp} max={fighter.maxHp} kind="hp" />
      </div>
      {(statuses.length > 0 || hp === 0) && (
        <div className="hud-foot">
          {hp === 0 ? <span className="hud-status down">DEB</span> : statuses.map((s) => <StatusBadge key={s} status={s} />)}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: StatusId }) {
  const info = STATUS_INFO[status]
  return (
    <span className="hud-status" style={typeColor(info.type)} title={info.name}>
      {info.short}
    </span>
  )
}
