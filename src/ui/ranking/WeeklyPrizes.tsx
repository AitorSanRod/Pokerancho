import { RANKING_PRIZES, type WeeklyBoard } from '../../data/rankingPrizes'
import { giftText } from '../gift/giftText'

/** Premios que da un ranking semanal cada lunes: los del podio y el de participación */
export function WeeklyPrizes({ board }: { board: WeeklyBoard }) {
  const { podium, rest } = RANKING_PRIZES[board]
  return (
    <div className="card weekly-prizes">
      <strong className="small">Premios del lunes</strong>
      <ul className="tiny">
        {podium.map((prize, i) => (
          <li key={i}>
            <strong>{i + 1}.º</strong> {giftText(prize)}
          </li>
        ))}
        <li>
          <strong>Resto del ranking</strong> {giftText(rest)}
        </li>
      </ul>
      <span className="tiny muted">Llegan a Notificaciones cuando acaba la semana.</span>
    </div>
  )
}
