// Descarga de PokeAPI los Pokémon del juego y genera src/data/pokemon.json
// Son los 151 de Kanto más los de NATIONAL_IDS; los que no caen en el rango de ninguna región
// (src/data/pokedexes.ts › REGIONAL_DEXES) salen en la Pokédex Nacional. Las formas de FORM_IDS llevan `baseId` (su
// especie) y no salen en la Pokédex ni en el gacha: se llega a ellas cambiando de forma (src/data/forms.ts)
// Uso: node scripts/fetch-pokemon.mjs
import { writeFile } from 'node:fs/promises'

const API = 'https://pokeapi.co/api/v2'
const KANTO_LAST = 151
/** Números de la Pokédex Nacional de los Pokémon que se añaden a mano, p. ej. [152, 196, 197] */
const NATIONAL_IDS = [175, 183, 196, 197, 280, 281, 282, 285, 286, 349, 350, 403, 404, 405, 470, 471, 475, 479, 529, 530, 546, 547, 582, 583, 584, 602, 603, 604, 636, 637, 674, 675, 700, 714, 715, 935, 936, 937]
/** Ids de PokeAPI (10001 en adelante) de las formas que se añaden a mano, p. ej. las de Rotom */
const FORM_IDS = [10008, 10009, 10010, 10011, 10012]
const CONCURRENCY = 8

async function getJson(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url)
    if (res.ok) return res.json()
    await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
  }
  throw new Error(`Fallo al descargar ${url}`)
}

async function fetchOne(id) {
  const mon = await getJson(`${API}/pokemon/${id}`)
  const species = await getJson(mon.species.url)
  const isForm = species.id !== id
  const names = isForm ? (await getJson(mon.forms[0].url)).form_names : species.names
  const stat = (name) => mon.stats.find((s) => s.stat.name === name).base_stat
  const es = names.find((n) => n.language.name === 'es')
  return {
    id,
    name: es ? es.name : mon.name,
    ...(isForm && { baseId: species.id }),
    types: mon.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    base: {
      hp: stat('hp'),
      atk: stat('attack'),
      def: stat('defense'),
      spa: stat('special-attack'),
      spd: stat('special-defense'),
      spe: stat('speed'),
    },
    height: mon.height,
  }
}

const ids = [...new Set([...Array.from({ length: KANTO_LAST }, (_, i) => i + 1), ...NATIONAL_IDS, ...FORM_IDS])]
const result = []
for (let i = 0; i < ids.length; i += CONCURRENCY) {
  const chunk = await Promise.all(ids.slice(i, i + CONCURRENCY).map(fetchOne))
  result.push(...chunk)
  process.stdout.write(`\r${result.length}/${ids.length}`)
}
await writeFile(new URL('../src/data/pokemon.json', import.meta.url), JSON.stringify(result))
console.log('\nOK -> src/data/pokemon.json')
