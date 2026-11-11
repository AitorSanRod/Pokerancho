import { SPECIES } from '../../data/species'
import { plainText } from '../../game/collection/dexQuery'

/** Especies cuyo nombre contiene el texto (sin mayúsculas ni tildes); vacío si no se ha escrito nada */
export function matchingSpecies(text: string): number[] {
  const query = plainText(text)
  return query ? SPECIES.filter((sp) => plainText(sp.name).includes(query)).map((sp) => sp.id) : []
}
