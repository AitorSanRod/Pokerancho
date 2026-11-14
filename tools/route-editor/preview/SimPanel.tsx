import { useState } from 'react'
import type { Route } from '../../../src/data/maps'
import { createMon } from '../../../src/game/team/mons'
import { stepsPerMinute } from '../../../src/game/team/stats'
import { simulate, type Companion, type SimPatch, type SimResult } from './simulate'

/** Vueltas de cada simulación */
const SIM_RUNS = 20

const minutes = (ms: number) => `${(ms / 60_000).toFixed(1)} min`

const routeSteps = (r: Route) => r.nodes.reduce((sum, n) => sum + (n.next[0]?.steps ?? 0), 0)

function Result({ route, result, walk }: { route: Route; result: SimResult; walk: boolean }) {
  if (result.blocked) return <p className="sim-bad">{result.blocked}</p>
  const pct = Math.round((result.completed / result.runs) * 100)
  const walkMs = result.totalMs - result.battleMs - result.healMs
  const falls = result.fallsAt.map((count, i) => ({ count, i })).filter((f) => f.count > 0)
  return (
    <div className="sim-result">
      <p className={pct >= 70 ? 'sim-ok' : pct >= 30 ? 'sim-warn' : 'sim-bad'}>
        {walk ? 'La completa' : 'Gana'} {result.completed} de {result.runs} veces ({pct} %){result.completed > 0 && <> · tarda {minutes(result.completedMs)}</>}
      </p>
      <p className="sim-split">
        {walk
          ? `Por vuelta: ${minutes(walkMs)} andando · ${minutes(result.battleMs)} en combates · ${Math.round(result.healMs / 1000)} s curándose`
          : `El combate dura ${minutes(result.battleMs)}`}
      </p>
      {walk && falls.length > 0 && (
        <ul className="sim-falls">
          {falls.map(({ count, i }) => (
            <li key={i}>
              Cae en la parada {i} ({route.nodes[i]?.name || 'sin nombre'}): {count}
            </li>
          ))}
        </ul>
      )}
      {result.raidAt !== null && <p className="sim-warn">Se para en el jefe comunitario (parada {result.raidAt}): esas salas no se simulan.</p>}
    </div>
  )
}

/**
 * Cuánto se tarda y si se gana: lo que se anda, a la velocidad del Pokémon elegido, y una simulación con el motor (sin
 * rancho, estrellas ni toques, así que el jugador irá algo mejor). `walk`: con lo que se anda (en una ruta; no en la de
 * mentira de un entrenador o un gimnasio)
 */
export function SimPanel({ route, companion, patch, walk = true }: { route: Route; companion: Companion; patch?: SimPatch; walk?: boolean }) {
  const [result, setResult] = useState<SimResult | null>(null)
  const [busy, setBusy] = useState(false)
  const spm = stepsPerMinute(createMon(companion.speciesId, companion.level))
  const steps = routeSteps(route)
  const run = () => {
    setBusy(true)
    // Deja pintar el «Simulando…» antes de bloquear con la simulación
    setTimeout(() => {
      setResult(simulate(route, companion, SIM_RUNS, patch))
      setBusy(false)
    }, 20)
  }
  return (
    <div className="sim">
      {walk && (
        <p>
          {steps} pasos a {spm} pasos/min: <b>{minutes((steps / spm) * 60_000)}</b> andando, sin tocar la pantalla, más los combates.
        </p>
      )}
      <button type="button" className="btn" onClick={run} disabled={busy}>
        {busy ? 'Simulando…' : `Simular ${SIM_RUNS} veces`}
      </button>
      {result && !busy && <Result route={route} result={result} walk={walk} />}
    </div>
  )
}
