// Pegar el objeto de una ruta (tal cual está en kantoMaps.ts) y cargarlo en el formulario. El texto se evalúa con los
// mismos ayudantes y diccionarios del mapa; lo que no existe en ellos (un RouteId nuevo, un Pokémon mal escrito) se
// carga con su nombre para que salga en los avisos, y las constantes de imagen se convierten en su fichero.

import { boss, chain, enc, raidBoss, type Route } from '../../src/data/maps'
import { DICTS, KANTO, missing } from './catalog'
import { backdropVar } from './codegen'
import { fromRoute, type RouteDraft } from './draft'

const imageFile = (url: string) => url.split('?')[0].split('/').pop() ?? ''

/** Fichero de la constante de imagen: el de una ruta del juego que la use o, si no, `routeX` → `route-x.webp` */
function fileOfVar(name: string): string {
  const known = KANTO.routes.map((r) => r.backdrop && imageFile(r.backdrop.image)).find((f) => f && backdropVar(f) === name)
  return known || `${name.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase()}.webp`
}

/** Diccionario que, para una clave que no tiene, devuelve la clave marcada como desconocida */
const lenient = (dict: Record<string, unknown>) => new Proxy(dict, { get: (d, k) => (typeof k === 'string' && !(k in d) ? missing(k) : d[k as string]) })

const HELPERS: Record<string, unknown> = {
  enc,
  boss,
  raidBoss,
  chain,
  ...Object.fromEntries(Object.entries(DICTS).map(([name, dict]) => [name, lenient(dict)])),
}

/** Imagen sin resolver: se apunta el nombre de la constante y luego se cambia por su fichero */
const IMAGE_MARK = 'image-var:'

/**
 * Evalúa el texto como un objeto. El ámbito responde a cualquier nombre: los ayudantes y diccionarios del mapa, o una
 * marca con el nombre (las constantes de imagen). No es un entorno aislado: es para pegar código propio
 */
function evaluate(text: string): Route {
  const body = text.trim().replace(/,\s*$/, '')
  const scope = new Proxy({} as Record<PropertyKey, unknown>, {
    has: (_, k) => typeof k === 'string',
    get: (_, k) => (typeof k === 'string' ? (k in HELPERS ? HELPERS[k] : `${IMAGE_MARK}${k}`) : undefined),
  })
  return new Function('scope', `with (scope) { return (${body}) }`)(scope) as Route
}

/** Borrador a partir del código pegado; lanza un error con un texto legible si no se entiende */
export function parsePasted(text: string): RouteDraft {
  let r: Route
  try {
    r = evaluate(text)
  } catch (e) {
    throw new Error(`No se puede leer el código: ${(e as Error).message}`)
  }
  if (!r || typeof r !== 'object' || !Array.isArray(r.nodes)) throw new Error('No parece una ruta: falta `nodes: chain(…)`')
  const image = r.backdrop?.image
  const draft = fromRoute({ ...r, encounters: r.encounters ?? [], backdrop: r.backdrop && { ...r.backdrop, image: '' } })
  if (typeof image === 'string' && image.startsWith(IMAGE_MARK)) draft.backdropFile = fileOfVar(image.slice(IMAGE_MARK.length))
  const comment = /^\s*\{\s*\/\/\s*(.+)$/m.exec(text)
  if (comment) draft.comment = comment[1].trim()
  return draft
}

/** Diálogo de pegar: al cargar bien llama a `onLoad`; si no, enseña el error */
export function setupPaste(onLoad: (d: RouteDraft) => void) {
  const dialog = document.getElementById('paste-dialog') as HTMLDialogElement
  const input = document.getElementById('paste-text') as HTMLTextAreaElement
  const error = document.getElementById('paste-error') as HTMLParagraphElement
  document.getElementById('paste')!.addEventListener('click', () => {
    error.textContent = ''
    dialog.showModal()
    input.focus()
  })
  document.getElementById('paste-cancel')!.addEventListener('click', () => dialog.close())
  document.getElementById('paste-load')!.addEventListener('click', () => {
    try {
      onLoad(parsePasted(input.value))
      dialog.close()
    } catch (e) {
      error.textContent = (e as Error).message
    }
  })
}
