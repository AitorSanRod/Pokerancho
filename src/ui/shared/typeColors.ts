import { TYPE_INFO, type PokeType } from '../../data/types'

// Los colores de los tipos, de TYPE_INFO, como variables CSS de toda la página (--type-fire, --type-water…): así el CSS
// que no recibe el tipo por `style` (los estados alterados sobre el sprite) usa el mismo color sin escribirlo a mano.

/** Pone en :root una variable --type-<tipo> por cada tipo */
export function installTypeColors(root: HTMLElement = document.documentElement) {
  for (const [type, info] of Object.entries(TYPE_INFO) as [PokeType, (typeof TYPE_INFO)[PokeType]][]) root.style.setProperty(`--type-${type}`, info.color)
}
