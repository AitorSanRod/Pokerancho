import { useState } from 'react'
import { ICON } from './icons'
import { ItemIcon } from './ItemIcon'
import './other-tab.css'

/** Pantalla de cuando la partida ya está abierta en otra pestaña (ver store/tabLock.ts) */
export function OtherTabScreen({ onPlayHere }: { onPlayHere: () => void }) {
  const [moving, setMoving] = useState(false)
  return (
    <div className="other-tab">
      <ItemIcon item={ICON.Ranch} size={48} />
      <h2>La partida está abierta en otra pestaña</h2>
      <p className="small">Solo se puede jugar en una a la vez, para que ninguna pise lo que guarda la otra.</p>
      <button
        className="btn primary"
        disabled={moving}
        onClick={() => {
          setMoving(true)
          onPlayHere()
        }}
      >
        {moving ? 'Trayendo la partida…' : 'Jugar aquí'}
      </button>
    </div>
  )
}
