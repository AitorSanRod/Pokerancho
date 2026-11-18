import { knownName } from '../../game/collection/dex'
import { piecesOf } from '../../game/collection/pieces'
import { shardsPerPiece, shred } from '../../game/collection/shredder'
import type { GameState } from '../../game/core/state'
import { FavoritePolicy } from '../../game/trade/tradeGive'
import { act } from '../../store/store'
import { CountDialog } from '../shared/CountDialog'
import { HeartIcon } from '../shared/HeartIcon'

/** Cuántos tickets de una especie triturar; los de un favorito (desde su sección) avisan antes */
export function ShredDialog({
  game,
  speciesId,
  policy = FavoritePolicy.Protect,
  onShred,
  onClose,
}: {
  game: GameState
  speciesId: number
  policy?: FavoritePolicy
  onShred: (tickets: number, shards: number) => void
  onClose: () => void
}) {
  const perTicket = shardsPerPiece(speciesId)
  return (
    <CountDialog
      title={`Triturar tickets de ${knownName(game, speciesId)}`}
      max={piecesOf(game, speciesId)}
      confirmLabel={(n) => `Triturar por ${n * perTicket} ${n * perTicket === 1 ? 'trozo' : 'trozos'}`}
      warning={
        policy === FavoritePolicy.Allow && (
          <p className="small notice">
            <HeartIcon size={16} /> Es uno de tus favoritos.
          </p>
        )
      }
      onConfirm={(n) => onShred(n, act((s) => shred(s, speciesId, n, policy)))}
      onClose={onClose}
    />
  )
}
