import type { ReactNode } from 'react'
import type { RaidBoss } from '../../data/raidBosses'
import { species } from '../../data/species'
import type { SceneState } from '../incursion/sceneState'
import { IncursionMenu } from '../incursion/IncursionMenu'
import { Bar } from '../shared/common'
import { formatClock } from '../shared/format'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'

interface Props {
  boss: RaidBoss
  scene: SceneState
  /** Revivires que le quedan a tu Pokémon */
  revives: number
  /** Milisegundos reales que le quedan a la pelea */
  msLeft: number
  menuOpen: boolean
  onMenu: () => void
  /** Avisos bajo la vida del jefe y el panel del menú */
  children: ReactNode
}

/**
 * Cabecera de la pelea del jefe, como la de una ruta: el jefe con su nivel y el tiempo que queda, su vida, los
 * revivires de tu Pokémon y el «Menú». Los PS de los demás no se ven aquí: están en el menú
 */
export function RaidFightHud({ boss, scene, revives, msLeft, menuOpen, onMenu, children }: Props) {
  const foe = scene.foes.find((f) => f.boss) ?? scene.foes[0]
  const hp = foe?.hp ?? 0
  const maxHp = foe?.maxHp ?? 1
  return (
    <div className="incursion-hud raid-fight-hud">
      <header className="incursion-head">
        <span className="incursion-head-title small">
          <strong>{species(boss.speciesId).name}</strong> Nv. {boss.level}
        </span>
        <span className="small raid-fight-clock">{formatClock(msLeft)}</span>
        <span className="incursion-revives" aria-label={`Revivires de tu Pokémon: ${revives}`}>
          <ItemIcon item={ICON.Revive} size={22} off={revives === 0} /> ×{revives}
        </span>
        <IncursionMenu open={menuOpen} onToggle={onMenu} />
      </header>
      <Bar value={hp} max={maxHp} kind="hp" />
      <span className="tiny">
        {Math.ceil((hp / maxHp) * 100)}% · {hp} / {maxHp} PS
      </span>
      {children}
    </div>
  )
}
