import { GymId } from '../gyms'
import { POKEMON } from '../pokemon'
import { Potion } from '../potions'
import { RaidTier } from '../raidBosses'
import { TrainerId } from '../trainers'
import { asset, Biome, boss, chain, enc, fork, NodeKind, raidBoss, RouteId, type Route } from './mapCommon'
import { starLevel, starMinHp, starNoPassives, starPassives, starSeeAll, starType, starWith } from './routeStarGoals'

// Kanto, de Ciudad Azulona a Ciudad Azafrán: gimnasios de Erika, Koga y Sabrina, la Torre Pokémon, las rutas de la
// pesca y la Ciclovía, la Zona Safari, Silph S. A. y, aparte, la Central Eléctrica (Zapdos). Sigue en kantoEndMaps.ts.

const ciudadAzulona = asset(new URL('../../assets/routes/celadon-city.webp', import.meta.url))
const puebloLavanda = asset(new URL('../../assets/routes/lavender-town.webp', import.meta.url))
const city = asset(new URL('../../assets/scenery/city.png', import.meta.url))
const ciudadCarmin = asset(new URL('../../assets/routes/vermilion-city.webp', import.meta.url))
const dampcave = asset(new URL('../../assets/scenery/dampcave.png', import.meta.url))
const meadow = asset(new URL('../../assets/scenery/meadow.png', import.meta.url))
const route6 = asset(new URL('../../assets/routes/route-6.webp', import.meta.url))
const viridianForest = asset(new URL('../../assets/routes/viridian-forest.webp', import.meta.url))

export const KANTO_LATE: Route[] = [
  {
    id: RouteId.GimnasioAzulona,
    name: 'Gimnasio de Ciudad Azulona',
    description: 'Erika, la líder de planta, te espera entre flores. Ganarle da la Medalla Arcoíris.',
    biome: Biome.PewterCity,
    backdrop: { image: meadow, focusY: 60 },
    levels: [66, 68],
    encounters: [],
    reward: { tickets: 6, money: 9000, exp: 6000 },
    stars: [starType('fire'), starNoPassives()],
    unlocks: RouteId.TorrePokemon,
    nodes: chain(
      { id: 's', name: 'Entrada del gimnasio', kind: NodeKind.Start, steps: 0 },
      { id: 'g', name: 'Erika', kind: NodeKind.Gym, steps: 20, gym: GymId.Azulona },
    ),
  },
  {
    // Siete plantas de fantasmas en Pueblo Lavanda; arriba, el espíritu de Marowak
    id: RouteId.TorrePokemon,
    name: 'Torre Pokémon',
    description: 'La torre de Pueblo Lavanda: fantasmas en cada planta y, arriba, un espíritu que no descansa.',
    biome: Biome.Cave,
    backdrop: { image: puebloLavanda, focusY: 37 },
    levels: [66, 70],
    maxLevel: 85,
    encounters: enc([POKEMON.Gastly, 30], [POKEMON.Haunter, 20], [POKEMON.Cubone, 20], [POKEMON.Zubat, 15], [POKEMON.Golbat, 10], [POKEMON.Marowak, 5]),
    reward: { tickets: 5, money: 7000, exp: 6200 },
    stars: [starPassives('dark', 'normal'), starMinHp(40)],
    unlocks: RouteId.Ruta12,
    nodes: chain(
      { id: 's', name: 'Entrada de la Torre', kind: NodeKind.Start, steps: 0 },
      { id: 'a', name: 'Primera planta', kind: NodeKind.Wild, steps: 40, statMult: 1.2 },
      { id: 'b', name: 'Segunda planta', kind: NodeKind.Wild, steps: 50, levelBonus: 1, statMult: 1.2 },
      { id: 'p1', name: 'Altar de la entrada', kind: NodeKind.Heal, steps: 20, potion: Potion.SuperPotion },
      fork(
        {
          label: 'Escaleras',
          hint: 'Un recluta Rocket corta el paso',
          stops: [
            { id: 'c', name: 'Tercera planta', kind: NodeKind.Wild, steps: 50, levelBonus: 2, statMult: 1.3 },
            { id: 't', name: 'Recluta de la cuarta planta', kind: NodeKind.Trainer, steps: 40, trainer: TrainerId.ReclutaRocketTorre },
          ],
        },
        {
          label: 'Sala de las tumbas',
          hint: 'Sin entrenadores, pero llena de fantasmas',
          stops: [
            { id: 'c2', name: 'Sala de las tumbas', kind: NodeKind.Wild, steps: 50, levelBonus: 3, statMult: 1.4, encounters: enc([POKEMON.Gastly, 40], [POKEMON.Haunter, 35], [POKEMON.Cubone, 25]) },
            { id: 'c3', name: 'Tumbas antiguas', kind: NodeKind.Wild, steps: 40, levelBonus: 3, statMult: 1.4, encounters: enc([POKEMON.Haunter, 45], [POKEMON.Cubone, 35], [POKEMON.Marowak, 20]) },
          ],
        },
      ),
      { id: 'p2', name: 'Incienso purificador', kind: NodeKind.Heal, steps: 20, potion: Potion.HyperPotion },
      { id: 'd', name: 'Sexta planta', kind: NodeKind.Wild, steps: 50, levelBonus: 3, statMult: 1.4 },
      { id: 'z', name: 'Espíritu de Marowak', kind: NodeKind.Boss, steps: 60, statMult: 2.2, boss: boss(POKEMON.Marowak, 70, [{ type: 'ghost', level: 2 }, { type: 'ground', level: 2 }]) },
    ),
  },
  {
    // De Lavanda a Fucsia: por la costa con los pescadores o por la Ciclovía
    id: RouteId.Ruta12,
    name: 'Rutas 12 a 18',
    description: 'Dos caminos a Ciudad Fucsia: la costa de los pescadores o la Ciclovía. Al final, un Snorlax dormido.',
    biome: Biome.Meadow,
    backdrop: { image: route6, focusY: 50 },
    levels: [68, 72],
    maxLevel: 85,
    encounters: enc([POKEMON.Oddish, 20], [POKEMON.Gloom, 15], [POKEMON.Venonat, 20], [POKEMON.Venomoth, 10], [POKEMON.Pidgeotto, 15], [POKEMON.Swablu, 15], [POKEMON.Exeggcute, 5]),
    reward: { tickets: 5, money: 7500, exp: 6500 },
    stars: [starWith(POKEMON.Snorlax), starSeeAll()],
    unlocks: RouteId.ZonaSafari,
    nodes: chain(
      { id: 's', name: 'Puente de Lavanda', kind: NodeKind.Start, steps: 0 },
      { id: 'a', name: 'Muelle de la Ruta 12', kind: NodeKind.Wild, steps: 50, statMult: 1.2, encounters: enc([POKEMON.Magikarp, 25], [POKEMON.Goldeen, 25], [POKEMON.Seaking, 10], [POKEMON.Krabby, 20], [POKEMON.Kingler, 5], [POKEMON.Tentacool, 15]) },
      fork(
        {
          label: 'Ruta de la Pesca',
          hint: 'Rutas 13 a 15: un pescador y Pokémon planta',
          stops: [
            { id: 't', name: 'Pescador del muelle', kind: NodeKind.Trainer, steps: 30, trainer: TrainerId.PescadorRuta12 },
            { id: 'b', name: 'Laberinto de vallas', kind: NodeKind.Wild, steps: 60, levelBonus: 1, statMult: 1.3 },
            { id: 'c', name: 'Ruta 15', kind: NodeKind.Wild, steps: 60, levelBonus: 2, statMult: 1.3 },
          ],
        },
        {
          label: 'Ciclovía',
          hint: 'Rutas 16 a 18: cuesta abajo, un ornitólogo y Pokémon de asfalto',
          stops: [
            { id: 'b2', name: 'Ciclovía', kind: NodeKind.Wild, steps: 50, levelBonus: 1, statMult: 1.3, encounters: enc([POKEMON.Doduo, 25], [POKEMON.Dodrio, 5], [POKEMON.Raticate, 20], [POKEMON.Fearow, 15], [POKEMON.Grimer, 15], [POKEMON.Muk, 5], [POKEMON.Spearow, 15]) },
            { id: 't2', name: 'Ornitólogo de la Ciclovía', kind: NodeKind.Trainer, steps: 40, trainer: TrainerId.OrnitologoCiclovia },
            { id: 'c2', name: 'Bajada de la Ciclovía', kind: NodeKind.Wild, steps: 40, levelBonus: 2, statMult: 1.4, encounters: enc([POKEMON.Doduo, 30], [POKEMON.Raticate, 25], [POKEMON.Fearow, 20], [POKEMON.Grimer, 20], [POKEMON.Muk, 5]) },
          ],
        },
      ),
      { id: 'p1', name: 'Casa de descanso', kind: NodeKind.Heal, steps: 20, potion: Potion.SuperPotion },
      { id: 'z', name: 'Snorlax dormido', kind: NodeKind.Raid, steps: 50, boss: raidBoss(POKEMON.Snorlax, 74, RaidTier.High) },
    ),
  },
  {
    id: RouteId.ZonaSafari,
    name: 'Ciudad Fucsia y Zona Safari',
    description: 'La reserva de Ciudad Fucsia: Pokémon que no salen en ningún otro sitio de Kanto.',
    biome: Biome.Forest,
    backdrop: { image: viridianForest, focusY: 50 },
    levels: [70, 74],
    maxLevel: 90,
    encounters: enc(
      [POKEMON.Nidorina, 15], [POKEMON.Nidorino, 15], [POKEMON.Rhyhorn, 15], [POKEMON.Exeggcute, 15], [POKEMON.Paras, 10], [POKEMON.Venonat, 10],
      [POKEMON.Doduo, 9], [POKEMON.Trapinch, 5], [POKEMON.Dratini, 3], [POKEMON.Kangaskhan, 1], [POKEMON.Scyther, 1], [POKEMON.Pinsir, 1],
    ),
    reward: { tickets: 6, money: 8000, exp: 6800 },
    stars: [starType('bug'), starSeeAll()],
    unlocks: RouteId.GimnasioFucsia,
    nodes: chain(
      { id: 's', name: 'Ciudad Fucsia', kind: NodeKind.Start, steps: 0 },
      { id: 'a', name: 'Puerta de la Zona Safari', kind: NodeKind.Wild, steps: 50, statMult: 1.2 },
      fork(
        {
          label: 'Zona este',
          hint: 'Un campista; Kangaskhan y Scyther',
          stops: [
            { id: 'b', name: 'Área este', kind: NodeKind.Wild, steps: 60, levelBonus: 1, statMult: 1.3, encounters: enc([POKEMON.Nidorina, 20], [POKEMON.Nidorino, 20], [POKEMON.Rhyhorn, 20], [POKEMON.Exeggcute, 20], [POKEMON.Paras, 10], [POKEMON.Kangaskhan, 5], [POKEMON.Scyther, 5]) },
            { id: 't', name: 'Campista del Safari', kind: NodeKind.Trainer, steps: 40, trainer: TrainerId.CampistaSafari },
          ],
        },
        {
          label: 'Zona oeste',
          hint: 'El lago: Dratini, Trapinch y Pinsir',
          stops: [
            { id: 'b2', name: 'Área oeste', kind: NodeKind.Wild, steps: 50, levelBonus: 1, statMult: 1.3, encounters: enc([POKEMON.Doduo, 20], [POKEMON.Venonat, 20], [POKEMON.Trapinch, 20], [POKEMON.Exeggcute, 15], [POKEMON.Rhyhorn, 15], [POKEMON.Pinsir, 5], [POKEMON.Dratini, 5]) },
            { id: 'c2', name: 'Lago del Safari', kind: NodeKind.Wild, steps: 50, levelBonus: 2, statMult: 1.3, encounters: enc([POKEMON.Magikarp, 40], [POKEMON.Goldeen, 30], [POKEMON.Seaking, 15], [POKEMON.Dratini, 10], [POKEMON.Krabby, 5]) },
          ],
        },
      ),
      { id: 'p1', name: 'Casa de descanso', kind: NodeKind.Heal, steps: 20, potion: Potion.SuperPotion },
      { id: 'd', name: 'Zona central', kind: NodeKind.Wild, steps: 60, levelBonus: 2, statMult: 1.4 },
      { id: 'z', name: 'Kangaskhan guardiana', kind: NodeKind.Boss, steps: 60, statMult: 2, boss: boss(POKEMON.Kangaskhan, 75, [{ type: 'normal', level: 2 }]) },
    ),
  },
  {
    id: RouteId.GimnasioFucsia,
    name: 'Gimnasio de Ciudad Fucsia',
    description: 'Koga, el ninja del veneno, esconde su gimnasio tras paredes invisibles. Ganarle da la Medalla Alma.',
    biome: Biome.Forest,
    backdrop: { image: dampcave, focusY: 60 },
    levels: [74, 76],
    encounters: [],
    reward: { tickets: 6, money: 10000, exp: 7000 },
    stars: [starType('psychic'), starLevel()],
    unlocks: RouteId.SilphSA,
    nodes: chain(
      { id: 's', name: 'Entrada del gimnasio', kind: NodeKind.Start, steps: 0 },
      { id: 'g', name: 'Koga', kind: NodeKind.Gym, steps: 20, gym: GymId.Fucsia },
    ),
  },
  {
    // El Team Rocket ha tomado la sede de Silph en Ciudad Azafrán; Giovanni espera en el despacho del presidente
    id: RouteId.SilphSA,
    name: 'Silph S. A.',
    description: 'El Team Rocket ha tomado el rascacielos de Ciudad Azafrán. Giovanni espera arriba.',
    biome: Biome.Lab,
    backdrop: { image: ciudadAzulona, focusY: 50 },
    levels: [75, 79],
    maxLevel: 90,
    encounters: enc([POKEMON.Magnemite, 20], [POKEMON.Voltorb, 20], [POKEMON.Porygon, 15], [POKEMON.Abra, 15], [POKEMON.Drowzee, 15], [POKEMON.Kadabra, 5], [POKEMON.Hypno, 5], [POKEMON.Magneton, 5]),
    reward: { tickets: 6, money: 9000, exp: 7200 },
    stars: [starNoPassives(), starMinHp(35)],
    unlocks: RouteId.GimnasioAzafran,
    alsoUnlocks: [RouteId.CentralElectrica],
    nodes: chain(
      { id: 's', name: 'Vestíbulo', kind: NodeKind.Start, steps: 0 },
      { id: 'a', name: 'Segunda planta', kind: NodeKind.Wild, steps: 40, statMult: 1.3 },
      { id: 't1', name: 'Recluta del ascensor', kind: NodeKind.Trainer, steps: 30, trainer: TrainerId.ReclutaRocketSilph1 },
      fork(
        {
          label: 'Ascensor',
          hint: 'Más corto: sube directo al laboratorio',
          stops: [
            { id: 'b', name: 'Laboratorio de la quinta planta', kind: NodeKind.Wild, steps: 40, levelBonus: 2, statMult: 1.4, encounters: enc([POKEMON.Porygon, 30], [POKEMON.Magnemite, 25], [POKEMON.Magneton, 15], [POKEMON.Voltorb, 20], [POKEMON.Electrode, 10]) },
          ],
        },
        {
          label: 'Escaleras',
          hint: 'Más largo, con otra recluta',
          stops: [
            { id: 'b2', name: 'Séptima planta', kind: NodeKind.Wild, steps: 40, levelBonus: 1, statMult: 1.3 },
            { id: 't2', name: 'Recluta de las escaleras', kind: NodeKind.Trainer, steps: 30, trainer: TrainerId.ReclutaRocketSilph2 },
            { id: 'b3', name: 'Novena planta', kind: NodeKind.Wild, steps: 40, levelBonus: 1, statMult: 1.3 },
          ],
        },
      ),
      { id: 'p1', name: 'Enfermera de Silph', kind: NodeKind.Heal, steps: 20, potion: Potion.HyperPotion },
      { id: 'c', name: 'Décima planta', kind: NodeKind.Wild, steps: 40, levelBonus: 2, statMult: 1.4, encounters: enc([POKEMON.Abra, 25], [POKEMON.Kadabra, 15], [POKEMON.Drowzee, 25], [POKEMON.Hypno, 15], [POKEMON.Porygon, 15], [POKEMON.MrMime, 5]) },
      { id: 'z', name: 'Despacho del presidente', kind: NodeKind.Trainer, steps: 40, trainer: TrainerId.GiovanniSilph },
    ),
  },
  {
    // Opcional, desde Silph S. A.: la central abandonada donde anida Zapdos
    id: RouteId.CentralElectrica,
    name: 'Central Eléctrica',
    description: 'Una central abandonada llena de chispas. En lo más hondo, un pájaro de trueno.',
    biome: Biome.Lab,
    backdrop: { image: ciudadCarmin, focusY: 30 },
    levels: [78, 82],
    maxLevel: 95,
    encounters: enc([POKEMON.Pikachu, 25], [POKEMON.Voltorb, 25], [POKEMON.Magnemite, 25], [POKEMON.Magneton, 10], [POKEMON.Raichu, 5], [POKEMON.Electrode, 5], [POKEMON.Electabuzz, 5]),
    reward: { tickets: 8, money: 12000, exp: 8000 },
    stars: [starType('ground'), starMinHp(40)],
    nodes: chain(
      { id: 's', name: 'Entrada de la central', kind: NodeKind.Start, steps: 0 },
      { id: 'a', name: 'Sala de turbinas', kind: NodeKind.Wild, steps: 50, statMult: 1.3 },
      { id: 'b', name: 'Cables pelados', kind: NodeKind.Wild, steps: 50, levelBonus: 2, statMult: 1.4 },
      { id: 'p1', name: 'Cuarto de control', kind: NodeKind.Heal, steps: 20, potion: Potion.HyperPotion },
      { id: 'c', name: 'Generador', kind: NodeKind.Wild, steps: 50, levelBonus: 3, statMult: 1.5 },
      { id: 'z', name: 'Nido de Zapdos', kind: NodeKind.Raid, steps: 60, boss: raidBoss(POKEMON.Zapdos, 85, RaidTier.High) },
    ),
  },
  {
    id: RouteId.GimnasioAzafran,
    name: 'Gimnasio de Ciudad Azafrán',
    description: 'Sabrina, la líder psíquica, ve venir cada ataque. Ganarle da la Medalla Pantano.',
    biome: Biome.Lab,
    backdrop: { image: city, focusY: 60 },
    levels: [79, 81],
    encounters: [],
    reward: { tickets: 6, money: 11000, exp: 7600 },
    stars: [starType('dark'), starPassives('bug', 'ghost')],
    unlocks: RouteId.IslasEspuma,
    nodes: chain(
      { id: 's', name: 'Entrada del gimnasio', kind: NodeKind.Start, steps: 0 },
      { id: 'g', name: 'Sabrina', kind: NodeKind.Gym, steps: 20, gym: GymId.Azafran },
    ),
  },
]
