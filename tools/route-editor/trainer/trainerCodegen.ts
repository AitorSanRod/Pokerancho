// Código de un entrenador para TRAINERS de src/data/trainers.ts, con el formato del fichero: una línea por Pokémon.

import { esc } from '../fields'
import { str, teamCode } from '../team/teamCode'
import { isNewTrainer, trainerIdOf } from './trainerCatalog'
import type { TrainerDraft } from './trainerDraft'

export const trainerIdValue = (d: TrainerDraft) => trainerIdOf(d.idKey, d.idValue)

/** La entrada del entrenador dentro de TRAINERS (sangrado de 2 espacios, como en el fichero) */
export function trainerCode(d: TrainerDraft): string {
  return [
    `  [TrainerId.${d.idKey || '¿?'}]: {`,
    `    name: ${str(d.name)},`,
    `    look: TrainerLook.${d.look || '¿?'},`,
    ...teamCode(d.team),
    '  },',
  ].join('\n')
}

/** Lo que hay que añadir aparte: su TrainerId si es nuevo y la parada que lo pone en una ruta */
export function trainerExtra(d: TrainerDraft): string {
  const extra: string[] = []
  if (d.idKey && isNewTrainer(d.idKey)) extra.push(`// En TrainerId (src/data/trainers.ts):\n  ${d.idKey}: ${str(trainerIdValue(d))},`)
  extra.push(
    `// Y su parada en una ruta de kantoMaps.ts (modo Rutas, tipo Entrenador):\n{ id: '¿?', name: '¿?', kind: NodeKind.Trainer, steps: 30, trainer: TrainerId.${d.idKey || '¿?'} },`,
  )
  return extra.join('\n\n')
}

export const trainerCodeHint = (d: TrainerDraft): string =>
  isNewTrainer(d.idKey)
    ? 'Pégalo al final de <code>TRAINERS</code> en <code>src/data/trainers.ts</code> (o «Guardar en el juego», que también lo da de alta en <code>TrainerId</code>).'
    : `Sustituye la entrada <code>[TrainerId.${esc(d.idKey)}]</code> de <code>TRAINERS</code> en <code>src/data/trainers.ts</code> (o «Guardar en el juego»).`
