// Del borrador al código de `kantoMaps.ts`, con el mismo formato que las rutas que ya hay. Cada parada solo lleva los
// campos de su tipo: lo que no le corresponde no se escribe.

import { DICTS } from './catalog'
import type { BossDraft, EncDraft, NodeDraft, RouteDraft } from './draft'

const str = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
const isNum = (n: number | null): n is number => n !== null && Number.isFinite(n)

const encCode = (list: EncDraft[]) => `enc(${list.map((e) => `[POKEMON.${e.species || '¿?'}, ${e.chance}]`).join(', ')})`

/** `pallet-town.webp` → `palletTown` (como las constantes de imagen de kantoMaps.ts) */
export const backdropVar = (file: string) =>
  file.replace(/\.[a-z]+$/i, '').replace(/[^a-z0-9]+([a-z0-9])/gi, (_, c: string) => c.toUpperCase()) || 'imagen'

/** `Ruta4` → `ruta-4`, para el valor de un RouteId nuevo */
export const kebab = (key: string) => key.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase()

function passivesCode(b: BossDraft) {
  return b.passives.length ? `, [${b.passives.map((p) => `{ type: '${p.type}', level: ${p.level} }`).join(', ')}]` : ''
}

function bossCode(n: NodeDraft) {
  const b = n.boss
  const species = `POKEMON.${b.species || '¿?'}`
  if (n.kind === 'Raid') {
    const opts = isNum(b.soloMinutes) ? `, { soloMinutes: ${b.soloMinutes} }` : ''
    return `boss: raidBoss(${species}, ${b.level}, RaidTier.${b.tier}${opts})`
  }
  return `boss: boss(${species}, ${b.level}${passivesCode(b)})`
}

/** Campos de la parada según su tipo, en el orden en que se escriben en el mapa */
function nodeFields(n: NodeDraft): string[] {
  const fields = [`id: ${str(n.id)}`, `name: ${str(n.name)}`, `kind: NodeKind.${n.kind}`, `steps: ${n.steps}`]
  if (n.landmark) fields.push(`landmark: StopLandmark.${n.landmark}`)
  if (n.kind === 'Wild' && isNum(n.levelBonus) && n.levelBonus !== 0) fields.push(`levelBonus: ${n.levelBonus}`)
  if ((n.kind === 'Wild' || n.kind === 'Boss') && isNum(n.statMult)) fields.push(`statMult: ${n.statMult}`)
  if (n.kind === 'Wild' && n.ownEncounters) fields.push(`encounters: ${encCode(n.encounters)}`)
  if (n.kind === 'Boss' || n.kind === 'Raid') fields.push(bossCode(n))
  if (n.kind === 'Heal') fields.push(`potion: Potion.${n.potion}`)
  if (n.kind === 'Gym') fields.push(`gym: GymId.${n.gym}`)
  return fields
}

/** El objeto de la ruta, listo para pegar en `routes` de kantoMaps.ts (sangrado de 4 espacios) */
export function routeCode(d: RouteDraft): string {
  const lines = ['    {']
  if (d.comment.trim()) lines.push(`      // ${d.comment.trim()}`)
  lines.push(
    `      id: RouteId.${d.idKey || '¿?'},`,
    `      name: ${str(d.name)},`,
    `      description: ${str(d.description)},`,
    `      biome: Biome.${d.biome},`,
  )
  if (d.useBackdrop) lines.push(`      backdrop: { image: ${backdropVar(d.backdropFile)}, focusY: ${d.focusY} },`)
  lines.push(
    `      levels: [${d.levels[0]}, ${d.levels[1]}],`,
    `      encounters: ${encCode(d.encounters)},`,
    `      reward: { tickets: ${d.reward.tickets}, money: ${d.reward.money}, exp: ${d.reward.exp} },`,
  )
  if (d.unlocks) lines.push(`      unlocks: RouteId.${d.unlocks},`)
  lines.push('      nodes: chain(', ...d.nodes.map((n) => `        { ${nodeFields(n).join(', ')} },`), '      ),', '    },')
  return lines.join('\n')
}

/** Lo que hay que añadir aparte, si la ruta lo necesita: su RouteId nuevo y la constante de su imagen */
export function extraCode(d: RouteDraft): string {
  const extra: string[] = []
  if (d.idKey && !(d.idKey in DICTS.RouteId)) {
    extra.push(`// En RouteId (src/data/maps/mapCommon.ts):\n  ${d.idKey}: ${str(d.idValue || kebab(d.idKey))},`)
  }
  if (d.useBackdrop && d.backdropFile) {
    const file = d.backdropFile
    extra.push(`// Arriba de kantoMaps.ts (si aún no está):\nconst ${backdropVar(file)} = asset(new URL('../../assets/routes/${file}', import.meta.url))`)
  }
  return extra.join('\n\n')
}
