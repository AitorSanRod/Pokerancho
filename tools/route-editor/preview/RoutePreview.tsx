import { useState } from 'react'
import type { Route } from '../../../src/data/maps'
import { CompanionPicker } from './CompanionPicker'
import { useCompanion } from './useCompanion'
import { RouteCards } from './RouteCards'
import { SimPanel } from './SimPanel'
import { stopStage } from './stage'
import { StopScene } from './StopScene'
import { StopStrip } from './StopStrip'

/** La ruta del borrador como en el juego: su línea en la lista, el mapa de paradas, cada parada y cuánto se tarda */
export function RoutePreview({ route }: { route: Route }) {
  const [companion, setCompanion] = useCompanion()
  const [picked, setPicked] = useState(1)
  const selected = Math.min(picked, route.nodes.length - 1)
  const node = route.nodes[selected]
  return (
    <>
      <h3>En la lista de rutas</h3>
      <RouteCards route={route} />
      {!route.backdrop && <p className="preview-note">Sin imagen: marca «Imagen en la lista de rutas» y pon un fichero de src/assets/routes/.</p>}

      <h3>Tu Pokémon</h3>
      <CompanionPicker companion={companion} onChange={setCompanion} />

      <h3>Paradas</h3>
      <StopStrip route={route} selected={selected} onSelect={setPicked} />
      {node && (
        <StopScene
          key={`${node.id}:${selected}`}
          biome={route.biome}
          signText={route.name}
          stopKey={`${node.id}:${selected}`}
          landmark={node.landmark}
          stage={stopStage(route, node)}
          companion={companion}
        />
      )}

      <h3>Duración y dificultad</h3>
      <SimPanel key={JSON.stringify([route, companion])} route={route} companion={companion} />
    </>
  )
}
