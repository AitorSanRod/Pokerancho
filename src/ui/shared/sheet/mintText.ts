import { MintKind } from '../../../game/team/mints'
import { ICON } from '../icons'

/** Nombre de cada Menta en la Tienda, la Mochila y la ficha */
export const MINT_NAME: Record<MintKind, string> = { [MintKind.Random]: 'Menta aleatoria', [MintKind.Neutral]: 'Menta neutra' }

/** Lo que hace cada Menta, en una línea */
export const MINT_EFFECT: Record<MintKind, string> = { [MintKind.Random]: 'Otra naturaleza al azar', [MintKind.Neutral]: 'La naturaleza neutra' }

export const mintIcon = (kind: MintKind) => (kind === MintKind.Neutral ? ICON.NeutralMint : ICON.Mint)
