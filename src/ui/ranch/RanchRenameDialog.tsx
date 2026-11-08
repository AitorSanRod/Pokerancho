import { useState } from 'react'
import type { GameState } from '../../game/core/state'
import { act } from '../../game/core/store'
import { defaultRanchName, RANCH_NAME_MAX_LENGTH, renameRanch } from '../../game/team/ranchNames'
import { ConfirmDialog } from '../shared/ConfirmDialog'

/** Poner nombre al rancho; dejarlo vacío le devuelve el de por defecto */
export function RanchRenameDialog({ game, ranch, onClose }: { game: GameState; ranch: number; onClose: () => void }) {
  const [draft, setDraft] = useState(game.ranchNames[ranch] ?? '')
  const save = () => {
    act((s) => renameRanch(s, ranch, draft))
    onClose()
  }

  return (
    <ConfirmDialog title="Nombre del rancho" confirmLabel="Guardar" onConfirm={save} onCancel={onClose}>
      <p className="small confirm-text">Déjalo vacío para que vuelva a llamarse {defaultRanchName(ranch)}.</p>
      <input
        className="text-input"
        value={draft}
        maxLength={RANCH_NAME_MAX_LENGTH}
        placeholder={defaultRanchName(ranch)}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
      />
    </ConfirmDialog>
  )
}
