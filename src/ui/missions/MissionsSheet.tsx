import { useState } from 'react'
import { claimMission, missionDone, type Mission } from '../../game/collection/missions'
import { act } from '../../game/core/store'
import type { GameState } from '../../game/core/state'
import { giftText } from '../gift/giftText'
import { Bar } from '../shared/common'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { giftRewards } from '../shared/rewardItems'
import { RewardOverlay, type RewardItem } from '../shared/RewardOverlay'
import { MISSION_ICON, missionText } from './missionText'
import './missions.css'

/** Panel del Menú del rancho con las misiones del día: lo que pide cada una, cuánto falta, su premio y cobrarla */
export function MissionsSheet({ game, onBack }: { game: GameState; onBack: () => void }) {
  const [report, setReport] = useState<RewardItem[] | null>(null)
  const list = game.missions?.list ?? []
  const claim = (i: number) => {
    const reward = act((s) => claimMission(s, i))
    if (reward) setReport(giftRewards(reward))
  }

  return (
    <>
      {report && <RewardOverlay title="¡Misión cumplida!" items={report} onClose={() => setReport(null)} />}
      <div className="row between">
        <h2 className="with-icon">
          <ItemIcon item={ICON.Missions} size={32} /> Misiones
        </h2>
        <button className="account-link" onClick={onBack}>
          Menú
        </button>
      </div>
      <p className="tiny muted">Cada día salen misiones nuevas a medianoche. Las de ayer sin cobrar se pierden.</p>
      {list.length === 0 ? (
        <p className="small muted">Termina el tutorial para recibir misiones.</p>
      ) : (
        <div className="mission-list">
          {list.map((m, i) => (
            <MissionRow key={i} mission={m} onClaim={() => claim(i)} />
          ))}
        </div>
      )}
    </>
  )
}

function MissionRow({ mission, onClaim }: { mission: Mission; onClaim: () => void }) {
  const done = missionDone(mission)
  return (
    <div className={`mission ${mission.claimed ? 'claimed' : done ? 'done' : ''}`}>
      <ItemIcon item={MISSION_ICON[mission.kind]} size={36} off={mission.claimed} />
      <div className="grow mission-body">
        <strong className="small">{missionText(mission)}</strong>
        <Bar value={mission.progress} max={mission.goal} kind="exp" />
        <span className="tiny muted">
          {mission.progress}/{mission.goal} · Premio: {giftText(mission.reward)}
        </span>
      </div>
      {mission.claimed ? (
        <span className="tag ok">Cobrada</span>
      ) : (
        <button className="btn primary small" disabled={!done} onClick={onClaim}>
          Recoger
        </button>
      )}
    </div>
  )
}
