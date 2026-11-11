// Cambios de texto para dar de alta una incursión nueva desde el editor: su IncursionId en types.ts y su sitio en la
// lista de index.ts. Funciones puras (texto → texto); lanzan un error legible si el fichero no tiene la forma esperada.

/** Lo que manda el editor al guardar una incursión */
export interface IncursionWrite {
  /** Clave de IncursionId: `CuevaHelada` */
  idKey: string
  /** Valor del IncursionId (solo se usa si es nueva): `cueva-helada` */
  idValue: string
  /** Constante exportada: `CUEVA_HELADA` */
  constName: string
  /** Fichero sin `.ts`: `cuevaHelada` */
  fileName: string
  code: string
}

const FORMATS: [keyof IncursionWrite, RegExp][] = [
  ['idKey', /^[A-Z][A-Za-z0-9]*$/],
  ['idValue', /^[a-z0-9]+(-[a-z0-9]+)*$/],
  ['constName', /^[A-Z][A-Z0-9_]*$/],
  ['fileName', /^[a-z][A-Za-z0-9]*$/],
]

/** La petición, comprobada: nada de rutas raras en el nombre del fichero ni ids mal formados */
export function parseWrite(body: unknown): IncursionWrite {
  const w = (body ?? {}) as Record<string, unknown>
  for (const [field, format] of FORMATS) {
    if (typeof w[field] !== 'string' || !format.test(w[field])) throw new Error(`«${field}» no es válido`)
  }
  if (typeof w.code !== 'string' || !w.code.trim()) throw new Error('Falta el código')
  return w as unknown as IncursionWrite
}

const ID_DICT = /(export const IncursionId = \{)([^}]*)(\} as const)/
const LIST = /(INCURSIONS: Incursion\[\] = \[)([^\]]*)(\])/

/** El contenido de un objeto o lista de una línea, con un elemento más al final */
const append = (content: string, item: string) => {
  const items = content.trim().replace(/,$/, '')
  return items ? ` ${items}, ${item} ` : ` ${item} `
}

/** ¿Está ya esa clave en IncursionId? */
export function hasIncursionId(types: string, key: string): boolean {
  const dict = ID_DICT.exec(types)
  if (!dict) throw new Error('No se encuentra `IncursionId` en types.ts')
  return new RegExp(`(^|[\\s{,])${key}:`).test(dict[2])
}

/** types.ts con la clave nueva en IncursionId */
export function addIncursionId(types: string, key: string, value: string): string {
  const dict = ID_DICT.exec(types)
  if (!dict) throw new Error('No se encuentra `IncursionId` en types.ts')
  if (dict[2].includes(`'${value}'`)) throw new Error(`Ya hay una incursión con el valor «${value}»`)
  return types.replace(ID_DICT, (_, open: string, content: string, close: string) => `${open}${append(content, `${key}: '${value}'`)}${close}`)
}

/** index.ts con el import de la incursión y ella al final de INCURSIONS */
export function addToIncursionList(index: string, constName: string, fileName: string): string {
  if (!LIST.test(index)) throw new Error('No se encuentra `INCURSIONS` en index.ts')
  const imports = [...index.matchAll(/^import \{ \w+ \} from '\.\/\w+'\r?$/gm)]
  const last = imports.at(-1)
  if (!last) throw new Error('No se encuentran los imports de las incursiones en index.ts')
  const at = last.index + last[0].replace(/\r$/, '').length
  const withImport = `${index.slice(0, at)}\nimport { ${constName} } from './${fileName}'${index.slice(at)}`
  return withImport.replace(LIST, (_, open: string, content: string, close: string) => `${open}${append(content, constName).trim()}${close}`)
}
