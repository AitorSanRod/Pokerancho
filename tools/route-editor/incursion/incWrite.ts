// Guardar la incursión en el juego desde el editor: el servidor de `npm run dev` escribe su fichero y, si es nueva, la
// da de alta (vite-plugins/incursionWriter.ts).

import { kebab } from '../codegen'
import { constName, fileName, incursionCode } from './incCodegen'
import type { IncursionDraft } from './incDraft'

const WRITE_URL = '/__tools/incursion'

interface WriteResult {
  file: string
  created: boolean
  registered: boolean
}

/** Escribe la incursión; devuelve el texto del aviso o lanza un error legible */
export async function writeIncursion(d: IncursionDraft): Promise<string> {
  const body = {
    idKey: d.idKey,
    idValue: d.idValue || kebab(d.idKey),
    constName: constName(d.idKey),
    fileName: fileName(d.idKey),
    code: incursionCode(d),
  }
  let res: Response
  try {
    res = await fetch(WRITE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  } catch {
    throw new Error('No hay servidor: abre el editor con `npm run dev`')
  }
  const data = (await res.json().catch(() => ({}))) as Partial<WriteResult> & { error?: string }
  if (!res.ok) throw new Error(data.error ?? `El servidor respondió ${res.status}`)
  const what = data.created ? 'Creado' : 'Actualizado'
  const registered = data.registered ? '\nDada de alta en IncursionId (types.ts) y en INCURSIONS (index.ts).' : ''
  return `${what} ${data.file}.${registered}`
}
