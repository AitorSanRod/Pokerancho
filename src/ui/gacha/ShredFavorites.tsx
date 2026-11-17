import { useState } from 'react'
import { favoriteStock } from '../../game/collection/shredder'
import type { GameState } from '../../game/core/state'
import { FavoritePolicy } from '../../game/trade/tradeGive'
import { Foldout } from '../shared/Foldout'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { ShredCell } from './ShredCell'
import { ShredDialog } from './ShredDialog'

/** Sección aparte con los tickets de los favoritos: fuera de ella están protegidos; aquí se pueden triturar, con aviso */
export function ShredFavorites({ game, onShred }: { game: GameState; onShred: (tickets: number, shards: number) => void }) {
  const [picked, setPicked] = useState<number | null>(null)
  const stock = favoriteStock(game)
  if (stock.length === 0) return null
  return (
    <Foldout
      kicker="Trituradora"
      title="Favoritos"
      className="shred-favorites"
      art={<ItemIcon item={ICON.Shredder} size={110} className="foldout-art" />}
      defaultOpen={false}
    >
      <p className="small muted">Solo tus favoritos. Sus tickets no salen en el resto de la trituradora.</p>
      <div className="dex-grid">
        {stock.map(({ speciesId, count }) => (
          <ShredCell key={speciesId} game={game} speciesId={speciesId} count={count} onPick={() => setPicked(speciesId)} />
        ))}
      </div>
      {picked !== null && <ShredDialog game={game} speciesId={picked} policy={FavoritePolicy.Allow} onShred={onShred} onClose={() => setPicked(null)} />}
    </Foldout>
  )
}
