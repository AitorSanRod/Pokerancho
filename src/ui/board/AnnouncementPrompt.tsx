import { LATEST_ANNOUNCEMENT } from '../../data/announcements'
import { Modal } from '../shared/Modal'
import { AnnouncementCard } from './AnnouncementCard'

/** Al entrar, una sola vez por anuncio: el más nuevo del tablón, con el recordatorio de dónde está */
export function AnnouncementPrompt({ onClose }: { onClose: () => void }) {
  if (!LATEST_ANNOUNCEMENT) return null
  return (
    <Modal onClose={onClose}>
      <h3>{LATEST_ANNOUNCEMENT.title}</h3>
      <AnnouncementCard announcement={LATEST_ANNOUNCEMENT} showTitle={false} />
      <p className="tiny muted center">Lo tienes también en el Tablón, en el Menú del rancho.</p>
      <div className="confirm-actions">
        <button className="btn primary wide" onClick={onClose}>
          ¡Entendido!
        </button>
      </div>
    </Modal>
  )
}
