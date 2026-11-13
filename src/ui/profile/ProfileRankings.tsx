import { useEffect, useState } from 'react'
import { AccountStatus, useAccount } from '../../net/account'
import { fetchRanking, type RankingResult } from '../../net/ranking'

/** Un puesto del jugador en un ranking: «3.º de 40», o un guion si no sale */
const place = (mine: { rank: number } | null, total: number) => (mine ? `${mine.rank}.º de ${total}` : '—')

/** Tus puestos en los rankings (dinero, daño a jefes de la semana y torre de la semana), si puedes verlos */
export function ProfileRankings() {
  const { status, user } = useAccount()
  const canView = status === AccountStatus.SignedIn && !!user?.nickname && user.ranked
  const [result, setResult] = useState<RankingResult | null>(null)

  useEffect(() => {
    if (!canView) return
    let live = true
    void fetchRanking().then((r) => live && setResult(r))
    return () => {
      live = false
    }
  }, [canView])

  if (!canView) return <p className="tiny muted">Con cuenta, apodo y «Aparecer en el ranking» en Ajustes verás aquí tus puestos.</p>
  if (!result) return <p className="tiny muted">Cargando…</p>
  if (!('view' in result)) return <p className="tiny muted">No se ha podido conectar con el servidor.</p>
  return (
    <dl className="profile-stats">
      <dt>Dinero</dt>
      <dd>{place(result.view.mine, result.view.total)}</dd>
      <dt>Daño a jefes (semana)</dt>
      <dd>{place(result.damage.mine, result.damage.total)}</dd>
      <dt>Torre (semana)</dt>
      <dd>{result.tower ? place(result.tower.mine, result.tower.total) : '—'}</dd>
    </dl>
  )
}
