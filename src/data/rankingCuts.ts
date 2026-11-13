// Cortes extra de los rankings semanales (daño a jefes y torre), para editarlo a mano. Además del corte de cada lunes a
// las 00:00 UTC, en cada uno de estos instantes (ms, UTC) se reparten los premios de lo que llevaba el periodo y los
// rankings empiezan de cero; después sigue el ciclo de los lunes. Sirve para reiniciarlos una vez, p. ej. al publicar.

/** Instantes de los cortes extra, en ms UTC (Date.UTC con el mes empezando en 0) */
export const RANKING_EXTRA_CUTS: readonly number[] = [
  // 13 de noviembre de 2026 a las 09:00 en España (08:00 UTC): reinicio al estrenar los premios semanales
  Date.UTC(2026, 10, 13, 8),
]
