// Cambios de texto en src/data/trainers.ts para guardar un entrenador desde el editor: su entrada en TRAINERS
// (`Joven1: { … },`, sustituida o al final). Su TrainerId sale solo de la clave. Funciones puras (texto → texto); lanzan
// un error legible si el fichero no tiene la forma esperada.

export const TRAINERS_FILE = 'trainers.ts'

/** Lo que manda el editor al guardar un entrenador */
export interface TrainerWrite {
  /** Clave en TRAINERS: `Joven1` */
  idKey: string
  /** La entrada, de `  Joven1: {` a `  },` */
  code: string
}

const ID_KEY = /^[A-Z][A-Za-z0-9]*$/
const LIST_START = /export const TRAINERS = trainerList\(\{\n/
const LIST_END = '\n})\n'

/** La petición, comprobada */
export function parseTrainerWrite(body: unknown): TrainerWrite {
  const w = (body ?? {}) as Record<string, unknown>
  if (typeof w.idKey !== 'string' || !ID_KEY.test(w.idKey)) throw new Error('«idKey» no es válido')
  if (typeof w.code !== 'string' || !w.code.trimStart().startsWith(`${w.idKey}: {`)) throw new Error('El código no es la entrada de ese entrenador')
  return { idKey: w.idKey, code: w.code }
}

/** Dónde empieza la lista, con saltos de línea \n */
function listStart(lf: string): number {
  const start = LIST_START.exec(lf)
  if (!start) throw new Error(`No se encuentra \`TRAINERS = trainerList({\` en ${TRAINERS_FILE}`)
  return start.index + start[0].length
}

const entryOpen = (key: string) => `  ${key}: {\n`

/** ¿Está ya ese entrenador en TRAINERS? */
export function hasTrainer(text: string, key: string): boolean {
  const lf = text.replace(/\r\n/g, '\n')
  return lf.indexOf(`\n${entryOpen(key)}`, listStart(lf) - 1) >= 0
}

/** El fichero con la entrada: en lugar de la suya si ya está, o al final de TRAINERS */
export function upsertTrainer(text: string, key: string, code: string): string {
  const lf = text.replace(/\r\n/g, '\n')
  const from = listStart(lf)
  const entry = code.replace(/\r\n/g, '\n').trimEnd()
  const open = lf.indexOf(`\n${entryOpen(key)}`, from - 1)
  if (open >= 0) {
    const close = lf.indexOf('\n  },\n', open + 1)
    if (close < 0) throw new Error(`No se encuentra el final de ${key} en TRAINERS`)
    return lf.slice(0, open + 1) + entry + lf.slice(close + '\n  },'.length)
  }
  const end = lf.indexOf(LIST_END, from)
  if (end < 0) throw new Error('No se encuentra el final de TRAINERS')
  return `${lf.slice(0, end)}\n${entry}${lf.slice(end)}`
}
