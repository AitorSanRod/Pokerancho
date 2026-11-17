import { IncursionId } from '../../../data/incursions'
import type { HeldBond } from './linkedSchedule'

// Las fianzas retenidas de una partida guardada con otra versión (ver core/saveMigration.ts): las que encajan siguen;
// las de una incursión que ya no existe vuelven al dinero (sin devolver aún), para no perder nada.

type Save = Record<string, unknown>

const isRecord = (v: unknown): v is Save => typeof v === 'object' && v !== null && !Array.isArray(v)
const isIncursionId = (v: unknown): v is IncursionId => (Object.values(IncursionId) as unknown[]).includes(v)
const isAmount = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0

/** Una fianza guardada que encaja, sin mirar la incursión */
function bondShape(v: unknown): (Omit<HeldBond, 'incursionId'> & { incursionId: unknown }) | null {
  if (!isRecord(v) || typeof v.scheduleId !== 'string' || !v.scheduleId || typeof v.startAt !== 'number' || !isAmount(v.amount)) return null
  return { scheduleId: v.scheduleId, incursionId: v.incursionId, startAt: v.startAt, amount: v.amount, refunded: v.refunded === true }
}

/** Las fianzas que siguen: con forma de fianza, de una incursión que existe y una por incursión programada */
export function salvageBonds(v: unknown): HeldBond[] | undefined {
  if (!Array.isArray(v)) return undefined
  const bonds: HeldBond[] = []
  for (const b of v.map(bondShape)) {
    if (b && isIncursionId(b.incursionId) && !bonds.some((o) => o.scheduleId === b.scheduleId)) bonds.push({ ...b, incursionId: b.incursionId })
  }
  return bonds
}

/** Lo retenido por incursiones que ya no existen (y aún sin devolver) vuelve al dinero de la partida guardada */
export function refundLostBonds(save: Save) {
  if (!Array.isArray(save.incursionBonds) || !isAmount(save.money)) return
  const lost = save.incursionBonds.map(bondShape).filter((b) => b && !b.refunded && !isIncursionId(b.incursionId))
  save.money += lost.reduce((sum, b) => sum + (b?.amount ?? 0), 0)
}
