// Pasos comunes de las capturas: tocar, navegar, abrir fichas y menús, llegar a un combate

export const NAV = { route: 1, community: 2, ranch: 3, dex: 4, shop: 5 }

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function tap(page, selector, after = 600) {
  const el = await page.waitForSelector(selector, { timeout: 4000 })
  await el.click()
  await wait(after)
}

export const nav = (page, tab) => tap(page, `.bottom-nav button:nth-child(${NAV[tab]})`)

/** Abre la ficha del Pokémon del rancho de esa especie (por su clave de POKEMON, p. ej. 'Bulbasaur') */
export async function openRanchMon(page, name) {
  const index = await page.evaluate(async (key) => {
    const { POKEMON } = await import('/src/data/pokemon.ts')
    const isSprite = (img) => img.src.endsWith(`/${POKEMON[key]}.png`) || img.src.endsWith(`/${POKEMON[key]}.gif`)
    return [...document.querySelectorAll('.ranch-mon')].findIndex((el) => [...el.querySelectorAll('img')].some(isSprite))
  }, name)
  if (index < 0) throw new Error(`${name} no está en el rancho`)
  await (await page.$$('.ranch-mon'))[index].click()
  await wait(900)
}

/** Lleva arriba una sección de la ficha por su título */
export async function showSection(page, title) {
  const el = await page.waitForSelector(`::-p-text(${title})`, { timeout: 4000 })
  await el.evaluate((node) => node.scrollIntoView({ block: 'start' }))
  await wait(500)
}

/** Toca la escena de la ruta hasta que empieza un combate y deja que se vean unos golpes */
export async function tapUntilBattle(page) {
  for (let i = 0; i < 200 && !(await page.$('.route-battle')); i++) {
    await page.mouse.click(195, 500)
    await wait(100)
  }
  await wait(2600)
}

/** Toca la escena de la ruta (para llegar antes a los combates) hasta que sale un anillo del toque crítico */
export async function tapUntilRing(page) {
  for (let i = 0; i < 600 && !(await page.$('.tap-ring-closing')); i++) {
    if (!(await page.$('.route-battle'))) await page.mouse.click(195, 500)
    await wait(100)
  }
  await wait(450)
}

export const toRoute = (p) => nav(p, 'route')
export const toRouteTab = async (p, label, after) => {
  await toRoute(p)
  await tap(p, `::-p-aria(${label})`, after)
}
/** Comunidad › Incursiones o Raids */
export const toCommunityTab = async (p, label, after) => {
  await nav(p, 'community')
  await tap(p, `::-p-aria(${label})`, after)
}
/** Pestaña Pokédex (se abre en su subpestaña Pokédex) */
export const toDex = (p) => nav(p, 'dex')
/** Pokédex › Tirar, Trituradora o MissingNo */
export const toGachaTab = async (p, label, after = 900) => {
  await nav(p, 'dex')
  await tap(p, `::-p-aria(${label})`, after)
}
export const openMenu = async (p, entry) => {
  await tap(p, '.ranch-menu-button')
  await tap(p, `::-p-text(${entry})`)
}
export const routeBattle = async (p) => {
  await toRoute(p)
  await tapUntilBattle(p)
}
