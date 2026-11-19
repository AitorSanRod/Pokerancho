import { GymId } from '../gyms'
import { POKEMON } from '../pokemon'
import { Potion } from '../potions'
import { RaidTier } from '../raidBosses'
import { TrainerId } from '../trainers'
import { asset, Biome, boss, chain, enc, fork, NodeKind, raidBoss, RouteId, type Route } from './mapCommon'
import { starLevel, starMinHp, starNoPassives, starPassives, starSeeAll, starType, starWith } from './routeStarGoals'

// Kanto, de las Islas Espuma a la Liga: gimnasios de Blaine y Giovanni, Isla Canela, la Calle Victoria y el Alto
// Mando y, aparte, las rutas de los legendarios (Articuno, Moltres, Mewtwo y Mew). Empieza en kantoLateMaps.ts.

const ruta19 = asset(new URL('../../assets/routes/route-19.webp', import.meta.url))

/** Las rutas opcionales de los legendarios: los salvajes, una cura y el legendario como jefe comunitario al final */
function legendRoute(fields: Omit<Route, 'encounters' | 'nodes'> & { wild: Route['encounters']; names: [start: string, first: string, second: string, rest: string, last: string, lair: string]; legend: number; legendLevel: number }): Route {
  const { wild, names, legend, legendLevel, ...route } = fields
  const [start, first, second, rest, last, lair] = names
  return {
    ...route,
    encounters: wild,
    nodes: chain(
      { id: 's', name: start, kind: NodeKind.Start, steps: 0 },
      { id: 'a', name: first, kind: NodeKind.Wild, steps: 50, statMult: 1.4 },
      { id: 'b', name: second, kind: NodeKind.Wild, steps: 50, levelBonus: 2, statMult: 1.5 },
      { id: 'p1', name: rest, kind: NodeKind.Heal, steps: 20, potion: Potion.HyperPotion },
      { id: 'c', name: last, kind: NodeKind.Wild, steps: 50, levelBonus: 3, statMult: 1.5 },
      { id: 'z', name: lair, kind: NodeKind.Raid, steps: 60, boss: raidBoss(legend, legendLevel, RaidTier.High) },
    ),
  }
}
const city = asset(new URL('../../assets/scenery/city.png', import.meta.url))
const ciudadCarmin = asset(new URL('../../assets/routes/vermilion-city.webp', import.meta.url))
const ciudadCeleste = asset(new URL('../../assets/routes/cerulean-city.webp', import.meta.url))
const desert = asset(new URL('../../assets/scenery/desert.png', import.meta.url))
const mtMoon = asset(new URL('../../assets/routes/mt-moon.webp', import.meta.url))
const tunelRoca = asset(new URL('../../assets/routes/rock-tunnel.webp', import.meta.url))
const viridianForest = asset(new URL('../../assets/routes/viridian-forest.webp', import.meta.url))
const volcanocave = asset(new URL('../../assets/scenery/volcanocave.png', import.meta.url))

export const KANTO_END: Route[] = [
  {
    id: RouteId.IslasEspuma,
    name: 'Rutas 19 y 20',
    description: 'A nado desde Fucsia hasta Isla Canela, pasando por las heladas Islas Espuma.',
    biome: Biome.Sea,
    backdrop: { image: ruta19, focusY: 50 },
    levels: [80, 84],
    maxLevel: 95,
    encounters: enc([POKEMON.Tentacool, 30], [POKEMON.Tentacruel, 5], [POKEMON.Horsea, 15], [POKEMON.Seadra, 5], [POKEMON.Staryu, 15], [POKEMON.Shellder, 10], [POKEMON.Seel, 10], [POKEMON.Krabby, 10]),
    reward: { tickets: 6, money: 10000, exp: 7800 },
    stars: [starType('electric'), starSeeAll()],
    unlocks: RouteId.IslaCanela,
    alsoUnlocks: [RouteId.CuevaEspuma],
    nodes: chain(
      { id: 's', name: 'Playa de Fucsia', kind: NodeKind.Start, steps: 0 },
      { id: 'a', name: 'Ruta 19', kind: NodeKind.Wild, steps: 50, statMult: 1.3 },
      { id: 't1', name: 'Nadador de la Ruta 19', kind: NodeKind.Trainer, steps: 40, trainer: TrainerId.NadadorEspuma },
      fork(
        {
          label: 'Mar abierto',
          hint: 'Rodea las islas: una nadadora y corrientes',
          stops: [
            { id: 'b', name: 'Corrientes de la Ruta 20', kind: NodeKind.Wild, steps: 60, levelBonus: 2, statMult: 1.4 },
            { id: 't2', name: 'Nadadora de la Ruta 20', kind: NodeKind.Trainer, steps: 40, trainer: TrainerId.NadadoraEspuma },
          ],
        },
        {
          label: 'Islas Espuma',
          hint: 'Por dentro de las islas: Seel, Slowpoke y Jynx',
          stops: [
            { id: 'b2', name: 'Cueva de las Islas Espuma', kind: NodeKind.Wild, steps: 50, levelBonus: 2, statMult: 1.4, encounters: enc([POKEMON.Seel, 30], [POKEMON.Dewgong, 10], [POKEMON.Shellder, 20], [POKEMON.Slowpoke, 20], [POKEMON.Slowbro, 10], [POKEMON.Jynx, 5], [POKEMON.Golduck, 5]) },
            { id: 'c2', name: 'Pozas heladas', kind: NodeKind.Wild, steps: 50, levelBonus: 3, statMult: 1.5, encounters: enc([POKEMON.Seel, 35], [POKEMON.Slowpoke, 30], [POKEMON.Dewgong, 15], [POKEMON.Slowbro, 15], [POKEMON.Jynx, 5]) },
          ],
        },
      ),
      { id: 'p1', name: 'Roca de descanso', kind: NodeKind.Heal, steps: 20, potion: Potion.HyperPotion },
      { id: 'c', name: 'Llegada a Isla Canela', kind: NodeKind.Wild, steps: 50, levelBonus: 3, statMult: 1.4 },
      { id: 'z', name: 'Cloyster de la orilla', kind: NodeKind.Boss, steps: 60, statMult: 2.2, boss: boss(POKEMON.Cloyster, 85, [{ type: 'water', level: 2 }, { type: 'ice', level: 2 }]) },
    ),
  },
  legendRoute({
    id: RouteId.CuevaEspuma,
    name: 'Islas Espuma',
    description: 'Bajo las Islas Espuma, entre hielo y corrientes, duerme el pájaro de hielo.',
    biome: Biome.Cave,
    backdrop: { image: ruta19, focusY: 50 },
    levels: [83, 87],
    maxLevel: 100,
    reward: { tickets: 8, money: 13000, exp: 8400 },
    stars: [starType('fire'), starSeeAll()],
    wild: enc([POKEMON.Seel, 25], [POKEMON.Dewgong, 10], [POKEMON.Shellder, 20], [POKEMON.Cloyster, 5], [POKEMON.Zubat, 10], [POKEMON.Golbat, 10], [POKEMON.Slowpoke, 10], [POKEMON.Jynx, 5], [POKEMON.Glaceon, 5]),
    names: ['Entrada helada', 'Galería de hielo', 'Corriente subterránea', 'Hueco al abrigo', 'Lago helado', 'Guarida de Articuno'],
    legend: POKEMON.Articuno,
    legendLevel: 88,
  }),
  {
    id: RouteId.IslaCanela,
    name: 'Isla Canela y Mansión Pokémon',
    description: 'Un volcán, una mansión quemada llena de diarios y el laboratorio que revive fósiles.',
    biome: Biome.Lab,
    backdrop: { image: ciudadCarmin, focusY: 30 },
    levels: [83, 86],
    maxLevel: 100,
    encounters: enc([POKEMON.Ponyta, 15], [POKEMON.Growlithe, 15], [POKEMON.Vulpix, 15], [POKEMON.Koffing, 15], [POKEMON.Grimer, 15], [POKEMON.Ditto, 10], [POKEMON.Magmar, 10], [POKEMON.Weezing, 5]),
    reward: { tickets: 6, money: 11000, exp: 8200 },
    stars: [starWith(POKEMON.Squirtle), starSeeAll()],
    unlocks: RouteId.GimnasioCanela,
    alsoUnlocks: [RouteId.MonteAscuas],
    nodes: chain(
      { id: 's', name: 'Puerto de Isla Canela', kind: NodeKind.Start, steps: 0 },
      { id: 'a', name: 'Playa volcánica', kind: NodeKind.Wild, steps: 50, statMult: 1.3 },
      fork(
        {
          label: 'Mansión Pokémon',
          hint: 'Sin entrenadores: Ditto, Koffing y Grimer',
          stops: [
            { id: 'b', name: 'Vestíbulo de la mansión', kind: NodeKind.Wild, steps: 50, levelBonus: 1, statMult: 1.4, encounters: enc([POKEMON.Koffing, 25], [POKEMON.Weezing, 10], [POKEMON.Grimer, 25], [POKEMON.Muk, 5], [POKEMON.Ditto, 20], [POKEMON.Ponyta, 15]) },
            { id: 'b3', name: 'Sala de los diarios', kind: NodeKind.Wild, steps: 50, levelBonus: 2, statMult: 1.5, encounters: enc([POKEMON.Ditto, 30], [POKEMON.Grimer, 25], [POKEMON.Koffing, 25], [POKEMON.Weezing, 15], [POKEMON.Muk, 5]) },
          ],
        },
        {
          label: 'Volcán',
          hint: 'Un montañero; Pokémon de fuego',
          stops: [
            { id: 'b2', name: 'Laderas del volcán', kind: NodeKind.Wild, steps: 50, levelBonus: 1, statMult: 1.4, encounters: enc([POKEMON.Ponyta, 25], [POKEMON.Rapidash, 5], [POKEMON.Growlithe, 25], [POKEMON.Vulpix, 25], [POKEMON.Magmar, 20]) },
            { id: 't', name: 'Montañero del volcán', kind: NodeKind.Trainer, steps: 40, trainer: TrainerId.MontaneroCanela },
          ],
        },
      ),
      { id: 'p1', name: 'Centro Pokémon', kind: NodeKind.Heal, steps: 20, potion: Potion.HyperPotion },
      { id: 'c', name: 'Laboratorio Pokémon', kind: NodeKind.Wild, steps: 50, levelBonus: 2, statMult: 1.4, encounters: enc([POKEMON.Kabuto, 25], [POKEMON.Omanyte, 25], [POKEMON.Ditto, 20], [POKEMON.Magmar, 15], [POKEMON.Koffing, 15]) },
      { id: 'z', name: 'Magmar del laboratorio', kind: NodeKind.Boss, steps: 60, statMult: 2.2, boss: boss(POKEMON.Magmar, 88, [{ type: 'fire', level: 2 }]) },
    ),
  },
  legendRoute({
    id: RouteId.MonteAscuas,
    name: 'Monte Ascuas',
    description: 'Un volcán humeante al otro lado del mar. En la cumbre arde el pájaro de fuego.',
    biome: Biome.MtMoon,
    backdrop: { image: mtMoon, focusY: 50 },
    levels: [86, 90],
    reward: { tickets: 8, money: 14000, exp: 8800 },
    stars: [starType('water'), starNoPassives()],
    wild: enc([POKEMON.Ponyta, 20], [POKEMON.Rapidash, 5], [POKEMON.Geodude, 15], [POKEMON.Graveler, 20], [POKEMON.Magmar, 15], [POKEMON.Growlithe, 15], [POKEMON.Vulpix, 10]),
    names: ['Falda del Monte Ascuas', 'Sendero de lava', 'Cráter humeante', 'Refugio de piedra', 'Cumbre del volcán', 'Nido de Moltres'],
    legend: POKEMON.Moltres,
    legendLevel: 92,
  }),
  {
    id: RouteId.GimnasioCanela,
    name: 'Gimnasio de Isla Canela',
    description: 'Blaine, el líder de fuego, te recibe con acertijos. Ganarle da la Medalla Volcán.',
    biome: Biome.Lab,
    backdrop: { image: volcanocave, focusY: 60 },
    levels: [86, 88],
    encounters: [],
    reward: { tickets: 7, money: 12000, exp: 8600 },
    stars: [starType('water'), starNoPassives()],
    unlocks: RouteId.GimnasioVerde,
    nodes: chain(
      { id: 's', name: 'Entrada del gimnasio', kind: NodeKind.Start, steps: 0 },
      { id: 'g', name: 'Blaine', kind: NodeKind.Gym, steps: 20, gym: GymId.Canela },
    ),
  },
  {
    id: RouteId.GimnasioVerde,
    name: 'Gimnasio de Ciudad Verde',
    description: 'El gimnasio que siempre estuvo cerrado: su líder es Giovanni. Ganarle da la Medalla Tierra.',
    biome: Biome.PewterCity,
    backdrop: { image: desert, focusY: 60 },
    levels: [88, 90],
    encounters: [],
    reward: { tickets: 7, money: 13000, exp: 9000 },
    stars: [starPassives('water', 'grass'), starLevel()],
    unlocks: RouteId.CalleVictoria,
    nodes: chain(
      { id: 's', name: 'Entrada del gimnasio', kind: NodeKind.Start, steps: 0 },
      { id: 'g', name: 'Giovanni', kind: NodeKind.Gym, steps: 20, gym: GymId.Verde },
    ),
  },
  {
    id: RouteId.CalleVictoria,
    name: 'Ruta 23 y Calle Victoria',
    description: 'Las puertas de las medallas y la cueva que lleva a la Meseta Añil. Solo pasan los mejores.',
    biome: Biome.Cave,
    backdrop: { image: tunelRoca, focusY: 12 },
    levels: [90, 94],
    maxLevel: 100,
    encounters: enc([POKEMON.Onix, 15], [POKEMON.Graveler, 20], [POKEMON.Machoke, 15], [POKEMON.Golbat, 15], [POKEMON.Marowak, 10], [POKEMON.Primeape, 10], [POKEMON.Dugtrio, 10], [POKEMON.Bagon, 3], [POKEMON.Rhydon, 2]),
    reward: { tickets: 7, money: 12000, exp: 9200 },
    stars: [starMinHp(50), starSeeAll()],
    unlocks: RouteId.AltoMando,
    nodes: chain(
      { id: 's', name: 'Puerta de las medallas', kind: NodeKind.Start, steps: 0 },
      { id: 'a', name: 'Ruta 23', kind: NodeKind.Wild, steps: 50, statMult: 1.3, encounters: enc([POKEMON.Fearow, 25], [POKEMON.Arbok, 20], [POKEMON.Sandslash, 20], [POKEMON.Primeape, 20], [POKEMON.Raticate, 15]) },
      { id: 't1', name: 'Karateka de la Ruta 23', kind: NodeKind.Trainer, steps: 40, trainer: TrainerId.KaratekaVictoria },
      { id: 'p1', name: 'Última fuente', kind: NodeKind.Heal, steps: 20, potion: Potion.HyperPotion },
      fork(
        {
          label: 'Cueva',
          hint: 'Sin entrenadores, por dentro de la montaña',
          stops: [
            { id: 'b', name: 'Primera cueva', kind: NodeKind.Wild, steps: 50, levelBonus: 2, statMult: 1.4 },
            { id: 'b3', name: 'Rocas de fuerza', kind: NodeKind.Wild, steps: 50, levelBonus: 3, statMult: 1.5 },
          ],
        },
        {
          label: 'Riscos',
          hint: 'Por fuera: un montañero y Skarmory',
          stops: [
            { id: 'b2', name: 'Riscos de la Calle Victoria', kind: NodeKind.Wild, steps: 50, levelBonus: 2, statMult: 1.4, encounters: enc([POKEMON.Skarmory, 20], [POKEMON.Fearow, 20], [POKEMON.Golbat, 20], [POKEMON.Primeape, 20], [POKEMON.Marowak, 20]) },
            { id: 't2', name: 'Montañero de los riscos', kind: NodeKind.Trainer, steps: 40, trainer: TrainerId.MontaneroVictoria },
          ],
        },
      ),
      { id: 'p2', name: 'Claro de la cueva', kind: NodeKind.Heal, steps: 20, potion: Potion.HyperPotion },
      { id: 'c', name: 'Salida a la Meseta Añil', kind: NodeKind.Wild, steps: 50, levelBonus: 3, statMult: 1.5 },
      { id: 'z', name: 'Rhydon del túnel', kind: NodeKind.Boss, steps: 60, statMult: 2.3, boss: boss(POKEMON.Rhydon, 95, [{ type: 'ground', level: 3 }, { type: 'rock', level: 2 }]) },
    ),
  },
  {
    // Los cuatro del Alto Mando y el Campeón, uno tras otro, con una cura completa entre cada combate
    id: RouteId.AltoMando,
    name: 'Alto Mando',
    description: 'La Liga de la Meseta Añil: Lorelei, Bruno, Agatha, Lance y, al final, el Campeón. Sin salir entre medias.',
    biome: Biome.Lab,
    backdrop: { image: city, focusY: 60 },
    levels: [94, 100],
    encounters: [],
    reward: { tickets: 15, money: 30000, exp: 15000 },
    stars: [starNoPassives(), starMinHp(25)],
    alsoUnlocks: [RouteId.CuevaCeleste, RouteId.IslaLejana],
    nodes: chain(
      { id: 's', name: 'Recepción de la Liga', kind: NodeKind.Start, steps: 0 },
      { id: 'g1', name: 'Lorelei', kind: NodeKind.Gym, steps: 20, gym: GymId.Lorelei },
      { id: 'p1', name: 'Sala de descanso', kind: NodeKind.Heal, steps: 15, potion: Potion.FullRestore },
      { id: 'g2', name: 'Bruno', kind: NodeKind.Gym, steps: 20, gym: GymId.Bruno },
      { id: 'p2', name: 'Sala de descanso', kind: NodeKind.Heal, steps: 15, potion: Potion.FullRestore },
      { id: 'g3', name: 'Agatha', kind: NodeKind.Gym, steps: 20, gym: GymId.Agatha },
      { id: 'p3', name: 'Sala de descanso', kind: NodeKind.Heal, steps: 15, potion: Potion.FullRestore },
      { id: 'g4', name: 'Lance', kind: NodeKind.Gym, steps: 20, gym: GymId.Lance },
      { id: 'p4', name: 'Antesala del Campeón', kind: NodeKind.Heal, steps: 15, potion: Potion.FullRestore },
      { id: 'g5', name: 'Campeón', kind: NodeKind.Gym, steps: 20, gym: GymId.Campeon },
    ),
  },
  legendRoute({
    id: RouteId.CuevaCeleste,
    name: 'Cueva Celeste',
    description: 'La cueva junto a Ciudad Celeste, cerrada hasta ser Campeón. Dentro espera el Pokémon más fuerte.',
    biome: Biome.Cave,
    backdrop: { image: ciudadCeleste, focusY: 45 },
    levels: [94, 97],
    reward: { tickets: 10, money: 20000, exp: 12000 },
    stars: [starPassives('dark', 'bug', 'ghost'), starMinHp(30)],
    wild: enc([POKEMON.Golbat, 20], [POKEMON.Parasect, 15], [POKEMON.Kadabra, 15], [POKEMON.Magneton, 15], [POKEMON.Ditto, 10], [POKEMON.Raichu, 10], [POKEMON.Electrode, 5], [POKEMON.Chansey, 5], [POKEMON.Rhydon, 5]),
    names: ['Entrada de la cueva', 'Primer nivel', 'Segundo nivel', 'Charca escondida', 'Sótano', 'Fondo de la cueva'],
    legend: POKEMON.Mewtwo,
    legendLevel: 100,
  }),
  legendRoute({
    id: RouteId.IslaLejana,
    name: 'Isla Lejana',
    description: 'Una isla que no sale en los mapas. Entre la hierba juega un Pokémon que nadie ha visto.',
    biome: Biome.Forest,
    backdrop: { image: viridianForest, focusY: 50 },
    levels: [94, 97],
    reward: { tickets: 10, money: 20000, exp: 12000 },
    stars: [starWith(POKEMON.Eevee), starSeeAll()],
    wild: enc([POKEMON.Exeggcute, 20], [POKEMON.Oddish, 20], [POKEMON.Bellsprout, 20], [POKEMON.Eevee, 20], [POKEMON.Leafeon, 10], [POKEMON.Sylveon, 10]),
    names: ['Playa de la isla', 'Hierba alta', 'Claro escondido', 'Manantial', 'Corazón de la isla', 'Árbol de Mew'],
    legend: POKEMON.Mew,
    legendLevel: 100,
  }),
]
