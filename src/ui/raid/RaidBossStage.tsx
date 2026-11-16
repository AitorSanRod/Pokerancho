import { WalkScene } from '../route/WalkScene'
import { BOSS_SPRITE_SIZE } from '../route/spriteSizes'
import { Sprite } from '../shared/common'
import { raidBiome } from './raidBiome'
import '../route/battle.css'
import '../shared/stage-motion.css'
import './raid-scene.css'

/** El jefe en su paisaje, quieto (con la sala abierta) o en silueta (el de la próxima sala) */
export function RaidBossStage({ speciesId, silhouette = false }: { speciesId: number; silhouette?: boolean }) {
  return (
    <div className="raid-stage">
      <WalkScene biome={raidBiome(speciesId)} moving={false} speed={1}>
        <div className="route-battle">
          <div className="route-fighter enemy boss raid-boss-fighter">
            <div className="stage-idle boss">
              <Sprite id={speciesId} size={BOSS_SPRITE_SIZE} silhouette={silhouette} />
            </div>
          </div>
        </div>
      </WalkScene>
    </div>
  )
}
