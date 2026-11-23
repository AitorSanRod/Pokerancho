import { useState } from 'react'
import { dexSections } from '../../data/pokedexes'
import { species, SPECIES } from '../../data/species'
import { applyDexQuery, DEFAULT_DEX_QUERY, DexFilter, DexSort, isDexQueryActive, ownedLevel } from '../../game/collection/dexQuery'
import { combinableCount } from '../../game/collection/pieces'
import { TutorialStep, type GameState } from '../../game/core/state'
import { tutorialStarter } from '../../game/team/tutorial'
import { TutorialHint } from '../shared/TutorialHint'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { DexCell } from './DexCell'
import { DexPerks } from './DexPerks'
import { DexSection } from './DexSection'
import { DexToolbar } from './DexToolbar'
import './dex.css'

const SECTIONS = dexSections()

interface DexScreenProps {
  game: GameState
  /** Especie con la ficha abierta (la pinta Gacha, fuera de las pestañas, para cubrir toda la zona de contenido) */
  selectedId: number | null
  onSelect: (speciesId: number) => void
}

/** Pestaña Pokédex (su primera subpestaña): las Pokédex regionales y la Nacional, con buscador, filtros y las mejoras por tipo */
export function DexScreen({ game, selectedId, onSelect }: DexScreenProps) {
  const [query, setQuery] = useState(DEFAULT_DEX_QUERY)
  const ready = combinableCount(game)
  const filtering = isDexQueryActive(query)
  const starter = game.tutorial === TutorialStep.Combine ? tutorialStarter(game) : undefined
  const target = starter !== undefined && selectedId !== starter ? starter : undefined
  const sections = SECTIONS.map((section) => ({ section, shown: applyDexQuery(game, section.species, query) }))
  const nothingFound = filtering && sections.every(({ shown }) => shown.length === 0)

  return (
    <div className="screen scroll">
        <div className="row between">
          <h2 className="section-title">Pokédex</h2>
          <span className="small">
            Capturados <strong>{game.caught.length}</strong>/{SPECIES.length} · Vistos {game.seen.length}
          </span>
        </div>
        <DexToolbar query={query} onChange={setQuery} />
        {!filtering && <DexPerks game={game} />}
        {ready > 0 && query.filter !== DexFilter.Ready && (
          <button className="notice small dex-filter" onClick={() => setQuery({ ...DEFAULT_DEX_QUERY, filter: DexFilter.Ready })}>
            <ItemIcon item={ICON.Piece} size={18} />
            <span className="grow">
              {ready} {ready === 1 ? 'Pokémon listo' : 'Pokémon listos'} para combinar. Toca aquí para verlos.
            </span>
          </button>
        )}
        {target !== undefined && (
          <TutorialHint>Toca a {species(target).name} (la casilla que parpadea) para ver sus tickets.</TutorialHint>
        )}
        {nothingFound && <p className="muted small dex-no-results">Ningún Pokémon coincide con la búsqueda.</p>}
        {sections.map(({ section, shown }, i) => {
          if (filtering && shown.length === 0) return null
          return (
            <DexSection
              key={section.dex?.id ?? 'national'}
              section={section}
              caught={section.species.filter((sp) => game.caught.includes(sp.id)).length}
              total={section.species.length}
              defaultOpen={i === 0}
              forceOpen={filtering || shown.some((sp) => sp.id === target)}
            >
              {shown.length === 0 ? (
                <p className="muted small dex-section-empty">Aún no hay Pokémon en esta Pokédex.</p>
              ) : (
                <div className="dex-grid">
                  {shown.map((sp) => (
                    <DexCell
                      key={sp.id}
                      game={game}
                      sp={sp}
                      selected={selectedId === sp.id}
                      tutorialTarget={sp.id === target}
                      onSelect={() => onSelect(sp.id)}
                      footer={query.sort === DexSort.Level && <span className="tiny dex-level">Nv. {ownedLevel(game, sp.id)}</span>}
                    />
                  ))}
                </div>
              )}
            </DexSection>
          )
        })}
    </div>
  )
}
