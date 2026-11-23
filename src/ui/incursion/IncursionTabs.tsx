import { useEffect, useState } from 'react'
import type { GameState } from '../../game/core/state'
import type { BoardView } from '../../game/incursion/schedule/scheduleProtocol'
import { isPending } from '../../game/incursion/schedule/scheduleRules'
import { refreshScheduleBoard, useScheduleBoard } from '../../net/incursionBoard'
import { IconTabs, type IconTab } from '../shared/IconTabs'
import { ICON } from '../shared/icons'
import { incursionSpots, type IncursionSpot } from '../shared/navigation'
import { IncursionList } from './IncursionList'
import { MySchedules } from './MySchedules'
import { ScheduleBoard } from './ScheduleBoard'
import { ScheduleRoom } from './ScheduleRoom'

type IncursionTab = IncursionSpot | 'schedule'
type ListTab = Exclude<IncursionTab, 'room'>

/** Con la que se abre: la sala del checkin si está abierta; sin servidor, la lista para jugar ya; con fianzas, las suyas; si no, el tablón */
function firstTab(game: GameState, online: boolean | null): IncursionTab {
  if (game.incursionCheckin) return 'room'
  if (online === false) return 'schedule'
  return game.incursionBonds.length > 0 ? 'mine' : 'board'
}

/**
 * Comunidad › Incursiones sin ninguna en curso: Tablón, Mis incursiones, Programar y, con el checkin abierto, su Sala
 * (se va a ella sola al abrirse). Sin servidor, el Tablón y Mis incursiones lo explican y llevan a Programar, que deja
 * jugar ya con bots
 */
export function IncursionTabs({ game }: { game: GameState }) {
  const { board, online, clockOffset } = useScheduleBoard()
  const [tab, setTab] = useState<IncursionTab>(() => incursionSpots.take() ?? firstTab(game, online))
  useEffect(() => incursionSpots.listen(setTab), [])
  const checkin = game.incursionCheckin
  // Al abrirse una sala (checkin hecho, o llega su hora con la pestaña abierta), se va a ella
  useEffect(() => {
    if (checkin) setTab('room')
  }, [checkin?.scheduleId])
  const now = game.lastTick + clockOffset
  const pending = board?.mine.filter((v) => isPending(v.phase)).length ?? 0
  // Sin sala abierta (cancelada, o pedida antes de abrirse), sus incursiones
  const listTab: ListTab = tab === 'room' ? 'mine' : tab

  const tabs: IconTab<IncursionTab>[] = [
    { id: 'board', icon: ICON.Board, label: 'Tablón' },
    { id: 'mine', icon: ICON.Incursion, label: 'Mis incursiones', count: pending },
    { id: 'schedule', icon: ICON.Missions, label: 'Programar' },
  ]
  if (checkin) tabs.push({ id: 'room', icon: ICON.Active, label: 'Sala', live: true })

  return (
    <div className="incursion-tabs">
      <IconTabs
        active={tab === 'room' && !checkin ? listTab : tab}
        onChange={(next) => {
          setTab(next)
          void refreshScheduleBoard()
        }}
        tabs={tabs}
      />
      {tab === 'room' && checkin ? (
        <ScheduleRoom game={game} c={checkin} />
      ) : (
        <TabBody game={game} tab={listTab} board={board} offline={online === false} now={now} onTab={setTab} />
      )}
    </div>
  )
}

interface BodyProps {
  game: GameState
  tab: ListTab
  board: BoardView | null
  offline: boolean
  now: number
  onTab: (tab: IncursionTab) => void
}

/** Lo de Tablón, Mis incursiones y Programar */
function TabBody({ game, tab, board, offline, now, onTab }: BodyProps) {
  return (
    <div className="screen scroll incursion-list">
      {tab === 'schedule' ? (
        <IncursionList game={game} online={!offline} now={now} onScheduled={() => onTab('mine')} />
      ) : offline ? (
        <OfflineNotice onList={() => onTab('schedule')} />
      ) : !board ? (
        <p className="small muted center">Cargando…</p>
      ) : tab === 'board' ? (
        <ScheduleBoard game={game} views={board.open} onJoined={() => onTab('mine')} />
      ) : (
        <MySchedules game={game} views={board.mine} now={now} />
      )}
    </div>
  )
}

/** Tablón y Mis incursiones sin servidor: no hay programadas; las incursiones se juegan ya, con bots, desde Programar */
function OfflineNotice({ onList }: { onList: () => void }) {
  return (
    <div className="notice small incursion-offline">
      <p>Sin conexión con el servidor no se ven las incursiones programadas. Puedes jugar cualquiera al momento con bots.</p>
      <button className="btn go" onClick={onList}>
        Ver las incursiones
      </button>
    </div>
  )
}
