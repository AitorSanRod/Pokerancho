import { dexSections } from '../../data/pokedexes'
import { profileStats } from '../../game/core/profile'
import { activeMon, type GameState } from '../../game/core/state'
import { useAccount } from '../../net/account'
import { MenuSheetHeader } from '../ranch/MenuSheetHeader'
import { Bar, Sprite } from '../shared/common'
import { ICON } from '../shared/icons'
import { BadgeCase } from './BadgeCase'
import { ProfileRankings } from './ProfileRankings'
import './profile.css'

const n = (v: number) => v.toLocaleString('es-ES')

/** Perfil del menú del rancho: el entrenador con su compañero, medallas, Pokédex, lo que tiene, récords y rankings */
export function ProfileSheet({ game, onBack }: { game: GameState; onBack: () => void }) {
  const { user } = useAccount()
  const p = profileStats(game, Date.now())
  const companion = activeMon(game)
  const dexes = dexSections().filter((d) => d.species.length > 0)

  return (
    <>
      <MenuSheetHeader icon={ICON.Profile} title="Perfil" onBack={onBack} />
      <div className="card profile-card">
        {companion && <Sprite id={companion.speciesId} size={72} fit={0.85} shiny={companion.shiny} />}
        <div className="profile-name">
          <strong>{user?.nickname ?? 'Entrenador'}</strong>
          <span className="tiny muted">{user ? user.email : 'Sin cuenta: la partida está solo en este móvil'}</span>
        </div>
      </div>

      <h3 className="section-title">
        Medallas{' '}
        <span className="small muted">
          {p.badges.earned}/{p.badges.total}
        </span>
      </h3>
      <BadgeCase game={game} />

      <h3 className="section-title">Pokédex</h3>
      {dexes.map((d) => {
        const caught = d.species.filter((sp) => game.caught.includes(sp.id)).length
        const seen = d.species.filter((sp) => game.seen.includes(sp.id)).length
        return (
          <div key={d.dex?.id ?? 'national'} className="profile-dex">
            <div className="row between small">
              <strong>{d.dex?.name ?? 'Nacional'}</strong>
              <span>
                {caught}/{d.species.length} capturados · {seen} vistos
              </span>
            </div>
            <Bar value={caught} max={d.species.length} kind="steps" />
          </div>
        )
      })}

      <h3 className="section-title">Datos</h3>
      <dl className="profile-stats">
        <dt>Dinero</dt>
        <dd>₽ {n(p.money)}</dd>
        <dt>Tickets de gacha</dt>
        <dd>{n(p.tickets)}</dd>
        <dt>Trozos de MissingNo</dt>
        <dd>{n(p.shards)}</dd>
        <dt>Pokémon</dt>
        <dd>
          {p.owned}
          {p.shiny > 0 && ` (${p.shiny} shiny)`}
        </dd>
        <dt>Rutas completadas</dt>
        <dd>
          {p.routes.completed}/{p.routes.total}
        </dd>
        <dt>Torre: récord</dt>
        <dd>Piso {p.tower.best}</dd>
        <dt>Torre: esta semana</dt>
        <dd>Piso {p.tower.week}</dd>
      </dl>

      <h3 className="section-title">Rankings</h3>
      <ProfileRankings />
    </>
  )
}
