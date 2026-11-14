// Código de un gimnasio para GYMS de src/data/gyms.ts, con el formato del fichero: una línea por Pokémon del líder.

import { kebab } from '../codegen'
import { esc } from '../fields'
import { str, teamCode } from '../team/teamCode'
import { isNewGym, leaderSprite } from './gymCatalog'
import type { GymDraft } from './gymDraft'

export const gymIdValue = (d: GymDraft) => d.idValue || kebab(d.idKey)

/** La entrada del gimnasio dentro de GYMS (sangrado de 2 espacios, como en el fichero) */
export function gymCode(d: GymDraft): string {
  return [
    `  [GymId.${d.idKey || '¿?'}]: {`,
    `    leader: ${str(d.leader)},`,
    `    badge: Badge.${d.badge || '¿?'},`,
    `    maxLevel: ${d.maxLevel},`,
    ...teamCode(d.team),
    '  },',
  ].join('\n')
}

/** Lo que hay que añadir aparte: su GymId si es nuevo y el GIF del líder si no lo tiene */
export function gymExtra(d: GymDraft): string {
  const extra: string[] = []
  if (d.idKey && isNewGym(d.idKey)) extra.push(`// En GymId (src/data/gyms.ts):\n  ${d.idKey}: ${str(gymIdValue(d))},`)
  if (d.idKey && !leaderSprite(gymIdValue(d))) {
    extra.push(
      `// El GIF del líder: guárdalo en src/assets/gyms/ y, en src/ui/route/gym/leaderSprites.ts:\nimport ${gymIdValue(d).replace(/-/g, '')} from '../../../assets/gyms/${gymIdValue(d)}.gif'\n  [GymId.${d.idKey}]: ${gymIdValue(d).replace(/-/g, '')},`,
    )
  }
  extra.push(`// Y su ruta en kantoMaps.ts (modo Rutas), con una parada de tipo Gimnasio y gym: GymId.${d.idKey || '¿?'}`)
  return extra.join('\n\n')
}

export const gymCodeHint = (d: GymDraft): string =>
  isNewGym(d.idKey)
    ? 'Pégalo al final de <code>GYMS</code> en <code>src/data/gyms.ts</code> (o «Guardar en el juego», que también lo da de alta en <code>GymId</code>).'
    : `Sustituye la entrada <code>[GymId.${esc(d.idKey)}]</code> de <code>GYMS</code> en <code>src/data/gyms.ts</code> (o «Guardar en el juego»).`
