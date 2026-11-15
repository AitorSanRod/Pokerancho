// Cambios de texto en un fichero de datos con un diccionario de ids y una tabla por id (GymId + GYMS en gyms.ts),
// para guardar una entrada desde el editor: la entrada (sustituida o al final) y, si es nueva, su clave en el
// diccionario. Funciones puras (texto → texto); lanzan un error legible si el fichero no tiene la forma esperada.

/** Qué diccionario y qué tabla del fichero: `{ dict: 'GymId', record: 'GYMS', file: 'gyms.ts' }` */
export interface RecordFile {
  dict: string
  record: string
  file: string
}

/** Lo que manda el editor al guardar una entrada */
export interface EntryWrite {
  /** Clave del diccionario: `Celeste` */
  idKey: string
  /** Valor del diccionario (solo se usa si es nueva): `celeste` */
  idValue: string
  /** La entrada de la tabla, de `  [Dict.X]: {` a `  },` */
  code: string
}

const FORMATS: [keyof EntryWrite, RegExp][] = [
  ['idKey', /^[A-Z][A-Za-z0-9]*$/],
  ['idValue', /^[a-z0-9]+(-[a-z0-9]+)*$/],
]

/** La petición, comprobada */
export function parseEntryWrite(f: RecordFile, body: unknown): EntryWrite {
  const w = (body ?? {}) as Record<string, unknown>
  for (const [field, format] of FORMATS) {
    if (typeof w[field] !== 'string' || !format.test(w[field])) throw new Error(`«${field}» no es válido`)
  }
  if (typeof w.code !== 'string' || !w.code.trimStart().startsWith(`[${f.dict}.${String(w.idKey)}]`)) {
    throw new Error(`El código no es la entrada de ese ${f.dict}`)
  }
  return w as unknown as EntryWrite
}

const idDict = (f: RecordFile) => new RegExp(`(export const ${f.dict} = \\{)([^}]*)(\\} as const)`)

function dictBody(text: string, f: RecordFile): string {
  const dict = idDict(f).exec(text)
  if (!dict) throw new Error(`No se encuentra \`${f.dict}\` en ${f.file}`)
  return dict[2]
}

/** ¿Está ya esa clave en el diccionario? */
export const hasId = (f: RecordFile, text: string, key: string): boolean => new RegExp(`(^|[\\s{,])${key}:`).test(dictBody(text, f))

/** El fichero con la clave nueva en el diccionario, en su misma forma: en una línea o una clave por línea */
export function addId(f: RecordFile, text: string, key: string, value: string): string {
  const body = dictBody(text, f)
  if (body.includes(`'${value}'`)) throw new Error(`Ya hay un ${f.dict} con el valor «${value}»`)
  const eol = text.includes('\r\n') ? '\r\n' : '\n'
  const multiline = body.includes('\n')
  const items = body.trim().replace(/,$/, '')
  const next = multiline
    ? `${eol}${items ? `  ${items},${eol}` : ''}  ${key}: '${value}',${eol}`
    : ` ${items ? `${items}, ` : ''}${key}: '${value}' `
  return text.replace(idDict(f), (_, open: string, _body: string, close: string) => `${open}${next}${close}`)
}

/** El fichero con la entrada: en lugar de la suya si ya está, o al final de la tabla (con saltos de línea \n) */
export function upsertEntry(f: RecordFile, text: string, key: string, code: string): string {
  const lf = text.replace(/\r\n/g, '\n')
  const start = new RegExp(`export const ${f.record}: Record<${f.dict}, \\w+> = \\{\\n`).exec(lf)
  if (!start) throw new Error(`No se encuentra \`${f.record}\` en ${f.file}`)
  const entry = code.replace(/\r\n/g, '\n').trimEnd()
  const open = lf.indexOf(`  [${f.dict}.${key}]: {\n`, start.index)
  if (open >= 0) {
    const close = lf.indexOf('\n  },\n', open)
    if (close < 0) throw new Error(`No se encuentra el final de [${f.dict}.${key}] en ${f.record}`)
    return lf.slice(0, open) + entry + lf.slice(close + '\n  },'.length)
  }
  const end = lf.indexOf('\n}\n', start.index)
  if (end < 0) throw new Error(`No se encuentra el final de ${f.record}`)
  return `${lf.slice(0, end)}\n${entry}${lf.slice(end)}`
}
