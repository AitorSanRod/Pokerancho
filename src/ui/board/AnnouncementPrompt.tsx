import { LATEST_ANNOUNCEMENT } from '../../data/announcements'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { AnnouncementCard } from './AnnouncementCard'

/** Al entrar, una sola vez por anuncio: el más nuevo del tablón, con el recordatorio de dónde está */
export function AnnouncementPrompt({ onClose }: { onClose: () => void }) {
  if (!LATEST_ANNOUNCEMENT) return null
  return (
    <ConfirmDialog title={LATEST_ANNOUNCEMENT.title} confirmLabel="¡Entendido!" cancelLabel="Cerrar" onConfirm={onClose} onCancel={onClose}>
      <AnnouncementCard announcement={LATEST_ANNOUNCEMENT} showTitle={false} />
      <p className="tiny muted center">Lo tienes también en el Tablón, en el Menú del rancho.</p>
    </ConfirmDialog>
  )
}
