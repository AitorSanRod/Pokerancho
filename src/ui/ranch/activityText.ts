import type { Item } from '../../data/items'
import { incursion } from '../../data/incursions'
import { ActivityKind, type Activity } from '../../game/core/activity'
import { formatClock, formatWhen } from '../shared/format'
import { ICON } from '../shared/icons'
import { goToIncursions, goToRaids } from '../shared/navigation'
import { ROTATION_LABEL } from '../raid/rotations'

/** Lo que enseña una tarjeta de la tira «En curso» y adónde lleva al tocarla */
export interface ActivityCard {
  icon: Item
  /** Nombre corto bajo el icono del botón */
  label: string
  /** Lo que se lee al pasar por encima o con lector de pantalla */
  title: string
  detail: string
  go: () => void
}

/** Cuenta atrás corta hasta un momento: "12:34" si falta menos de una hora; si no, el día y la hora */
const until = (at: number, now: number): string => (at - now < 60 * 60_000 ? `en ${formatClock(at - now)}` : formatWhen(at, now))

export function activityCard(a: Activity, now: number): ActivityCard {
  switch (a.kind) {
    case ActivityKind.Incursion:
      return { icon: ICON.Incursion, label: 'Incursión', title: incursion(a.incursionId).name, detail: 'Incursión en curso', go: () => goToIncursions('mine') }
    case ActivityKind.Checkin:
      return {
        icon: ICON.Incursion, label: 'Checkin',
        title: incursion(a.incursionId).name,
        detail: `${a.ready ? '¡Haz el checkin!' : 'Listo'} · ${until(a.startAt, now)}`,
        go: () => goToIncursions('room'),
      }
    case ActivityKind.Scheduled:
      return {
        icon: ICON.Incursion, label: 'Programadas',
        title: incursion(a.incursionId).name,
        detail: `${a.ready ? 'Sala abierta' : 'Programada'} · ${until(a.startAt, now)}${a.count > 1 ? ` (${a.count} programadas)` : ''}`,
        go: () => goToIncursions('mine'),
      }
    case ActivityKind.Raid:
      return { icon: ICON.Raid, label: 'Raid', title: `Raid ${ROTATION_LABEL[a.rotation]}`, detail: a.fighting ? 'Pelea en curso' : 'En la sala', go: goToRaids }
    case ActivityKind.RaidLobby:
      return { icon: ICON.Raid, label: 'Sala raid', title: 'Raids: sala abierta', detail: `Pelea ${until(a.fightAt, now)}`, go: goToRaids }
    case ActivityKind.Board:
      return {
        icon: ICON.Board, label: 'Tablón',
        title: 'Tablón de incursiones',
        detail: a.open === 1 ? '1 con sitio libre' : `${a.open} con sitio libre`,
        go: () => goToIncursions('board'),
      }
  }
}
