// Del borrador al fichero de la incursión (`src/data/incursions/<nombre>.ts`), con el mismo formato que las que ya
// hay. Solo se importa lo que se usa.

import { kebab } from '../codegen'
import type { PassiveDraft } from '../draft'
import { INC_DICTS } from './incCatalog'
import type { FoeDraft, IncursionDraft, PrizeDraft, RoomDraft, SlotDraft } from './incDraft'

const str = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
const frac = (percent: number) => Number((percent / 100).toFixed(6))
const isNum = (n: number | null): n is number => n !== null && Number.isFinite(n)

/** `CuevaHelada` → `CUEVA_HELADA` (la constante exportada) */
export const constName = (key: string) => key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase() || 'NUEVA_INCURSION'
/** `CuevaHelada` → `cuevaHelada` (el nombre del fichero, sin `.ts`) */
export const fileName = (key: string) => (key ? key[0].toLowerCase() + key.slice(1) : 'nuevaIncursion')

const movesCode = (keys: string[]) => `[${keys.map((k) => `IMOVE.${k || '¿?'}.id`).join(', ')}]`
const passivesCode = (list: PassiveDraft[]) => `[${list.map((p) => `{ type: '${p.type}', level: ${p.level} }`).join(', ')}]`

function bossCode(f: FoeDraft) {
  const { enrage, areaEvery, phase } = f.boss
  const parts: string[] = []
  if (enrage.on) parts.push(`enrage: { fromTurn: ${enrage.fromTurn}, every: ${enrage.every}, atk: ${enrage.atk} }`)
  if (isNum(areaEvery)) parts.push(`areaEvery: ${areaEvery}`)
  if (phase.on) parts.push(`phase: { belowHp: ${frac(phase.belowHp)}, moveIds: ${movesCode(phase.moves)} }`)
  return `boss: { ${parts.join(', ')} }`
}

function foeCode(f: FoeDraft) {
  const extra: string[] = []
  if (isNum(f.hpMult)) extra.push(`hpMult: ${f.hpMult}`)
  if (f.passives.length) extra.push(`passives: ${passivesCode(f.passives)}`)
  if (f.isBoss) extra.push(bossCode(f))
  const opts = extra.length ? `, { ${extra.join(', ')} }` : ''
  return `foe(POKEMON.${f.species || '¿?'}, ${f.level}, ${movesCode(f.moves)}${opts})`
}

const PAD = '        '

function slotCode(s: SlotDraft) {
  if (s.options.length === 1) return foeCode(s.options[0].foe)
  const evenOdds = s.options.every((o) => o.weight === 1)
  const items = s.options.map((o) => `${PAD}  ${evenOdds ? foeCode(o.foe) : `[${foeCode(o.foe)}, ${o.weight}]`},`)
  return `${evenOdds ? 'oneOf' : 'weighted'}(\n${items.join('\n')}\n${PAD})`
}

function roomCode(r: RoomDraft) {
  const head = `kind: RoomKind.${r.kind}, name: ${str(r.name)}`
  if (r.kind === 'Heal') return `    { ${head}, heal: ${frac(r.percent)} },`
  if (r.kind === 'Revive') return `    { ${head}, hp: ${frac(r.percent)} },`
  if (r.kind !== 'Battle') return `    { ${head} },`
  return [
    '    {',
    `      kind: RoomKind.${r.kind},`,
    `      name: ${str(r.name)},`,
    '      foes: [',
    ...r.slots.map((s) => `${PAD}${slotCode(s)},`),
    '      ],',
    `      reward: { money: ${r.reward.money}, exp: ${r.reward.exp} },`,
    '    },',
  ].join('\n')
}

function prizeCode(p: PrizeDraft) {
  const what: Record<string, string> = {
    Pieces: `speciesId: POKEMON.${p.species || '¿?'}, `,
    StarItem: `item: StarItem.${p.item}, `,
    Tm: `tm: Tm.${p.tm}, `,
  }
  return `    { kind: IncursionPrizeKind.${p.kind}, ${what[p.kind] ?? ''}amount: ${p.amount}, chance: ${frac(p.chance)} },`
}

function body(d: IncursionDraft) {
  return [
    `export const ${constName(d.idKey)}: Incursion = {`,
    `  id: IncursionId.${d.idKey || '¿?'},`,
    `  name: ${str(d.name)},`,
    `  description: ${str(d.description)},`,
    ...(d.free ? ['  free: true,'] : []),
    `  biome: Biome.${d.biome},`,
    `  tier: IncursionTier.${d.tier},`,
    `  minLevel: ${d.minLevel},`,
    `  maxLevel: ${d.maxLevel},`,
    '  rooms: [',
    ...d.rooms.map(roomCode),
    '  ],',
    '  prizes: [',
    ...d.prizes.map(prizeCode),
    '  ],',
    `  bots: [${d.bots.map((b) => `POKEMON.${b || '¿?'}`).join(', ')}],`,
    '}',
  ].join('\n')
}

/** Imports de lo que aparece en el cuerpo, en el orden de los ficheros que ya hay */
function imports(code: string) {
  // Sin un punto delante: `IncursionPrizeKind.Tm` no usa `Tm`
  const uses = (name: string) => new RegExp(`(?<![\\w.])${name}\\b`).test(code)
  const fromTypes = ['foe', 'IncursionId', 'IncursionPrizeKind', 'IncursionTier', 'oneOf', 'RoomKind', 'weighted'].filter(uses)
  const lines = [
    "import { Biome } from '../maps/mapCommon'",
    uses('IMOVE') && "import { IMOVE } from '../incursionMoves'",
    uses('POKEMON') && "import { POKEMON } from '../pokemon'",
    `import { ${[...fromTypes, 'type Incursion'].join(', ')} } from './types'`,
    uses('StarItem') && "import { StarItem } from '../starItems'",
    uses('Tm') && "import { Tm } from '../tms'",
  ]
  return lines.filter(Boolean).join('\n')
}

/** El fichero entero de la incursión */
export function incursionCode(d: IncursionDraft): string {
  const code = body(d)
  const comment = d.comment.trim() ? `// ${d.comment.trim()}\n\n` : ''
  return `${imports(code)}\n\n${comment}${code}\n`
}

const isNew = (d: IncursionDraft) => !!d.idKey && !(d.idKey in INC_DICTS.IncursionId)

/** Lo que hay que añadir aparte si la incursión es nueva: su IncursionId y su sitio en la lista */
export function incursionExtra(d: IncursionDraft): string {
  if (!isNew(d)) return ''
  const name = constName(d.idKey)
  return [
    `// En IncursionId (src/data/incursions/types.ts):\n  ${d.idKey}: ${str(d.idValue || kebab(d.idKey))},`,
    `// En src/data/incursions/index.ts:\nimport { ${name} } from './${fileName(d.idKey)}'\n// …y añádela a INCURSIONS: [..., ${name}]`,
  ].join('\n\n')
}

export function incursionCodeHint(d: IncursionDraft) {
  const state = isNew(d) ? 'nuevo: se da de alta en IncursionId e INCURSIONS' : 'ya existe: se sustituye'
  return `Fichero: <code>src/data/incursions/${fileName(d.idKey)}.ts</code> (${state}). Cópialo o pulsa «Guardar en el juego».`
}
