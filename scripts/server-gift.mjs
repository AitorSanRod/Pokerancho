/**
 * Pone un regalo del servidor (Notificaciones) sin escribir una migración: inserta la fila en `server_gifts` con
 * `wrangler d1 execute`. La app lo valida al leerlo (src/game/collection/serverGifts.ts › parseServerGifts).
 *
 *   npm run gift -- --id perdon-raids-1 --title "Perdón por las raids caídas" --goods '{"money":5000,"tickets":3}' --days 14
 *   npm run gift -- ... --nickname Apodo     # solo para ese jugador (por su apodo de la cuenta); sin él, para todos
 *   npm run gift -- ... --local              # en la base de datos local (npm run preview) en lugar de la de verdad
 *   npm run gift -- ... --dry                # solo enseña el SQL, sin ejecutarlo
 *
 * `goods` admite money, missingnoShards, tickets, starItems, incursionKeys y mons ({ speciesId, level, stars }).
 */
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const DATABASE = 'pokerancho'
const DAY_MS = 24 * 60 * 60 * 1000
/** Mismo formato que SERVER_GIFT_ID de serverGifts.ts */
const GIFT_ID = /^[a-z0-9-]{1,80}$/
/** Lo que entiende la app dentro de `goods` */
const GOODS_KEYS = ['money', 'missingnoShards', 'tickets', 'starItems', 'incursionKeys', 'mons']

const { values } = parseArgs({
  options: {
    id: { type: 'string' },
    title: { type: 'string' },
    goods: { type: 'string' },
    days: { type: 'string', default: '14' },
    nickname: { type: 'string' },
    local: { type: 'boolean', default: false },
    dry: { type: 'boolean', default: false },
  },
})

function fail(message) {
  console.error(`No se ha puesto el regalo: ${message}`)
  process.exit(1)
}

if (!values.id || !GIFT_ID.test(values.id)) fail('--id: minúsculas, cifras y guiones (como mucho 80)')
if (!values.title?.trim()) fail('--title: el texto que se ve en Notificaciones')
let goods
try {
  goods = JSON.parse(values.goods ?? '')
} catch {
  fail(`--goods no es JSON válido`)
}
const unknown = Object.keys(goods).filter((k) => !GOODS_KEYS.includes(k))
if (unknown.length) fail(`--goods con claves que la app no entiende: ${unknown.join(', ')}`)
const days = Number(values.days)
if (!(days > 0)) fail('--days: cuántos días se ofrece (más de 0)')

const quote = (text) => `'${String(text).replaceAll("'", "''")}'`
const row = `${quote(values.id)}, ${quote(values.title.trim())}, ${quote(JSON.stringify(goods))}, ${Date.now() + days * DAY_MS}`
const columns = 'INSERT INTO server_gifts (id, title, goods, expires_at, user_id)'
// Para un jugador, con SELECT: si el apodo no existe no se inserta nada (con una subconsulta saldría NULL, para todos)
const sql = values.nickname
  ? `${columns} SELECT ${row}, id FROM users WHERE nickname = ${quote(values.nickname)};`
  : `${columns} VALUES (${row}, NULL);`

if (values.dry) {
  console.log(sql)
  process.exit(0)
}
const where = values.local ? '--local' : '--remote'
// wrangler con el propio Node, sin pasar por la terminal: así el SQL llega tal cual (con sus comillas) también en Windows
const wrangler = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url))
execFileSync(process.execPath, [wrangler, 'd1', 'execute', DATABASE, where, '--command', sql], { stdio: 'inherit' })
console.log(`Regalo «${values.id}» ${values.nickname ? `para ${values.nickname} (si en lo de arriba sale changes: 0, ese apodo no existe)` : 'para todos'}, durante ${days} días.`)
