// Escenas pixel art por bioma, generadas por código al abrir la primera ruta de ese bioma.

import { Biome } from '../../../data/maps'
import type { SceneDef } from './engine/types'
import { caveScene } from './scenes/cave'
import { ceruleanCityScene } from './scenes/ceruleanCity'
import { forestScene } from './scenes/forest'
import { meadowScene } from './scenes/meadow'
import { mtMoonScene } from './scenes/mtMoon'
import { palletTownScene } from './scenes/palletTown'
import { pewterCityScene } from './scenes/pewterCity'
import { labScene } from './scenes/lab'
import { seaScene } from './scenes/sea'

export { usePixelScene, type SceneLandmark } from './usePixelScene'

/** Píxeles de pantalla por píxel de arte */
export const PIXEL = 3
/** Semilla fija: el mismo paisaje en cada partida */
const SCENE_SEED = 1

const BUILDERS: Record<Biome, (seed: number) => SceneDef> = {
  [Biome.Meadow]: meadowScene,
  [Biome.PalletTown]: palletTownScene,
  [Biome.PewterCity]: pewterCityScene,
  [Biome.CeruleanCity]: ceruleanCityScene,
  [Biome.Forest]: forestScene,
  [Biome.Cave]: caveScene,
  [Biome.MtMoon]: mtMoonScene,
  [Biome.Sea]: seaScene,
  [Biome.Lab]: labScene,
}
const cache = new Map<string, SceneDef>()

/**
 * Escena pixel art del bioma (se genera una vez y se guarda). Con `label` (el nombre de la ruta), los elementos con
 * texto, como el cartel, lo llevan escrito; el resto de la escena se comparte.
 */
export function pixelSceneFor(biome: Biome, label?: string): SceneDef {
  const key = label === undefined ? biome : `${biome}|${label}`
  let scene = cache.get(key)
  if (!scene) {
    scene = label === undefined ? BUILDERS[biome](SCENE_SEED) : relabeled(pixelSceneFor(biome), label)
    cache.set(key, scene)
  }
  return scene
}

function relabeled(scene: SceneDef, label: string): SceneDef {
  const landmarks = scene.landmarks.map((l) => (l.relabel ? { ...l, pixmap: l.relabel(label) } : l))
  return { ...scene, landmarks }
}
