/**
 * Lista de capturas de los tutoriales. Cada una: `name` (fichero .webp), `scenario` (qué añadir a la partida de
 * demostración, ver demoSave.mjs), `steps` (toques hasta llegar a la pantalla) y `focus` (lo que se resalta). Las de
 * las guías más nuevas, en guideShots.mjs.
 */
import { GUIDE_SHOTS } from './guideShots.mjs'
import { tap, nav, openRanchMon, showSection, tapUntilRing, toRoute, toRouteTab, openMenu, routeBattle } from './steps.mjs'

export const SHOTS = [
  // Mejoras, misiones y toques
  { name: 'perks-milestones', scenario: { perks: true }, steps: (p) => openRanchMon(p, 'Charmander'), focus: '.milestones' },
  {
    name: 'perks-dex',
    scenario: { perks: true },
    steps: async (p) => {
      await nav(p, 'dex')
      await tap(p, '::-p-text(Mejoras)')
    },
    focus: '.dex-perks',
  },
  { name: 'perks-missions', steps: (p) => openMenu(p, 'Misiones'), focus: '.mission-list' },
  {
    name: 'perks-crit',
    scenario: { run: true },
    steps: async (p) => {
      await toRoute(p)
      await tapUntilRing(p)
    },
    focus: '.tap-ring',
  },
  {
    name: 'perks-boost',
    scenario: { run: true, boost: true },
    steps: async (p) => {
      await toRoute(p)
      await p.waitForSelector('.exp-boost-spawn', { timeout: 8000 })
    },
    focus: '.exp-boost-spawn',
  },
  // Cómo jugar
  { name: 'play-ranch', focus: '.ranch-mon' },
  { name: 'play-companion', steps: (p) => openRanchMon(p, 'Eevee'), focus: '.companion-button' },
  { name: 'play-routes', steps: toRoute, focus: '.route-row:nth-child(2)' },
  {
    name: 'play-start',
    steps: async (p) => {
      await toRoute(p)
      await tap(p, '.route-row:nth-child(2)')
    },
    focus: '::-p-text(¡En marcha!)',
  },
  { name: 'play-run', scenario: { run: true }, steps: routeBattle },
  { name: 'play-expeditions', scenario: { expedition: true }, steps: (p) => toRouteTab(p, 'Expediciones'), focus: '::-p-aria(Expediciones)' },
  { name: 'play-gacha', steps: (p) => nav(p, 'gacha'), focus: '::-p-text(Tirar x1)' },
  { name: 'play-dex', steps: (p) => nav(p, 'dex'), focus: '.dex-cell.ready' },
  // Raids: «raid-join» y «raid-nickname» necesitan la sala abierta (la primera media hora de cada hora, raidSchedule.ts)
  { name: 'raid-tab', steps: toRoute, focus: '::-p-aria(Raids)' },
  { name: 'raid-join', steps: (p) => toRouteTab(p, 'Raids', 1500), focus: '::-p-text(Entrar en la sala)' },
  { name: 'raid-send', scenario: { raid: 'lobby' }, steps: (p) => toRouteTab(p, 'Raids', 1500), focus: '::-p-text(Salir de la sala)' },
  {
    name: 'raid-nickname',
    steps: async (p) => {
      await toRouteTab(p, 'Raids', 1500)
      await tap(p, '::-p-text(Entrar en la sala)')
    },
  },
  { name: 'raid-battle', scenario: { raid: 'fight' }, steps: (p) => toRouteTab(p, 'Raids', 3000), focus: '.move-bar' },
  { name: 'raid-prize', scenario: { raidPrize: true }, steps: (p) => toRouteTab(p, 'Raids', 1500), focus: '.raid-prize-banner' },
  // Incursiones
  { name: 'inc-tab', steps: toRoute, focus: '::-p-aria(Incursiones)' },
  {
    name: 'inc-keys',
    steps: async (p) => {
      await nav(p, 'shop')
      await tap(p, '::-p-text(Llaves de incursión)')
    },
    focus: '.shop-fold-keys .shop-grid',
  },
  { name: 'inc-info', steps: (p) => toRouteTab(p, 'Incursiones'), focus: '::-p-text(Cómo funcionan las incursiones)' },
  { name: 'inc-board', respond: 'board', steps: (p) => toRouteTab(p, 'Incursiones'), focus: '.schedule-card' },
  {
    name: 'inc-schedule',
    respond: 'board',
    steps: async (p) => {
      await toRouteTab(p, 'Incursiones')
      await tap(p, '::-p-aria(Programar)')
      await tap(p, '.incursion-card .btn.go::-p-text(Programar)', 900)
    },
    focus: '.schedule-dialog',
  },
  { name: 'inc-room', respond: 'room', steps: (p) => toRouteTab(p, 'Incursiones', 1200), focus: '.schedule-room-you' },
  { name: 'inc-tap', scenario: { incursion: 'tap' }, steps: (p) => toRouteTab(p, 'Incursiones', 1200), focus: '.incursion-tap-pad' },
  { name: 'inc-battle', scenario: { incursion: 'battle' }, steps: (p) => toRouteTab(p, 'Incursiones', 1500), focus: '.incursion-revives' },
  { name: 'inc-regroup', scenario: { incursion: 'regroup' }, steps: (p) => toRouteTab(p, 'Incursiones', 1500), focus: '.incursion-regroup' },
  { name: 'inc-summary', scenario: { incursion: 'finished' }, steps: (p) => toRouteTab(p, 'Incursiones', 1500), focus: '.incursion-summary' },
  // Evolucionar y mejorar
  {
    name: 'evo-train',
    steps: async (p) => {
      await openRanchMon(p, 'Charmander')
      await showSection(p, 'Cuidados')
    },
    focus: '.stepper-action',
  },
  {
    name: 'evo-evolve',
    steps: async (p) => {
      await openRanchMon(p, 'Bulbasaur')
      await showSection(p, 'Evolución')
    },
    focus: '.evolve-options',
  },
  {
    name: 'evo-stones',
    steps: async (p) => {
      await nav(p, 'shop')
      await tap(p, '::-p-text(Objetos evolutivos)')
    },
    focus: '.shop-fold-stones .shop-grid',
  },
  {
    name: 'evo-star',
    steps: async (p) => {
      await nav(p, 'dex')
      await tap(p, '.dex-cell.ready', 900)
      await showSection(p, 'Tickets')
    },
    focus: '::-p-text(Combinar: +1)',
  },
  { name: 'evo-passives', steps: (p) => tap(p, '.ranch-passive-count', 900) },
  { name: 'evo-bag', steps: (p) => openMenu(p, 'Mochila'), focus: '.bag-group' },
  // Ganar dinero
  { name: 'money-run', scenario: { run: true }, steps: routeBattle, focus: '.top-bar .currency' },
  { name: 'money-routes', steps: toRoute, focus: '.route-row:nth-child(4)' },
  {
    name: 'money-expedition',
    steps: async (p) => {
      await toRouteTab(p, 'Expediciones')
      await tap(p, '.route-list .route-row.tappable')
    },
    focus: '.route-start .segmented',
  },
  { name: 'money-gift', steps: (p) => openMenu(p, 'Obsequio diario'), focus: '.gift-days' },
  ...GUIDE_SHOTS,
]
