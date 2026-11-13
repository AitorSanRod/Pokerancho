// Solo con `npm run dev`: el editor de gimnasios (tools/route-editor) guarda el gimnasio en src/data/gyms.ts y, si es
// nuevo, lo da de alta en GymId.

import { readFileSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import type { Plugin } from 'vite'
import { addGymId, hasGymId, parseGymWrite, upsertGym } from './gymFiles.ts'

/** Lo llama tools/route-editor/gym/gymWrite.ts */
const GYM_WRITE_URL = '/__tools/gym'

const FILE = 'src/data/gyms.ts'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer) => (body += chunk.toString('utf8')))
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

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

function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

export function gymWriter(): Plugin {
  return {
    name: 'gym-writer',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(GYM_WRITE_URL, async (req, res) => {
        if (req.method !== 'POST') return send(res, 405, { error: 'Solo POST' })
        try {
          send(res, 200, writeGym(server.config.root, JSON.parse(await readBody(req))))
        } catch (e) {
          send(res, 400, { error: (e as Error).message })
        }
      })
    },
  }
}
