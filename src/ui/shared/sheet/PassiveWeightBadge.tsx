import { species } from '../../../data/species'
import { maxesPassives, passiveWeightOf } from '../../../game/team/ranchPassives'

/** Círculo de la esquina inferior derecha de la cabecera: cuántos Pokémon de su tipo cuenta para las pasivas del rancho */
export function PassiveWeightBadge({ speciesId }: { speciesId: number }) {
  const maxed = maxesPassives(speciesId)
  const weight = passiveWeightOf(speciesId)
  const types = species(speciesId).types.length > 1 ? 'sus tipos' : 'su tipo'
  const hint = maxed ? `Sube al máximo las pasivas de ${types} en el rancho` : `Cuenta como ${weight} de ${types} para las pasivas del rancho`
  return (
    <span className={`passive-weight-badge${maxed ? ' maxed' : ''}`} aria-label={hint} title={hint}>
      {maxed ? 'MÁX' : `×${weight}`}
    </span>
  )
}
