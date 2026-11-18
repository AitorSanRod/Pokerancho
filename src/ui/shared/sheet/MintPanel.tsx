import { useState } from 'react'
import { STAT_NAME } from '../../../data/incursionMoves'
import { NATURES, type Nature } from '../../../data/natures'
import { species } from '../../../data/species'
import type { GameState, OwnedMon } from '../../../game/core/state'
import { act } from '../../../store/store'
import { applyMint, mintBlocker, MintKind, mintsOf } from '../../../game/team/mints'
import { ConfirmDialog } from '../ConfirmDialog'
import { ItemIcon } from '../ItemIcon'
import { MonSection } from './MonSheet'
import { MINT_EFFECT, MINT_NAME, mintIcon } from './mintText'

/** «Seria (no sube ni baja nada)» o «Miedosa: ▲ Velocidad ▼ Ataque» */
function natureText(nature: Nature): string {
  const { name, up, down } = NATURES[nature]
  return up && down ? `${name}: ▲ ${STAT_NAME[up]} ▼ ${STAT_NAME[down]}` : `${name} (no sube ni baja nada)`
}

/** Qué pasará al usar la menta (la aleatoria no dice cuál saldrá; después, sí) */
const confirmText = (kind: MintKind, name: string, nature: Nature) =>
  `${name} perderá su naturaleza ${NATURES[nature].name.toLowerCase()} y tendrá ${kind === MintKind.Neutral ? 'la neutra' : 'otra al azar, distinta'}. No se puede deshacer y se gasta la menta.`

/** Usar una Menta (aleatoria o neutra) en la ficha. Sin mentas (y sin un resultado que enseñar), no se pinta */
export function MintPanel({ game, mon }: { game: GameState; mon: OwnedMon }) {
  const [confirming, setConfirming] = useState<MintKind | null>(null)
  const [result, setResult] = useState<Nature | null>(null)
  const kinds = Object.values(MintKind).filter((kind) => mintsOf(game, kind) > 0)
  if (kinds.length === 0 && !result) return null
  const name = species(mon.speciesId).name
  const spendMint = (kind: MintKind) => {
    setResult(act((s) => applyMint(s, mon.uid, kind)))
    setConfirming(null)
  }
  return (
    <MonSection title="Naturaleza">
      <p className="small">{natureText(mon.nature)}</p>
      {kinds.map((kind) => {
        const blocker = mintBlocker(game, mon.uid, kind)
        return (
          <div key={kind}>
            <button className="btn big-action" disabled={!!blocker} onClick={() => setConfirming(kind)}>
              <ItemIcon item={mintIcon(kind)} size={40} />
              <span className="grow">
                {MINT_NAME[kind]} <span className="tiny muted">×{mintsOf(game, kind)}</span>
                <span className="tiny muted evolve-requirement">{MINT_EFFECT[kind]}</span>
              </span>
              <span className="tag">Usar</span>
            </button>
            {blocker && <p className="tiny muted">{blocker}</p>}
          </div>
        )
      })}
      {result && <p className="tiny">¡Ahora {name} es {NATURES[result].name.toLowerCase()}!</p>}
      {confirming && (
        <ConfirmDialog title={`¿Usar la ${MINT_NAME[confirming]}?`} confirmLabel="Usar" onConfirm={() => spendMint(confirming)} onCancel={() => setConfirming(null)}>
          <p className="small">{confirmText(confirming, name, mon.nature)}</p>
        </ConfirmDialog>
      )}
    </MonSection>
  )
}
