import { useEffect, useState } from 'react'
import { WeeklyBoard } from '../../data/rankingPrizes'
import { RankingCode } from '../../game/core/ranking'
import { AccountStatus, setRanked, useAccount } from '../../net/account'
import { fetchRanking, type RankingResult } from '../../net/ranking'
import { NicknameDialog } from '../raid/NicknameDialog'
import { MenuSheetHeader } from '../ranch/MenuSheetHeader'
import { ICON } from '../shared/icons'
import { DamageBoard, MoneyBoard, TowerBoard } from './RankingBoards'
import { WeeklyPrizes } from './WeeklyPrizes'
import './ranking.css'

/** Qué ranking se mira */
const Board = { Money: 'money', Damage: 'damage', Tower: 'tower' } as const
type Board = (typeof Board)[keyof typeof Board]

/** Los rankings semanales, que dan premio cada lunes */
const WEEKLY: Partial<Record<Board, WeeklyBoard>> = { [Board.Damage]: WeeklyBoard.Damage, [Board.Tower]: WeeklyBoard.Tower }

/** Pestañas del ranking */
const BOARD_TABS: { id: Board; label: string }[] = [
  { id: Board.Money, label: 'Dinero' },
  { id: Board.Damage, label: 'Daño a jefes' },
  { id: Board.Tower, label: 'Torre' },
]

/** Qué explica cada ranking, bajo la cabecera */
const BOARD_INTRO: Record<Board, string> = {
  [Board.Money]: 'Celebración de la fiesta capitalista. Se actualiza cada hora.',
  [Board.Damage]:
    'Daño a los jefes comunitarios y de incursión esta semana, con tu Pokémon que más ha hecho. Cuenta al terminar cada pelea, se actualiza cada hora y empieza de cero cada lunes.',
  [Board.Tower]: 'Piso más alto de la torre infinita esta semana. Cuenta con la partida guardada en la nube, se actualiza cada hora y empieza de cero cada lunes.',
}

/**
 * Rankings del menú del rancho: dinero, daño semanal a los jefes y torre, con tu puesto. Todos piden lo mismo: cuenta,
 * apodo y no haberse ocultado del ranking en Ajustes
 */
export function RankingSheet({ onBack }: { onBack: () => void }) {
  const { status, user } = useAccount()
  const [result, setResult] = useState<RankingResult | null>(null)
  const [naming, setNaming] = useState(false)
  const [board, setBoard] = useState<Board>(Board.Money)
  const nickname = user?.nickname ?? null
  const ranked = user?.ranked ?? false
  const canView = status === AccountStatus.SignedIn && nickname !== null && ranked

  useEffect(() => {
    if (!canView) return
    let live = true
    void fetchRanking().then((r) => live && setResult(r))
    return () => {
      live = false
    }
  }, [canView, nickname])

  const blocked = status !== AccountStatus.SignedIn ? null : !nickname ? RankingCode.NoNickname : !ranked ? RankingCode.Hidden : null
  const code = blocked ?? (result && 'code' in result ? result.code : null)

  return (
    <>
      <MenuSheetHeader icon={ICON.Ranking} title="Ranking" onBack={onBack} />
      <div className="segmented ranking-tabs">
        {BOARD_TABS.map((t) => (
          <button key={t.id} className={board === t.id ? 'active' : ''} onClick={() => setBoard(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="tiny muted">{BOARD_INTRO[board]}</p>
      {WEEKLY[board] && <WeeklyPrizes board={WEEKLY[board]} />}
      {status !== AccountStatus.SignedIn ? (
        <p className="notice small">Para ver el ranking necesitas una cuenta. Entra o crea una en Ajustes › Cuenta.</p>
      ) : code === RankingCode.NoNickname ? (
        <div className="notice small ranking-notice">
          Para ver el ranking y aparecer en él necesitas un apodo.
          <button className="btn primary" onClick={() => setNaming(true)}>
            Poner apodo
          </button>
        </div>
      ) : code === RankingCode.Hidden ? (
        <div className="notice small ranking-notice">
          Has elegido no aparecer en el ranking, así que tampoco puedes verlo.
          <button className="btn primary" onClick={() => void setRanked(true)}>
            Aparecer en el ranking
          </button>
        </div>
      ) : !result ? (
        <p className="small muted">Cargando…</p>
      ) : 'view' in result ? (
        <ResultBoard board={board} result={result} />
      ) : (
        <p className="notice small">No se ha podido conectar con el servidor. Prueba otra vez en un rato.</p>
      )}
      {naming && <NicknameDialog onDone={() => setNaming(false)} onCancel={() => setNaming(false)} />}
    </>
  )
}

/** El tablero elegido con la foto que ha llegado */
function ResultBoard({ board, result }: { board: Board; result: Extract<RankingResult, { view: unknown }> }) {
  if (board === Board.Money) return <MoneyBoard view={result.view} />
  if (board === Board.Damage) return <DamageBoard view={result.damage} />
  return result.tower ? <TowerBoard view={result.tower} /> : <p className="small muted">El servidor aún no tiene este ranking.</p>
}
