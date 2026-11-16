import { SHINY_CHANCE, SHINY_COMBINE_PIECES } from '../../../game/collection/pieces'
import { ICON } from '../../shared/icons'
import { shot, type Guide } from './guide'

export const GACHA_GUIDE: Guide = {
  id: 'gacha',
  icon: ICON.Gacha,
  title: 'Gacha, trituradora y shiny',
  summary: 'Qué hacer con los tickets que sobran y cómo conseguir shiny',
  steps: [
    {
      image: shot('play-gacha'),
      title: 'Tira',
      text: 'Cada ticket de gacha abre una Poké Ball con tickets de Pokémon al azar (a veces, ₽ o un objeto estelar). Las probabilidades de cada rareza están en la misma pestaña.',
    },
    {
      image: shot('gacha-shredder'),
      title: 'Trituradora',
      text: 'Los tickets que no quieras se trituran en trozos de MissingNo: marca los que quieras y confirma abajo. Los de tus favoritos (el corazón de la ficha) no salen aquí.',
    },
    {
      image: shot('gacha-missingno'),
      title: 'MissingNo',
      text: 'Con los trozos compras tickets del Pokémon que elijas, entre los que ya has visto: cuestan más cuanto más raro es.',
    },
    {
      image: shot('gacha-shiny'),
      title: 'Shiny',
      text: `Cada Pokémon que creas tiene un ${Math.round(SHINY_CHANCE * 100)}% de salir shiny. Si aún no lo tienes, con ${SHINY_COMBINE_PIECES} tickets suyos lo creas shiny seguro. Y si ya lo tienes, «Volver a crear» lo cambia por uno nuevo (naturaleza y shiny al azar).`,
    },
  ],
}
