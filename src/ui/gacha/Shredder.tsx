import { useState } from 'react'
import { RARITY_INFO, rarityOf, species, type Rarity } from '../../data/species'
import { raritySelection, selectionShards, SHARDS_PER_PIECE, shreddableStock, shredSelection } from '../../game/collection/shredder'
import type { GameState } from '../../game/core/state'
import { act } from '../../store/store'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { HeartIcon } from '../shared/HeartIcon'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { RarityFoldout } from './RarityFoldout'
import { RARITIES, RARITY_TITLE } from './rarityTitles'
import { ShardBalance } from './ShardBalance'
import { ShredCell } from './ShredCell'
import { ShredDialog } from './ShredDialog'
import { ShredFavorites } from './ShredFavorites'

const ticketsText = (n: number) => `${n} ${n === 1 ? 'ticket' : 'tickets'}`

/** Tickets de Pokémon por rareza: se toca un Pokémon y se escribe cuántos triturar, o se trituran todos los de una rareza */
export function Shredder({ game }: { game: GameState }) {
  const [picked, setPicked] = useState<number | null>(null)
  const [wholeRarity, setWholeRarity] = useState<Rarity | null>(null)
  const [message, setMessage] = useState('')
  const stock = shreddableStock(game)
  const rarityOfStock = (speciesId: number) => rarityOf(species(speciesId))
  // Se abre el desplegable de la rareza más común que tenga tickets
  const firstRarity = RARITIES.find((r) => stock.some(({ speciesId }) => rarityOfStock(speciesId) === r))
  const report = (tickets: number, shards: number) => setMessage(`Triturados ${ticketsText(tickets)}: +${shards} trozos de MissingNo`)

  const shredRarity = (rarity: Rarity) => {
    const selection = raritySelection(game, rarity)
    const tickets = Object.values(selection).reduce((a, b) => a + b, 0)
    report(tickets, act((s) => shredSelection(s, selection)))
    setWholeRarity(null)
  }

  return (
    <>
      <ShardBalance game={game} />
      <p className="small muted">Toca un Pokémon y elige cuántos de sus tickets triturar. Los trozos se gastan en la pestaña MissingNo.</p>
      {game.favorites.length > 0 && (
        <p className="small muted">
          <HeartIcon size={16} /> Los tickets de tus favoritos están protegidos: solo se trituran desde su sección, al final.
        </p>
      )}
      {message && <p className="highlight small">{message}</p>}
      {stock.length === 0 && <p className="card small muted">No tienes tickets de Pokémon para triturar. Consíguelos en el gacha.</p>}
      {RARITIES.map((rarity) => {
        const rows = stock.filter(({ speciesId }) => rarityOfStock(speciesId) === rarity)
        if (rows.length === 0) return null
        const tickets = rows.reduce((sum, r) => sum + r.count, 0)
        return (
          <RarityFoldout
            key={rarity}
            kicker="Trituradora"
            rarity={rarity}
            art={ICON.Shredder}
            aside={
              <span className="with-icon">
                <ItemIcon item={ICON.Shard} size={16} /> {SHARDS_PER_PIECE[rarity]} por ticket
              </span>
            }
            defaultOpen={rarity === firstRarity}
          >
            <div className="dex-grid">
              {rows.map(({ speciesId, count }) => (
                <ShredCell key={speciesId} game={game} speciesId={speciesId} count={count} onPick={() => setPicked(speciesId)} />
              ))}
            </div>
            <button className="btn shred-all" style={{ ['--rarity' as string]: RARITY_INFO[rarity].color }} onClick={() => setWholeRarity(rarity)}>
              Triturar los {ticketsText(tickets)}
            </button>
          </RarityFoldout>
        )
      })}
      <ShredFavorites game={game} onShred={report} />
      {picked !== null && <ShredDialog game={game} speciesId={picked} onShred={report} onClose={() => setPicked(null)} />}
      {wholeRarity && (
        <ConfirmDialog
          title={`¿Triturar todos los tickets ${RARITY_TITLE[wholeRarity].toLowerCase()}?`}
          confirmLabel={`Triturar por ${selectionShards(raritySelection(game, wholeRarity))} trozos`}
          onConfirm={() => shredRarity(wholeRarity)}
          onCancel={() => setWholeRarity(null)}
        >
          <p className="small">Se trituran todos los tickets de esta rareza (no los de tus favoritos).</p>
        </ConfirmDialog>
      )}
    </>
  )
}
