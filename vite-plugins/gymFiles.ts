// Cambios de texto en src/data/gyms.ts para guardar un gimnasio desde el editor: su entrada en GYMS (sustituida o al
// final) y, si es nuevo, su clave en GymId. Funciones puras (texto → texto); lanzan un error legible si el fichero no
// tiene la forma esperada.

/** Lo que manda el editor al guardar un gimnasio */
export interface GymWrite {
  /** Clave de GymId: `Celeste` */
  idKey: string
  /** Valor de GymId (solo se usa si es nuevo): `celeste` */
  idValue: string
  /** La entrada de GYMS, de `  [GymId.X]: {` a `  },` */
  code: string
}

const FORMATS: [keyof GymWrite, RegExp][] = [
  ['idKey', /^[A-Z][A-Za-z0-9]*$/],
  ['idValue', /^[a-z0-9]+(-[a-z0-9]+)*$/],
]

/** La petición, comprobada */
export function parseGymWrite(body: unknown): GymWrite {
  const w = (body ?? {}) as Record<string, unknown>
  for (const [field, format] of FORMATS) {
    if (typeof w[field] !== 'string' || !format.test(w[field])) throw new Error(`«${field}» no es válido`)
  }
  if (typeof w.code !== 'string' || !w.code.trimStart().startsWith(`[GymId.${String(w.idKey)}]`)) throw new Error('El código no es la entrada de ese gimnasio')
  return w as unknown as GymWrite
}

const ID_DICT = /(export const GymId = \{)([^}]*)(\} as const)/
const GYMS_START = /export const GYMS: Record<GymId, Gym> = \{\n/

/** ¿Está ya esa clave en GymId? */
export function hasGymId(text: string, key: string): boolean {
  const dict = ID_DICT.exec(text)
  if (!dict) throw new Error('No se encuentra `GymId` en gyms.ts')
  return new RegExp(`(^|[\\s{,])${key}:`).test(dict[2])
}

/** gyms.ts con la clave nueva en GymId */
export function addGymId(text: string, key: string, value: string): string {
  const dict = ID_DICT.exec(text)
  if (!dict) throw new Error('No se encuentra `GymId` en gyms.ts')
  if (dict[2].includes(`'${value}'`)) throw new Error(`Ya hay un gimnasio con el valor «${value}»`)
  const items = dict[2].trim().replace(/,$/, '')
  return text.replace(ID_DICT, (_, open: string, _content: string, close: string) => `${open} ${items ? `${items}, ` : ''}${key}: '${value}' ${close}`)
}

/** gyms.ts con la entrada del gimnasio: en lugar de la suya si ya está, o al final de GYMS (con saltos de línea \n) */
export function upsertGym(text: string, key: string, code: string): string {
  const lf = text.replace(/\r\n/g, '\n')
  const start = GYMS_START.exec(lf)
  if (!start) throw new Error('No se encuentra `GYMS` en gyms.ts')
  const entry = code.replace(/\r\n/g, '\n').trimEnd()
  const open = lf.indexOf(`  [GymId.${key}]: {\n`, start.index)
  if (open >= 0) {
    const close = lf.indexOf('\n  },\n', open)
    if (close < 0) throw new Error(`No se encuentra el final de [GymId.${key}] en GYMS`)
    return lf.slice(0, open) + entry + lf.slice(close + '\n  },'.length)
  }
  const end = lf.indexOf('\n}\n', start.index)
  if (end < 0) throw new Error('No se encuentra el final de GYMS')
  return `${lf.slice(0, end)}\n${entry}${lf.slice(end)}`
}
