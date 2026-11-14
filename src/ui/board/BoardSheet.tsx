import { ANNOUNCEMENTS } from '../../data/announcements'
import { MenuSheetHeader } from '../ranch/MenuSheetHeader'
import { ICON } from '../shared/icons'
import { AnnouncementCard } from './AnnouncementCard'

/** Tablón de anuncios (menú del rancho): las novedades del juego, de la más nueva a la más vieja */
export function BoardSheet({ onBack }: { onBack: () => void }) {
  return (
    <>
      <MenuSheetHeader icon={ICON.Board} title="Tablón" onBack={onBack} />
      <div className="board-list">
        {ANNOUNCEMENTS.length ? (
          ANNOUNCEMENTS.map((a) => <AnnouncementCard key={a.id} announcement={a} />)
        ) : (
          <p className="small muted center">No hay anuncios.</p>
        )}
      </div>
    </>
  )
}
