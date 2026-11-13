// Guardar el gimnasio en el juego desde el editor: el servidor de `npm run dev` escribe su entrada en src/data/gyms.ts
// y, si es nuevo, lo da de alta en GymId (vite-plugins/gymWriter.ts).

import { gymCode, gymIdValue } from './gymCodegen'
import type { GymDraft } from './gymDraft'

const WRITE_URL = '/__tools/gym'

/** Escribe el gimnasio; devuelve el texto del aviso o lanza un error legible */
export async function writeGym(d: GymDraft): Promise<string> {
  const body = { idKey: d.idKey, idValue: gymIdValue(d), code: gymCode(d) }
  let res: Response
  try {
    res = await fetch(WRITE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  } catch {
    throw new Error('No hay servidor: abre el editor con `npm run dev`')
  }
  const data = (await res.json().catch(() => ({}))) as { file?: string; created?: boolean; error?: string }
  if (!res.ok) throw new Error(data.error ?? `El servidor respondió ${res.status}`)
  return data.created
    ? `Creado en ${data.file} y dado de alta en GymId.\nFaltan su GIF y su ruta: mira «Añadir también».`
    : `Actualizado en ${data.file}.`
}
