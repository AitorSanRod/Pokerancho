// Código de un entrenador para TRAINERS de src/data/trainers.ts, con el formato del fichero: una línea por Pokémon.
// Solo lleva nombre o género si son fijos; si no, se eligen al azar en cada ruta.

import { esc } from '../fields'
import { teamCode } from '../team/teamCode'
import { isNewTrainer } from './trainerCatalog'
import type { TrainerDraft } from './trainerDraft'

/** Su nombre fijo o, sin él, su género fijo (si se ha elegido) */
const whoLines = (d: TrainerDraft): string[] =>
  d.name ? [`    name: TrainerName.${d.name},`] : d.gender ? [`    gender: Gender.${d.gender},`] : []

/** La entrada del entrenador dentro de TRAINERS (sangrado de 2 espacios, como en el fichero) */
export function trainerCode(d: TrainerDraft): string {
  return [`  ${d.idKey || '¿?'}: {`, `    trainerClass: TrainerClass.${d.trainerClass || '¿?'},`, ...whoLines(d), ...teamCode(d.team), '  },'].join('\n')
}

/** Lo que hay que añadir aparte: la parada que lo pone en una ruta */
export const trainerExtra = (d: TrainerDraft): string =>
  `// Su parada en una ruta de kantoMaps.ts (modo Rutas, tipo Entrenador):\n{ id: '¿?', name: '¿?', kind: NodeKind.Trainer, steps: 30, trainer: TrainerId.${d.idKey || '¿?'} },`

export const trainerCodeHint = (d: TrainerDraft): string =>
  isNewTrainer(d.idKey)
    ? 'Pégalo al final de <code>TRAINERS</code> en <code>src/data/trainers.ts</code> (o «Guardar en el juego»): su clave ya es su <code>TrainerId</code>.'
    : `Sustituye la entrada <code>${esc(d.idKey)}</code> de <code>TRAINERS</code> en <code>src/data/trainers.ts</code> (o «Guardar en el juego»).`
