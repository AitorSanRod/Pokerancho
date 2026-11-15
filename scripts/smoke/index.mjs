/**
 * Prueba de humo de la app de verdad en un navegador: arranca con una partida de muestra, recorre las pestañas sin
 * errores y comprueba que dos pestañas no juegan a la vez la misma partida.
 *
 *   npm run dev          # en otra terminal
 *   npm run smoke
 *
 * Variables: APP_URL (por defecto http://localhost:5173/) y CHROME_PATH (Chrome o Edge instalado).
 */
import puppeteer from 'puppeteer-core'
import { buildDemoSave } from '../tutorial-shots/demoSave.mjs'

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173/'
const CHROME_PATH = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 1 }
/** Milisegundos como mucho que se espera a que aparezca algo en pantalla */
const WAIT_MS = 8000
/** Errores de consola que no son fallos de la app: sin servidor (npm run dev) la API no existe */
const IGNORED = [/Failed to load resource/, /\/api\//]

const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true })
const failures = []

async function check(name, run) {
  try {
    await run()
    console.log(`ok   ${name}`)
  } catch (error) {
    failures.push(name)
    console.log(`FAIL ${name}: ${error.message}`)
  }
}

async function openPage() {
  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)
  page.errors = []
  page.on('pageerror', (e) => page.errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && !IGNORED.some((r) => r.test(m.text())) && page.errors.push(m.text()))
  return page
}

const first = await openPage()
await first.goto(APP_URL)
const save = await first.evaluate(buildDemoSave, {})
await first.evaluate((data) => {
  localStorage.clear()
  localStorage.setItem('pokerancho-save', data)
}, save)
await first.reload()

await check('arranca con la partida guardada', () => first.waitForSelector('.bottom-nav', { timeout: WAIT_MS }))
await check('se pasa por todas las pestañas sin errores', async () => {
  const tabs = await first.$$('.bottom-nav button')
  for (const tab of tabs) {
    await tab.click()
    await first.waitForSelector('main.content .screen', { timeout: WAIT_MS })
  }
  if (first.errors.length) throw new Error(first.errors.join(' | '))
})

const second = await openPage()
await second.goto(APP_URL)
await check('otra pestaña avisa de que la partida ya está abierta', () => second.waitForSelector('.other-tab', { timeout: WAIT_MS }))
await check('«Jugar aquí» se la trae y la primera pasa a avisar', async () => {
  await second.click('.other-tab button')
  await second.waitForSelector('.bottom-nav', { timeout: WAIT_MS })
  await first.waitForSelector('.other-tab', { timeout: WAIT_MS })
  if (second.errors.length) throw new Error(second.errors.join(' | '))
})

await browser.close()
if (failures.length) process.exit(1)
