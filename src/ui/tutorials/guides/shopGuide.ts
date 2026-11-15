import { MINT_PRICE } from '../../../game/team/mints'
import { ICON } from '../../shared/icons'
import { shot, type Guide } from './guide'

export const SHOP_GUIDE: Guide = {
  id: 'shop',
  icon: ICON.Shop,
  title: 'Tienda, venta e intercambios',
  summary: 'Mejoras, objetos, vender al servidor e intercambiar con otros',
  steps: [
    {
      image: shot('shop-upgrades'),
      title: 'Mejoras',
      text: 'En Tienda, las mejoras: más espacios de expedición, ranchos nuevos y ampliaciones de rancho. Cada una pide confirmar antes de comprarla.',
    },
    {
      image: shot('shop-mints'),
      title: 'Objetos',
      text: `Debajo, cada cosa en su desplegable: objetos evolutivos, tipos de rancho, llaves de incursión, formas de Rotom y Mentas (₽ ${MINT_PRICE.toLocaleString('es-ES')}). Lo comprado va a la Mochila hasta que lo usas.`,
    },
    {
      image: shot('shop-sell'),
      title: 'Venta',
      text: 'En la pestaña Venta el servidor te compra Pokémon, tickets y trozos de MissingNo, por su rareza. Tu compañero no se puede vender.',
    },
    {
      image: shot('shop-trade'),
      title: 'Intercambios',
      text: 'Con una cuenta, en Intercambios pones a la venta Pokémon, tickets, objetos estelares, MT o trozos de MissingNo y aceptas los anuncios de los demás. Lo que llega te espera en Menú › Notificaciones.',
    },
  ],
}
