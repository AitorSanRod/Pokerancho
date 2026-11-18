import { useState } from 'react'
import { species } from '../../data/species'
import { piecesOf } from '../../game/collection/pieces'
import type { GameState, OwnedMon } from '../../game/core/state'
import { favoriteMons, monSalePrice, pieceSalePrice, sellMon, sellPieces } from '../../game/trade/serverSale'
import { FavoritePolicy } from '../../game/trade/tradeGive'
import { act } from '../../store/store'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { CountDialog } from '../shared/CountDialog'
import { formatMoney } from '../shared/format'
import { HeartIcon } from '../shared/HeartIcon'
import { ICON } from '../shared/icons'
import { ShopSection, ShopTile } from '../shop/ShopTile'
import { SellMonIcon } from './SellMonIcon'

const FavoriteWarning = () => (
  <p className="small notice">
    <HeartIcon size={16} /> Es uno de tus favoritos.
  </p>
)

/** Sección aparte con los Pokémon y tickets de los favoritos: fuera de ella están protegidos; aquí se venden, con aviso */
export function SellFavorites({ game }: { game: GameState }) {
  const [selling, setSelling] = useState<OwnedMon | null>(null)
  const [pieces, setPieces] = useState<number | null>(null)
  const mons = favoriteMons(game)
  const withPieces = game.favorites.filter((id) => piecesOf(game, id) > 0)
  if (mons.length === 0 && withPieces.length === 0) return null

  return (
    <ShopSection title="Favoritos" art={ICON.Sell} tone="shop-fold-sell-favorites" hint="Solo tus favoritos: fuera de aquí no se pueden vender.">
      {mons.map((m) => (
        <ShopTile
          key={m.uid}
          icon={<SellMonIcon speciesId={m.speciesId} favorite />}
          name={`${species(m.speciesId).name} Nv. ${m.level}`}
          action={
            <button className="btn primary small" onClick={() => setSelling(m)}>
              {formatMoney(monSalePrice(m.speciesId))}
            </button>
          }
        />
      ))}
      {withPieces.map((id) => (
        <ShopTile
          key={id}
          icon={<SellMonIcon speciesId={id} favorite />}
          name={`Tickets de ${species(id).name}`}
          action={
            <button className="btn primary small" onClick={() => setPieces(id)}>
              Vender
            </button>
          }
        >
          <span className="tiny">Tienes {piecesOf(game, id)}</span>
          <span className="tiny muted">{formatMoney(pieceSalePrice(id))} cada uno</span>
        </ShopTile>
      ))}
      {selling && (
        <ConfirmDialog
          title={`¿Vender a ${species(selling.speciesId).name}?`}
          confirmLabel={`Vender por ${formatMoney(monSalePrice(selling.speciesId))}`}
          onConfirm={() => (act((s) => sellMon(s, selling.uid, FavoritePolicy.Allow)), setSelling(null))}
          onCancel={() => setSelling(null)}
        >
          <FavoriteWarning />
          <p className="small">Se irá para siempre, con su nivel y sus ★. La especie sigue siendo favorita.</p>
        </ConfirmDialog>
      )}
      {pieces !== null && (
        <CountDialog
          title={`Vender tickets de ${species(pieces).name}`}
          max={piecesOf(game, pieces)}
          warning={<FavoriteWarning />}
          confirmLabel={(n) => `Vender por ${formatMoney(n * pieceSalePrice(pieces))}`}
          onConfirm={(n) => act((s) => sellPieces(s, pieces, n, FavoritePolicy.Allow))}
          onClose={() => setPieces(null)}
        />
      )}
    </ShopSection>
  )
}
