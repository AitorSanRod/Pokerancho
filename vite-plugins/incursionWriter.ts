// Solo con `npm run dev`: el editor de incursiones (tools/route-editor) guarda el fichero de la incursión en
// src/data/incursions/ y, si es nueva, la da de alta en types.ts e index.ts.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { addIncursionId, addToIncursionList, hasIncursionId, parseWrite } from './incursionFiles.ts'
import { toolWriter } from './toolHttp.ts'

/** Lo llama tools/route-editor/incursion/incWrite.ts */
const INCURSION_WRITE_URL = '/__tools/incursion'

const DIR = 'src/data/incursions'

/** Escribe la incursión; devuelve qué ha hecho, para el aviso del editor */
function writeIncursion(root: string, body: unknown) {
  const w = parseWrite(body)
  const dir = join(root, DIR)
  const file = `${w.fileName}.ts`
  const typesPath = join(dir, 'types.ts')
  const indexPath = join(dir, 'index.ts')
  const types = readFileSync(typesPath, 'utf8')
  const isNew = !hasIncursionId(types, w.idKey)
  const existed = existsSync(join(dir, file))
  if (isNew && existed) throw new Error(`Ya existe ${DIR}/${file} y es de otra incursión: cambia el id`)
  // Primero lo que puede fallar al leerse: si algo no cuadra no se escribe nada
  const newTypes = isNew ? addIncursionId(types, w.idKey, w.idValue) : types
  const newIndex = isNew ? addToIncursionList(readFileSync(indexPath, 'utf8'), w.constName, w.fileName) : ''
  writeFileSync(join(dir, file), w.code)
  if (isNew) {
    writeFileSync(typesPath, newTypes)
    writeFileSync(indexPath, newIndex)
  }
  return { file: `${DIR}/${file}`, created: !existed, registered: isNew }
}

export const incursionWriter = () => toolWriter('incursion-writer', INCURSION_WRITE_URL, writeIncursion)
