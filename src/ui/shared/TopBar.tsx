import type { GameState } from '../../game/core/state'
import { act } from '../../store/store'
import { ICON } from './icons'
import { ItemIcon } from './ItemIcon'
import { formatCount, formatMoney } from './format'

/** Multiplicadores de tiempo para probar sin esperar; el botón solo existe en desarrollo (npm run dev) */
const TIME_SCALES = [1, 10, 60]

/** Barra superior: nombre del juego, dinero, tickets y trozos de MissingNo */
export function TopBar({ game }: { game: GameState }) {
  return (
    <header className="top-bar">
      <span className="logo">Pokérancho</span>
      <span className="currency" aria-label={`Dinero: ${formatMoney(game.money)}`}>
        {formatMoney(game.money)}
      </span>
      <span className="currency with-icon" aria-label={`Tickets de gacha: ${formatCount(game.tickets)}`}>
        <ItemIcon item={ICON.Ticket} size={20} /> {formatCount(game.tickets)}
      </span>
      <span className="currency with-icon" aria-label={`Trozos de MissingNo: ${formatCount(game.missingnoShards)}`}>
        <ItemIcon item={ICON.Shard} size={20} /> {formatCount(game.missingnoShards)}
      </span>
      {import.meta.env.DEV && <TimeScaleButton timeScale={game.timeScale} />}
    </header>
  )
}

function TimeScaleButton({ timeScale }: { timeScale: number }) {
  const cycle = () =>
    act((s) => {
      s.timeScale = TIME_SCALES[(TIME_SCALES.indexOf(s.timeScale) + 1) % TIME_SCALES.length]
    })
  return (
    <button className="time-chip" onClick={cycle} title="Velocidad del tiempo (solo en desarrollo)">
      x{timeScale}
    </button>
  )
}
