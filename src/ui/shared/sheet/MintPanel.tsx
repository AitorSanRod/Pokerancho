import { useState } from 'react'
import { STAT_NAME } from '../../../data/incursionMoves'
import { NATURES, type Nature } from '../../../data/natures'
import { species } from '../../../data/species'
import type { GameState, OwnedMon } from '../../../game/core/state'
import { act } from '../../../game/core/store'
import { applyMint, mintBlocker, mintsOf } from '../../../game/team/mints'
import { ConfirmDialog } from '../ConfirmDialog'
import { ICON } from '../icons'
import { ItemIcon } from '../ItemIcon'
import { MonSection } from './MonSheet'

/** «Seria (no sube ni baja nada)» o «Miedosa: ▲ Velocidad ▼ Ataque» */
function natureText(nature: Nature): string {
  const { name, up, down } = NATURES[nature]
  return up && down ? `${name}: ▲ ${STAT_NAME[up]} ▼ ${STAT_NAME[down]}` : `${name} (no sube ni baja nada)`
}

/**
 * Usar una Menta aleatoria: la naturaleza pasa a otra al azar. La confirmación no dice cuál saldrá; después, sí.
 * Sin mentas (y sin un resultado que enseñar), no se pinta
 */
export function MintPanel({ game, mon }: { game: GameState; mon: OwnedMon }) {
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState<Nature | null>(null)
  if (mintsOf(game) === 0 && !result) return null
  const blocker = mintBlocker(game, mon.uid)
  const name = species(mon.speciesId).name
  const spendMint = () => {
    setResult(act((s) => applyMint(s, mon.uid)))
    setConfirming(false)
  }
  return (
    <MonSection title="Naturaleza">
      <p className="small">{natureText(mon.nature)}</p>
      {mintsOf(game) > 0 && (
        <button className="btn big-action" disabled={!!blocker} onClick={() => setConfirming(true)}>
          <ItemIcon item={ICON.Mint} size={40} />
          <span className="grow">
            Menta aleatoria <span className="tiny muted">×{mintsOf(game)}</span>
            <span className="tiny muted evolve-requirement">Otra naturaleza al azar</span>
          </span>
          <span className="tag">Usar</span>
        </button>
      )}
      {blocker && mintsOf(game) > 0 && <p className="tiny muted">{blocker}</p>}
      {result && <p className="tiny">¡Ahora {name} es {NATURES[result].name.toLowerCase()}!</p>}
      {confirming && (
        <ConfirmDialog title="¿Usar la Menta aleatoria?" confirmLabel="Usar" onConfirm={spendMint} onCancel={() => setConfirming(false)}>
          <p className="small">
            {name} perderá su naturaleza {NATURES[mon.nature].name.toLowerCase()} y tendrá otra al azar, distinta. No se puede deshacer y se
            gasta la menta.
          </p>
        </ConfirmDialog>
      )}
    </MonSection>
  )
}
