import type { Announcement } from '../../data/announcements'
import { Sprite } from '../shared/common'
import './board.css'

const dateText = (iso: string): string =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

/**
 * Un anuncio del tablón: fecha, título, texto y sus grupos de Pokémon, en miniatura como los «Pueden aparecer» de una
 * ruta pero todos a la vista (aunque no se hayan visto aún)
 */
export function AnnouncementCard({ announcement: a, showTitle = true }: { announcement: Announcement; showTitle?: boolean }) {
  return (
    <article className="announcement">
      <span className="tiny muted">{dateText(a.date)}</span>
      {showTitle && <h3>{a.title}</h3>}
      <p className="small">{a.text}</p>
      {a.groups?.map((g) => (
        <section key={g.label} className="announcement-group">
          <div className="label">{g.label}</div>
          <div className="announcement-species">
            {g.speciesIds.map((id) => (
              <Sprite key={id} id={id} size={48} animated={false} />
            ))}
          </div>
        </section>
      ))}
    </article>
  )
}
