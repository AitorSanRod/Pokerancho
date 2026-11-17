import { useEffect, useState } from 'react'
import type { GameState } from '../../game/core/state'
import { isPending } from '../../game/incursion/schedule/scheduleRules'
import { refreshScheduleBoard, useScheduleBoard } from '../../net/incursionBoard'
import { IconTabs } from '../shared/IconTabs'
import { ICON } from '../shared/icons'
import { listenIncursionRequests, takeIncursionSpot, type IncursionSpot } from '../shared/navigation'
import { IncursionList } from './IncursionList'
import { MySchedules } from './MySchedules'
import { ScheduleBoard } from './ScheduleBoard'

type IncursionTab = IncursionSpot | 'schedule'

/** Ruta › Incursiones sin ninguna en curso: Tablón, Mis incursiones y Programar. Sin servidor, solo la lista para jugar ya */
export function IncursionTabs({ game }: { game: GameState }) {
  const { board, online, clockOffset } = useScheduleBoard()
  const [tab, setTab] = useState<IncursionTab>(() => takeIncursionSpot() ?? (game.incursionBonds.length > 0 ? 'mine' : 'board'))
  useEffect(() => listenIncursionRequests((spot) => setTab(takeIncursionSpot() ?? spot)), [])
  const now = game.lastTick + clockOffset
  const pending = board?.mine.filter((v) => isPending(v.phase)).length ?? 0

  if (online === false) return <IncursionList game={game} online={false} now={now} onScheduled={() => {}} />
  return (
    <div className="incursion-tabs">
      <IconTabs
        active={tab}
        onChange={(next) => {
          setTab(next)
          void refreshScheduleBoard()
        }}
        tabs={[
          { id: 'board', icon: ICON.Board, label: 'Tablón' },
          { id: 'mine', icon: ICON.Incursion, label: 'Mis incursiones', count: pending },
          { id: 'schedule', icon: ICON.Missions, label: 'Programar' },
        ]}
      />
      <div className="screen scroll incursion-list">
        {!board && <p className="small muted center">Cargando…</p>}
        {board && tab === 'board' && <ScheduleBoard game={game} views={board.open} onJoined={() => setTab('mine')} />}
        {board && tab === 'mine' && <MySchedules game={game} views={board.mine} now={now} />}
        {tab === 'schedule' && <IncursionList game={game} online now={now} onScheduled={() => setTab('mine')} />}
      </div>
    </div>
  )
}
