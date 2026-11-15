// Guardar el entrenador en el juego desde el editor: el servidor de `npm run dev` escribe su entrada en
// src/data/trainers.ts (vite-plugins/trainerWriter.ts). Su TrainerId sale solo de la clave.

import { trainerCode } from './trainerCodegen'
import type { TrainerDraft } from './trainerDraft'

const WRITE_URL = '/__tools/trainer'

/** Escribe el entrenador; devuelve el texto del aviso o lanza un error legible */
export async function writeTrainer(d: TrainerDraft): Promise<string> {
  const body = { idKey: d.idKey, code: trainerCode(d) }
  let res: Response
  try {
    res = await fetch(WRITE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  } catch {
    throw new Error('No hay servidor: abre el editor con `npm run dev`')
  }
  const data = (await res.json().catch(() => ({}))) as { file?: string; created?: boolean; error?: string }
  if (!res.ok) throw new Error(data.error ?? `El servidor respondió ${res.status}`)
  return data.created ? `Creado en ${data.file}.\nFalta ponerlo en una ruta: mira «Añadir también».` : `Actualizado en ${data.file}.`
}
