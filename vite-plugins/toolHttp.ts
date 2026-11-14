// Lo común de los escritores de las herramientas (solo con `npm run dev`): una ruta del servidor que recibe un POST con
// JSON, lo escribe en los datos del juego y responde qué ha hecho, o el error.

import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer) => (body += chunk.toString('utf8')))
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

/** Plugin que atiende los POST a `url` con `write(raíz del proyecto, cuerpo)` y le devuelve su resultado */
export function toolWriter(name: string, url: string, write: (root: string, body: unknown) => unknown): Plugin {
  return {
    name,
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(url, async (req, res) => {
        if (req.method !== 'POST') return send(res, 405, { error: 'Solo POST' })
        try {
          send(res, 200, write(server.config.root, JSON.parse(await readBody(req))))
        } catch (e) {
          send(res, 400, { error: (e as Error).message })
        }
      })
    },
  }
}
