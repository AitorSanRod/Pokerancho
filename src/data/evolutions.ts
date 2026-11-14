import { POKEMON } from './pokemon'
import { Stone } from './stones'

/** Cómo se llega a una evolución: al alcanzar un nivel o gastando una piedra (a cualquier nivel) */
export type Evolution = { into: number; level: number; stone?: undefined } | { into: number; stone: Stone; level?: undefined }

const atLevel = (into: number, level: number): Evolution => ({ into, level })
const withStone = (into: number, stone: Stone): Evolution => ({ into, stone })

/**
 * Evoluciones: especie → sus evoluciones. Solo las que llevan a una especie del juego (sin Crobat, Steelix, Scizor…).
 * Niveles de los juegos, sin sus condiciones extra (Pangoro no pide un siniestro en el equipo); las de intercambio
 * (Alakazam, Machamp, Golem, Gengar), las de amistad (Togetic) y las de condición rara (Kingambit)
 * llevan uno propio, Milotic, la Escama Bella, y Porygon2 y Porygon-Z, la Mejora y el Disco Extraño. Con varias opciones (Eevee,
 * Charcadet, Kirlia), el jugador elige.
 */
const EVOLUTIONS: Record<number, Evolution[]> = {
  [POKEMON.Bulbasaur]: [atLevel(POKEMON.Ivysaur, 16)],
  [POKEMON.Ivysaur]: [atLevel(POKEMON.Venusaur, 32)],
  [POKEMON.Charmander]: [atLevel(POKEMON.Charmeleon, 16)],
  [POKEMON.Charmeleon]: [atLevel(POKEMON.Charizard, 36)],
  [POKEMON.Squirtle]: [atLevel(POKEMON.Wartortle, 16)],
  [POKEMON.Wartortle]: [atLevel(POKEMON.Blastoise, 36)],
  [POKEMON.Caterpie]: [atLevel(POKEMON.Metapod, 7)],
  [POKEMON.Metapod]: [atLevel(POKEMON.Butterfree, 10)],
  [POKEMON.Weedle]: [atLevel(POKEMON.Kakuna, 7)],
  [POKEMON.Kakuna]: [atLevel(POKEMON.Beedrill, 10)],
  [POKEMON.Pidgey]: [atLevel(POKEMON.Pidgeotto, 18)],
  [POKEMON.Pidgeotto]: [atLevel(POKEMON.Pidgeot, 36)],
  [POKEMON.Rattata]: [atLevel(POKEMON.Raticate, 20)],
  [POKEMON.Spearow]: [atLevel(POKEMON.Fearow, 20)],
  [POKEMON.Ekans]: [atLevel(POKEMON.Arbok, 22)],
  [POKEMON.Pikachu]: [withStone(POKEMON.Raichu, Stone.Thunder)],
  [POKEMON.Sandshrew]: [atLevel(POKEMON.Sandslash, 22)],
  [POKEMON.NidoranF]: [atLevel(POKEMON.Nidorina, 16)],
  [POKEMON.Nidorina]: [withStone(POKEMON.Nidoqueen, Stone.Moon)],
  [POKEMON.NidoranM]: [atLevel(POKEMON.Nidorino, 16)],
  [POKEMON.Nidorino]: [withStone(POKEMON.Nidoking, Stone.Moon)],
  [POKEMON.Clefairy]: [withStone(POKEMON.Clefable, Stone.Moon)],
  [POKEMON.Vulpix]: [withStone(POKEMON.Ninetales, Stone.Fire)],
  [POKEMON.Jigglypuff]: [withStone(POKEMON.Wigglytuff, Stone.Moon)],
  [POKEMON.Zubat]: [atLevel(POKEMON.Golbat, 22)],
  [POKEMON.Oddish]: [atLevel(POKEMON.Gloom, 21)],
  [POKEMON.Gloom]: [withStone(POKEMON.Vileplume, Stone.Leaf)],
  [POKEMON.Paras]: [atLevel(POKEMON.Parasect, 24)],
  [POKEMON.Venonat]: [atLevel(POKEMON.Venomoth, 31)],
  [POKEMON.Diglett]: [atLevel(POKEMON.Dugtrio, 26)],
  [POKEMON.Meowth]: [atLevel(POKEMON.Persian, 28)],
  [POKEMON.Psyduck]: [atLevel(POKEMON.Golduck, 33)],
  [POKEMON.Mankey]: [atLevel(POKEMON.Primeape, 28)],
  [POKEMON.Growlithe]: [withStone(POKEMON.Arcanine, Stone.Fire)],
  [POKEMON.Poliwag]: [atLevel(POKEMON.Poliwhirl, 25)],
  [POKEMON.Poliwhirl]: [withStone(POKEMON.Poliwrath, Stone.Water)],
  [POKEMON.Abra]: [atLevel(POKEMON.Kadabra, 16)],
  [POKEMON.Kadabra]: [atLevel(POKEMON.Alakazam, 36)],
  [POKEMON.Machop]: [atLevel(POKEMON.Machoke, 28)],
  [POKEMON.Machoke]: [atLevel(POKEMON.Machamp, 40)],
  [POKEMON.Bellsprout]: [atLevel(POKEMON.Weepinbell, 21)],
  [POKEMON.Weepinbell]: [withStone(POKEMON.Victreebel, Stone.Leaf)],
  [POKEMON.Tentacool]: [atLevel(POKEMON.Tentacruel, 30)],
  [POKEMON.Geodude]: [atLevel(POKEMON.Graveler, 25)],
  [POKEMON.Graveler]: [atLevel(POKEMON.Golem, 40)],
  [POKEMON.Ponyta]: [atLevel(POKEMON.Rapidash, 40)],
  [POKEMON.Slowpoke]: [atLevel(POKEMON.Slowbro, 37)],
  [POKEMON.Magnemite]: [atLevel(POKEMON.Magneton, 30)],
  [POKEMON.Doduo]: [atLevel(POKEMON.Dodrio, 31)],
  [POKEMON.Seel]: [atLevel(POKEMON.Dewgong, 34)],
  [POKEMON.Grimer]: [atLevel(POKEMON.Muk, 38)],
  [POKEMON.Shellder]: [withStone(POKEMON.Cloyster, Stone.Water)],
  [POKEMON.Gastly]: [atLevel(POKEMON.Haunter, 25)],
  [POKEMON.Haunter]: [atLevel(POKEMON.Gengar, 38)],
  [POKEMON.Drowzee]: [atLevel(POKEMON.Hypno, 26)],
  [POKEMON.Krabby]: [atLevel(POKEMON.Kingler, 28)],
  [POKEMON.Voltorb]: [atLevel(POKEMON.Electrode, 30)],
  [POKEMON.Exeggcute]: [withStone(POKEMON.Exeggutor, Stone.Leaf)],
  [POKEMON.Cubone]: [atLevel(POKEMON.Marowak, 28)],
  [POKEMON.Koffing]: [atLevel(POKEMON.Weezing, 35)],
  [POKEMON.Rhyhorn]: [atLevel(POKEMON.Rhydon, 42)],
  [POKEMON.Horsea]: [atLevel(POKEMON.Seadra, 32)],
  [POKEMON.Goldeen]: [atLevel(POKEMON.Seaking, 33)],
  [POKEMON.Staryu]: [withStone(POKEMON.Starmie, Stone.Water)],
  [POKEMON.Magikarp]: [atLevel(POKEMON.Gyarados, 20)],
  [POKEMON.Eevee]: [withStone(POKEMON.Vaporeon, Stone.Water), withStone(POKEMON.Jolteon, Stone.Thunder), withStone(POKEMON.Flareon, Stone.Fire)],
  [POKEMON.Omanyte]: [atLevel(POKEMON.Omastar, 40)],
  [POKEMON.Kabuto]: [atLevel(POKEMON.Kabutops, 40)],
  [POKEMON.Dratini]: [atLevel(POKEMON.Dragonair, 30)],
  [POKEMON.Dragonair]: [atLevel(POKEMON.Dragonite, 55)],
  [POKEMON.Chikorita]: [atLevel(POKEMON.Bayleef, 16)],
  [POKEMON.Bayleef]: [atLevel(POKEMON.Meganium, 32)],
  [POKEMON.Cyndaquil]: [atLevel(POKEMON.Quilava, 14)],
  [POKEMON.Quilava]: [atLevel(POKEMON.Typhlosion, 36)],
  [POKEMON.Totodile]: [atLevel(POKEMON.Croconaw, 18)],
  [POKEMON.Croconaw]: [atLevel(POKEMON.Feraligatr, 30)],
  [POKEMON.Togepi]: [atLevel(POKEMON.Togetic, 20)],
  [POKEMON.Togetic]: [withStone(POKEMON.Togekiss, Stone.Shiny)],
  [POKEMON.Houndour]: [atLevel(POKEMON.Houndoom, 24)],
  [POKEMON.Porygon]: [withStone(POKEMON.Porygon2, Stone.Upgrade)],
  [POKEMON.Porygon2]: [withStone(POKEMON.PorygonZ, Stone.DubiousDisc)],
  [POKEMON.Ralts]: [atLevel(POKEMON.Kirlia, 20)],
  [POKEMON.Kirlia]: [atLevel(POKEMON.Gardevoir, 30), withStone(POKEMON.Gallade, Stone.Dawn)],
  [POKEMON.Lotad]: [atLevel(POKEMON.Lombre, 14)],
  [POKEMON.Lombre]: [withStone(POKEMON.Ludicolo, Stone.Water)],
  [POKEMON.Shroomish]: [atLevel(POKEMON.Breloom, 23)],
  [POKEMON.Trapinch]: [atLevel(POKEMON.Vibrava, 35)],
  [POKEMON.Vibrava]: [atLevel(POKEMON.Flygon, 45)],
  [POKEMON.Swablu]: [atLevel(POKEMON.Altaria, 35)],
  [POKEMON.Feebas]: [withStone(POKEMON.Milotic, Stone.PrismScale)],
  [POKEMON.Bagon]: [atLevel(POKEMON.Shelgon, 30)],
  [POKEMON.Shelgon]: [atLevel(POKEMON.Salamence, 50)],
  [POKEMON.Shinx]: [atLevel(POKEMON.Luxio, 15)],
  [POKEMON.Luxio]: [atLevel(POKEMON.Luxray, 30)],
  [POKEMON.Drilbur]: [atLevel(POKEMON.Excadrill, 31)],
  [POKEMON.Cottonee]: [withStone(POKEMON.Whimsicott, Stone.Sun)],
  [POKEMON.Sandile]: [atLevel(POKEMON.Krokorok, 29)],
  [POKEMON.Krokorok]: [atLevel(POKEMON.Krookodile, 40)],
  [POKEMON.Vanillite]: [atLevel(POKEMON.Vanillish, 35)],
  [POKEMON.Vanillish]: [atLevel(POKEMON.Vanilluxe, 47)],
  [POKEMON.Foongus]: [atLevel(POKEMON.Amoonguss, 39)],
  [POKEMON.Tynamo]: [atLevel(POKEMON.Eelektrik, 39)],
  [POKEMON.Eelektrik]: [withStone(POKEMON.Eelektross, Stone.Thunder)],
  [POKEMON.Pawniard]: [atLevel(POKEMON.Bisharp, 52)],
  [POKEMON.Bisharp]: [atLevel(POKEMON.Kingambit, 64)],
  [POKEMON.Larvesta]: [atLevel(POKEMON.Volcarona, 59)],
  [POKEMON.Chespin]: [atLevel(POKEMON.Quilladin, 16)],
  [POKEMON.Quilladin]: [atLevel(POKEMON.Chesnaught, 36)],
  [POKEMON.Fennekin]: [atLevel(POKEMON.Braixen, 16)],
  [POKEMON.Braixen]: [atLevel(POKEMON.Delphox, 36)],
  [POKEMON.Froakie]: [atLevel(POKEMON.Frogadier, 16)],
  [POKEMON.Frogadier]: [atLevel(POKEMON.Greninja, 36)],
  [POKEMON.Pancham]: [atLevel(POKEMON.Pangoro, 32)],
  [POKEMON.Noibat]: [atLevel(POKEMON.Noivern, 48)],
  [POKEMON.Charcadet]: [withStone(POKEMON.Armarouge, Stone.AuspiciousArmor), withStone(POKEMON.Ceruledge, Stone.MaliciousArmor)],
}

/** Evoluciones de la especie (vacío si no evoluciona) */
export const evolutionsOf = (speciesId: number): Evolution[] => EVOLUTIONS[speciesId] ?? []

/** La evolución de `speciesId` a `intoId`, si existe */
export const evolutionTo = (speciesId: number, intoId: number): Evolution | undefined => evolutionsOf(speciesId).find((e) => e.into === intoId)

export const EVOLVING_SPECIES = Object.keys(EVOLUTIONS).map(Number)

/** Especies de las que sale `speciesId` al evolucionar, de la más cercana a la primera (Charizard → Charmeleon, Charmander) */
export function preEvolutionsOf(speciesId: number): number[] {
  const from = EVOLVING_SPECIES.find((id) => evolutionTo(id, speciesId))
  return from === undefined ? [] : [from, ...preEvolutionsOf(from)]
}
