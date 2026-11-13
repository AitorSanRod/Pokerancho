// Enfoque de una expedición: al mandarla, el jugador elige qué quiere sacar de ella. Lo elegido sale con un extra y lo
// demás, recortado. EXP y ₽ crecen además con la duración (expedition.ts › DURATION_REWARD_MULT); el botín (tickets y
// piezas) no, para que las expediciones largas no llenen la gacha.

export const ExpeditionFocus = { Exp: 'exp', Money: 'money', Loot: 'loot' } as const
export type ExpeditionFocus = (typeof ExpeditionFocus)[keyof typeof ExpeditionFocus]

export const EXPEDITION_FOCUSES: ExpeditionFocus[] = Object.values(ExpeditionFocus)

/** Multiplicador del premio elegido (1.5 = +50 %) */
const FOCUS_MULT = 1.5
/** Multiplicador de los premios no elegidos (0.5 = la mitad) */
const OFF_FOCUS_MULT = 0.5

export const isExpeditionFocus = (v: unknown): v is ExpeditionFocus => (EXPEDITION_FOCUSES as unknown[]).includes(v)

/** Multiplicador de un tipo de premio (`kind`) en una expedición con el enfoque `focus` */
export const focusMult = (focus: ExpeditionFocus, kind: ExpeditionFocus): number => (focus === kind ? FOCUS_MULT : OFF_FOCUS_MULT)
