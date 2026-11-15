/**
 * Dónde están los sprites de PokeAPI (Pokémon y objetos): su repositorio de GitHub servido por jsDelivr, un CDN con
 * caché y CORS (raw.githubusercontent.com no es un CDN y limita las peticiones). El service worker los guarda para
 * jugar sin conexión (`runtimeCaching` de vite.config.ts, con este mismo dominio)
 */
export const POKEAPI_SPRITES = 'https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites'
