import type { GiftContents } from '../../data/dailyGifts'
import { STAR_ITEMS } from '../../data/starItems'
import { giftStarItems } from '../../game/collection/dailyGift'

/** Lo que trae el obsequio (o una misión), para leerlo: «2000 ₽, 50 trozos de MissingNo, 1 ticket y 1 Polvo estelar» */
export function giftText(gift: GiftContents): string {
  const parts = [
    gift.money > 0 && `${gift.money} ₽`,
    gift.missingnoShards > 0 && `${gift.missingnoShards} trozos de MissingNo`,
    gift.tickets > 0 && `${gift.tickets} ticket${gift.tickets > 1 ? 's' : ''}`,
    ...giftStarItems(gift).map(([id, n]) => `${n} ${n > 1 ? STAR_ITEMS[id].plural : STAR_ITEMS[id].name}`),
  ].filter((p): p is string => !!p)
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} y ${parts.at(-1)}` : (parts[0] ?? '')
}
