import { useState } from 'react'
import type { Biome, StopLandmark } from '../../../src/data/maps'
import { species } from '../../../src/data/species'
import { HEAL_STOP_MS } from '../../../src/game/run/runHeal'
import { Sprite } from '../../../src/ui/shared/common'
import { HealStop } from '../../../src/ui/route/HealStop'
import { RouteBattle } from '../../../src/ui/route/RouteBattle'
import type { TrainerScene } from '../../../src/ui/route/gym/trainerScene'
import { WalkScene } from '../../../src/ui/route/WalkScene'
import { previewBattle } from './previewBattle'
import type { Stage } from './stage'
import type { Companion } from './simulate'

interface StopSceneProps {
  biome: Biome
  /** Texto de los carteles de la escena (el nombre de la ruta) */
  signText: string
  /** Clave para que el elemento de la parada entre de nuevo al cambiar de parada */
  stopKey: string
  landmark?: StopLandmark
  stage: Stage
  companion: Companion
}

const trainerScene = (stage: Stage, index: number): TrainerScene | null =>
  stage.trainer
    ? { ...stage.trainer, index, total: stage.foes.length, foeName: species(stage.foes[index].speciesId).name }
    : null

/** Botones para ver cada rival de la parada, uno a uno */
function FoePicker({ stage, index, onPick }: { stage: Stage; index: number; onPick: (i: number) => void }) {
  if (stage.foes.length < 2) return null
  return (
    <div className="foe-picker">
      {stage.foes.map((f, i) => (
        <button key={i} type="button" className={i === index ? 'on' : ''} onClick={() => onPick(i)} title={species(f.speciesId).name}>
          <Sprite id={f.speciesId} size={40} />
          <small>{stage.chances ? `${stage.chances[i]} %` : `Nv. ${f.level}`}</small>
        </button>
      ))}
    </div>
  )
}

/**
 * La escena de la parada con las piezas del juego: el fondo de su bioma con su elemento, el Pokémon del jugador y, si
 * hay combate, el rival (con su entrenador detrás) tal y como sale al empezar; en las de curación, la poción
 */
export function StopScene({ biome, signText, stopKey, landmark, stage, companion }: StopSceneProps) {
  const [picked, setPicked] = useState(0)
  const index = Math.min(picked, Math.max(0, stage.foes.length - 1))
  const foe = stage.foes[index]
  const battle = foe && previewBattle(companion, foe, stage.boss)
  return (
    <>
      <div className="run preview-scene">
        <WalkScene
          biome={biome}
          speciesId={companion.speciesId}
          moving={!battle && !stage.potion}
          speed={1}
          walkerClass={battle ? 'battling' : stage.potion ? 'healing' : ''}
          landmark={landmark ? { key: stopKey, id: landmark } : null}
          signText={signText}
        >
          {battle && <RouteBattle key={`${stopKey}-${index}`} record={battle.record} frame={battle.frame} trainer={trainerScene(stage, index)} />}
          {stage.potion && <HealStop key={stopKey} heal={{ potion: stage.potion, hp: 0, msLeft: HEAL_STOP_MS }} />}
        </WalkScene>
      </div>
      <FoePicker stage={stage} index={index} onPick={setPicked} />
    </>
  )
}
