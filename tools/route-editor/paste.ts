// Pegar el objeto de una ruta (tal cual está en kantoMaps.ts) y cargarlo en el formulario. Lo que no existe en los
// diccionarios (un RouteId nuevo, un Pokémon mal escrito) se carga con su nombre para que salga en los avisos, y las
// constantes de imagen se convierten en su fichero.

import { boss, chain, enc, raidBoss, type Route } from '../../src/data/maps'
import { DICTS, KANTO } from './catalog'
import { backdropVar } from './codegen'
import { fromRoute, type RouteDraft } from './draft'
import { evaluate, leadingComment, lenient } from './evalCode'

const imageFile = (url: string) => url.split('?')[0].split('/').pop() ?? ''

/** Fichero de la constante de imagen: el de una ruta del juego que la use o, si no, `routeX` → `route-x.webp` */
function fileOfVar(name: string): string {
  const known = KANTO.routes.map((r) => r.backdrop && imageFile(r.backdrop.image)).find((f) => f && backdropVar(f) === name)
  return known || `${name.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase()}.webp`
}

const HELPERS: Record<string, unknown> = {
  enc,
  boss,
  raidBoss,
  chain,
  ...Object.fromEntries(Object.entries(DICTS).map(([name, dict]) => [name, lenient(dict)])),
}

/** Imagen sin resolver: se apunta el nombre de la constante y luego se cambia por su fichero */
const IMAGE_MARK = 'image-var:'

/** Borrador a partir del código pegado; lanza un error con un texto legible si no se entiende */
export function parsePasted(text: string): RouteDraft {
  const r = evaluate<Route>(text, HELPERS, (name) => `${IMAGE_MARK}${name}`)
  if (!r || typeof r !== 'object' || !Array.isArray(r.nodes)) throw new Error('No parece una ruta: falta `nodes: chain(…)`')
  const image = r.backdrop?.image
  const draft = fromRoute({ ...r, encounters: r.encounters ?? [], backdrop: r.backdrop && { ...r.backdrop, image: '' } })
  if (typeof image === 'string' && image.startsWith(IMAGE_MARK)) draft.backdropFile = fileOfVar(image.slice(IMAGE_MARK.length))
  draft.comment = leadingComment(text)
  return draft
}
