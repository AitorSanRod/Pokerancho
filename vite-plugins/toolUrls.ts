import { existsSync, readdirSync, readFileSync } from 'node:fs'
import type { Plugin } from 'vite'

const TOOLS_DIR = 'tools'

/** Herramientas de `tools/` (cada carpeta con su index.html) con el `<title>` de su página */
function devTools(): { path: string; title: string }[] {
  if (!existsSync(TOOLS_DIR)) return []
  return readdirSync(TOOLS_DIR)
    .filter((dir) => existsSync(`${TOOLS_DIR}/${dir}/index.html`))
    .map((dir) => {
      const html = readFileSync(`${TOOLS_DIR}/${dir}/index.html`, 'utf8')
      return { path: `${TOOLS_DIR}/${dir}/`, title: /<title>(.*?)<\/title>/.exec(html)?.[1] ?? dir }
    })
}

/** Con `npm run dev`, debajo de las URLs de la app salen las de las herramientas */
export function printToolUrls(): Plugin {
  return {
    name: 'print-tool-urls',
    apply: 'serve',
    configureServer(server) {
      const printUrls = server.printUrls
      server.printUrls = () => {
        printUrls()
        const base = server.resolvedUrls?.local[0]
        if (!base) return
        const tools = devTools()
        const width = Math.max(...tools.map((t) => t.title.length))
        server.config.logger.info('\n  Herramientas:')
        for (const tool of tools) server.config.logger.info(`  ➜  ${tool.title.padEnd(width)}  ${base}${tool.path}`)
      }
    },
  }
}
