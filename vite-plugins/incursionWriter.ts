// Solo con `npm run dev`: el editor de incursiones (tools/route-editor) guarda el fichero de la incursión en
// src/data/incursions/ y, si es nueva, la da de alta en types.ts e index.ts.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import type { Plugin } from 'vite'
import { addIncursionId, addToIncursionList, hasIncursionId, parseWrite } from './incursionFiles.ts'

/** Lo llama tools/route-editor/incursion/incWrite.ts */
const INCURSION_WRITE_URL = '/__tools/incursion'

const DIR = 'src/data/incursions'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer) => (body += chunk.toString('utf8')))
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

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

function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

export function incursionWriter(): Plugin {
  return {
    name: 'incursion-writer',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(INCURSION_WRITE_URL, async (req, res) => {
        if (req.method !== 'POST') return send(res, 405, { error: 'Solo POST' })
        try {
          send(res, 200, writeIncursion(server.config.root, JSON.parse(await readBody(req))))
        } catch (e) {
          send(res, 400, { error: (e as Error).message })
        }
      })
    },
  }
}
