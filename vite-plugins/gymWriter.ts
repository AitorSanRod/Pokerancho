// Solo con `npm run dev`: el editor de gimnasios (tools/route-editor) guarda el gimnasio en src/data/gyms.ts y, si es
// nuevo, lo da de alta en GymId.

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { addGymId, hasGymId, parseGymWrite, upsertGym } from './gymFiles.ts'
import { toolWriter } from './toolHttp.ts'

/** Lo llama tools/route-editor/gym/gymWrite.ts */
const GYM_WRITE_URL = '/__tools/gym'

const FILE = 'src/data/gyms.ts'

/** Escribe el gimnasio; devuelve qué ha hecho, para el aviso del editor */
function writeGym(root: string, body: unknown) {
  const w = parseGymWrite(body)
  const path = join(root, FILE)
  const text = readFileSync(path, 'utf8')
  const isNew = !hasGymId(text, w.idKey)
  // Todo en memoria antes de escribir: si algo no cuadra no se toca el fichero
  const withId = isNew ? addGymId(text, w.idKey, w.idValue) : text
  writeFileSync(path, upsertGym(withId, w.idKey, w.code))
  return { file: FILE, created: isNew }
}

export const gymWriter = () => toolWriter('gym-writer', GYM_WRITE_URL, writeGym)
