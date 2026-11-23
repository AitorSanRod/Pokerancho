import { useState } from 'react'
import { combinableIds } from '../../game/collection/pieces'
import type { GameState } from '../../game/core/state'
import { DexScreen } from '../dex/DexScreen'
import { IconTabs } from '../shared/IconTabs'
import { ICON } from '../shared/icons'
import { PokemonSheet } from '../shared/sheet/PokemonSheet'
import { pendingKey, useUnseen } from '../shared/useUnseen'
import { GachaMachine } from './GachaMachine'
import { MissingnoShop } from './MissingnoShop'
import { Shredder } from './Shredder'
import './gacha.css'

type GachaTab = 'pull' | 'shredder' | 'shop' | 'dex'

/**
 * Pestaña Pokédex del menú inferior: se abre en la Pokédex, donde se crean los Pokémon con sus tickets, y al lado el
 * gacha para conseguirlos: tirar, triturar tickets y crearlos con trozos de MissingNo (desde la ficha del Pokémon)
 */
export function GachaScreen({ game }: { game: GameState }) {
  const [tab, setTab] = useState<GachaTab>('dex')
  const [sheetId, setSheetId] = useState<number | null>(null)
  const ready = combinableIds(game)
  const readyUnseen = useUnseen('tab:dex', pendingKey(ready), tab === 'dex')

  return (
    <>
      <div className="screen tabbed">
        <IconTabs
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'dex', icon: ICON.Dex, label: 'Pokédex', count: readyUnseen ? ready.length : 0 },
            { id: 'pull', icon: ICON.Gacha, label: 'Tirar' },
            { id: 'shredder', icon: ICON.Shredder, label: 'Trituradora' },
            { id: 'shop', icon: ICON.Shard, label: 'MissingNo' },
          ]}
        />
        <div className="tabbed-body">
          {tab === 'dex' ? (
            <DexScreen game={game} selectedId={sheetId} onSelect={setSheetId} />
          ) : (
            <div className="screen scroll">
              {tab === 'pull' && <GachaMachine game={game} />}
              {tab === 'shredder' && <Shredder game={game} />}
              {tab === 'shop' && <MissingnoShop game={game} onOpen={setSheetId} />}
            </div>
          )}
        </div>
      </div>
      {/* Fuera de las pestañas, para cubrir toda la zona de contenido */}
      {sheetId !== null && <PokemonSheet key={sheetId} game={game} speciesId={sheetId} onClose={() => setSheetId(null)} />}
    </>
  )
}
