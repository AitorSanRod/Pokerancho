import { useState } from 'react'
import { baseSpeciesOf } from '../../../data/species'
import { isSeen, knownName } from '../../../game/collection/dex'
import { ownedOfSpecies, type GameState } from '../../../game/core/state'
import type { EvolveResult } from '../../../game/team/evolution'
import { trainPlan } from '../../../game/team/ranch'
import { CareSection } from './CareSection'
import { CompanionButton } from './CompanionButton'
import { EvolvePanel } from './EvolvePanel'
import { EvolveResultAnimation } from './EvolveResultAnimation'
import { FavoriteButton } from './FavoriteButton'
import { FormPanel } from './FormPanel'
import { HealButton } from './HealButton'
import { MintPanel } from './MintPanel'
import { MonHero } from './MonHero'
import { MonOverview } from './MonOverview'
import { MonSheet } from './MonSheet'
import { MovePanel } from './MovePanel'
import { RanchSlotsBadge } from './RanchSlotsBadge'
import { SpeciesHero } from './SpeciesHero'
import { TicketsSection } from './TicketsSection'
import { TmPanel } from './TmPanel'

/**
 * Ficha de un Pokémon a pantalla completa: la misma desde el rancho y desde la Pokédex. Si lo tienes, todas sus
 * secciones; si no, lo que se sabe de la especie y sus tickets. Al evolucionar se cierra tras la animación. Con una forma
 * (Rotom Calor) es la ficha de su especie: Pokédex, favorito y tickets son de Rotom; el Pokémon se ve con su forma.
 */
export function PokemonSheet({ game, speciesId: shownId, onClose }: { game: GameState; speciesId: number; onClose: () => void }) {
  const speciesId = baseSpeciesOf(shownId)
  // Sesiones de entrenamiento elegidas sin aceptar: se ven en el arco de EXP antes de pagarlas
  const [sessions, setSessions] = useState(0)
  const [evolution, setEvolution] = useState<EvolveResult | null>(null)
  const mon = ownedOfSpecies(game, speciesId)
  const plan = mon && sessions > 0 ? trainPlan(mon, sessions) : null

  if (evolution) return <EvolveResultAnimation result={evolution} onClose={onClose} />

  const hero = mon ? (
    <MonHero mon={mon} preview={plan} />
  ) : (
    <SpeciesHero speciesId={speciesId} seen={isSeen(game, speciesId)} />
  )
  return (
    <MonSheet label={knownName(game, speciesId)} hero={hero} corners={{
        topLeft: mon && <CompanionButton game={game} mon={mon} />,
        topRight: <FavoriteButton game={game} speciesId={speciesId} />,
        bottomLeft: mon && <HealButton game={game} mon={mon} />,
        bottomRight: isSeen(game, speciesId) && <RanchSlotsBadge speciesId={speciesId} />,
      }}
      onClose={onClose}>
      <MonOverview game={game} speciesId={speciesId} mon={mon} previewLevel={plan && plan.levelsGained > 0 ? plan.level : null} />
      {mon && <CareSection game={game} mon={mon} sessions={sessions} onSessionsChange={setSessions} />}
      <TicketsSection game={game} speciesId={speciesId} />
      {mon && <EvolvePanel game={game} mon={mon} onEvolved={setEvolution} />}
      {mon && <FormPanel game={game} mon={mon} />}
      {mon && <TmPanel game={game} mon={mon} />}
      {mon && <MintPanel game={game} mon={mon} />}
      {mon && <MovePanel game={game} mon={mon} />}
    </MonSheet>
  )
}
