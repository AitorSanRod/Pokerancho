/**
 * Capturas de las guías de torre, gimnasios, tienda, gacha, ficha y cuenta (las demás, en shots.mjs). Mismo formato:
 * `name`, `scenario` (demoSave.mjs), `steps` y `focus`.
 */
import { nav, openMenu, openRanchMon, routeBattle, showSection, tap, toRoute, toRouteTab, wait } from './steps.mjs'

/** Abre la ficha de la Pokédex de esa especie (por su clave de POKEMON, p. ej. 'Abra') */
async function openDexCell(page, name) {
  await nav(page, 'dex')
  const index = await page.evaluate(async (key) => {
    const { POKEMON } = await import('/src/data/pokemon.ts')
    const isSprite = (img) => img.src.endsWith(`/${POKEMON[key]}.png`) || img.src.endsWith(`/${POKEMON[key]}.gif`)
    return [...document.querySelectorAll('.dex-cell')].findIndex((el) => [...el.querySelectorAll('img')].some(isSprite))
  }, name)
  if (index < 0) throw new Error(`${name} no está en la Pokédex`)
  await (await page.$$('.dex-cell'))[index].click()
  await wait(900)
}

const toShopTab = async (p, label) => {
  await nav(p, 'shop')
  await tap(p, `::-p-aria(${label})`, 900)
}
const toGachaTab = async (p, label) => {
  await nav(p, 'gacha')
  await tap(p, `::-p-aria(${label})`, 900)
}
const GYM_ROW = '::-p-text(Gimnasio de Ciudad Plateada)'

export const GUIDE_SHOTS = [
  // Torre infinita
  { name: 'tower-tab', steps: (p) => toRouteTab(p, 'Torre', 900), focus: '.tower-head' },
  { name: 'tower-start', steps: (p) => toRouteTab(p, 'Torre', 900), focus: '.tower-begin' },
  { name: 'tower-climb', scenario: { tower: true }, steps: (p) => toRouteTab(p, 'Torre', 3000), focus: '.run-hud' },
  // Gimnasios y entrenadores
  { name: 'gym-route', scenario: { gym: true }, steps: toRoute, focus: GYM_ROW },
  {
    name: 'gym-start',
    scenario: { gym: true },
    steps: async (p) => {
      await toRoute(p)
      await tap(p, GYM_ROW, 900)
    },
    focus: '::-p-text(Solo entran Pokémon)',
  },
  { name: 'gym-battle', scenario: { gym: true, gymRun: true }, steps: routeBattle },
  { name: 'gym-badges', scenario: { gym: true }, steps: (p) => openMenu(p, 'Perfil'), focus: '.badge-case' },
  // Tienda, venta e intercambios
  { name: 'shop-upgrades', steps: (p) => nav(p, 'shop'), focus: '.shop-fold-upgrades' },
  {
    name: 'shop-mints',
    steps: async (p) => {
      await nav(p, 'shop')
      await tap(p, '::-p-text(Mentas)')
    },
    focus: '.shop-fold-mints',
  },
  { name: 'shop-sell', steps: (p) => toShopTab(p, 'Venta'), focus: '.shop-fold-sell' },
  { name: 'shop-trade', steps: (p) => toShopTab(p, 'Intercambios'), focus: '.trade-signin' },
  // Gacha, trituradora y MissingNo
  { name: 'gacha-shredder', steps: (p) => toGachaTab(p, 'Trituradora'), focus: '.shred-all' },
  { name: 'gacha-missingno', steps: (p) => toGachaTab(p, 'MissingNo'), focus: '.missingno-grid' },
  {
    name: 'gacha-shiny',
    steps: async (p) => {
      await openDexCell(p, 'Abra')
      await showSection(p, 'Tickets')
    },
    focus: '::-p-text(Crear shiny)',
  },
  // Tu Pokémon a fondo
  {
    name: 'mon-data',
    steps: async (p) => {
      await openRanchMon(p, 'Charmander')
      await showSection(p, 'Datos')
    },
    focus: '.mon-stats',
  },
  {
    name: 'mon-mint',
    scenario: { mints: true },
    steps: async (p) => {
      await openRanchMon(p, 'Charmander')
      await showSection(p, 'Naturaleza')
    },
    focus: '::-p-text(Menta aleatoria)',
  },
  {
    name: 'mon-tm',
    scenario: { tm: true },
    steps: async (p) => {
      await openRanchMon(p, 'Eevee')
      // La sección MT va justo encima de «Mover a…»
      await showSection(p, 'Mover a')
    },
    focus: '::-p-text(MT Señuelo)',
  },
  {
    name: 'mon-box',
    steps: async (p) => {
      await openRanchMon(p, 'Rattata')
      await showSection(p, 'Mover a')
    },
    focus: '.move-options ::-p-text(Caja)',
  },
  { name: 'mon-favorite', steps: (p) => openRanchMon(p, 'Eevee'), focus: '.favorite-button' },
  // Cuenta, perfil y avisos
  {
    name: 'online-account',
    steps: async (p) => {
      await tap(p, '::-p-aria(Ajustes)')
      await tap(p, '::-p-text(Cuenta)', 900)
    },
  },
  { name: 'online-profile', scenario: { gym: true }, steps: (p) => openMenu(p, 'Perfil'), focus: '.profile-card' },
  { name: 'online-ranking', steps: (p) => openMenu(p, 'Ranking') },
  { name: 'online-inbox', scenario: { raidPrize: true }, steps: (p) => openMenu(p, 'Notificaciones'), focus: '.inbox-entry' },
  { name: 'online-board', steps: (p) => openMenu(p, 'Tablón') },
]
