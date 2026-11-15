// Solo con `npm run dev`: el editor de entrenadores (tools/route-editor) guarda el entrenador en src/data/trainers.ts.

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { toolWriter } from './toolHttp.ts'
import { hasTrainer, parseTrainerWrite, upsertTrainer } from './trainerFiles.ts'

/** Lo llama tools/route-editor/trainer/trainerWrite.ts */
const TRAINER_WRITE_URL = '/__tools/trainer'

const FILE = 'src/data/trainers.ts'

/** Escribe el entrenador; devuelve qué ha hecho, para el aviso del editor */
function writeTrainer(root: string, body: unknown) {
  const w = parseTrainerWrite(body)
  const path = join(root, FILE)
  const text = readFileSync(path, 'utf8')
  const isNew = !hasTrainer(text, w.idKey)
  writeFileSync(path, upsertTrainer(text, w.idKey, w.code))
  return { file: FILE, created: isNew }
}

export const trainerWriter = () => toolWriter('trainer-writer', TRAINER_WRITE_URL, writeTrainer)
