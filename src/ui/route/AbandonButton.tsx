import { useState } from 'react'
import type { GameState } from '../../game/core/state'
import { endRun, restartBlocker, restartRun } from '../../game/run/run'
import { act } from '../../store/store'
import { ConfirmDialog } from '../shared/ConfirmDialog'

/**
 * Salir de la ruta a medias pide confirmación: se conserva lo ganado, pero no el premio final. Desde ahí también se
 * puede reiniciar: sale otra vez a la misma ruta con paradas y rivales nuevos
 */
export function AbandonButton({ game }: { game: GameState }) {
  const [confirming, setConfirming] = useState(false)
  const restartBlocked = restartBlocker(game)
  return (
    <>
      <button className="btn ghost small hud-abandon" onClick={() => setConfirming(true)}>
        Abandonar
      </button>
      {confirming && (
        <ConfirmDialog
          title="¿Abandonar la ruta?"
          confirmLabel="Abandonar"
          onConfirm={() => act(endRun)}
          onCancel={() => setConfirming(false)}
          extraAction={
            <button className="btn grow" disabled={!!restartBlocked} title={restartBlocked ?? undefined} onClick={() => {
                act(restartRun)
                setConfirming(false)
              }}
            >
              Reiniciar ruta
            </button>
          }
        >
          <p className="small confirm-text">
            Tu Pokémon volverá al rancho. Conservas lo ganado hasta ahora, pero no recibirás el premio de completarla. Si la
            reinicias, vuelve a salir desde el principio con otros Pokémon por el camino.
          </p>
        </ConfirmDialog>
      )}
    </>
  )
}
