import { PASSIVE_THRESHOLDS } from '../../../data/passives'
import { species } from '../../../data/species'
import { passiveWeightOf } from '../../../game/team/ranchPassives'
import './hero-buttons.css'

/** Círculo de la esquina inferior derecha de la cabecera: cuánto suma a su tipo para las pasivas */
export function PassiveWeightBadge({ speciesId }: { speciesId: number }) {
  const weight = passiveWeightOf(speciesId)
  const maxed = weight >= PASSIVE_THRESHOLDS[PASSIVE_THRESHOLDS.length - 1]
  const types = species(speciesId).types.length > 1 ? 'sus tipos' : 'su tipo'
  const hint = maxed ? `Sube él solo al máximo las pasivas de ${types}` : `Cuenta como ${weight} de ${types} para las pasivas`
  return (
    <span className={`passive-weight-badge${maxed ? ' maxed' : ''}`} aria-label={hint} title={hint}>
      {maxed ? 'MÁX' : `×${weight}`}
    </span>
  )
}
