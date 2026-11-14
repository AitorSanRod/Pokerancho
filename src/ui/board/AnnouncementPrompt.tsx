import { useState } from 'react'
import { LATEST_ANNOUNCEMENT } from '../../data/announcements'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { useUnseen } from '../shared/useUnseen'
import { AnnouncementCard } from './AnnouncementCard'

/** Si el anuncio más nuevo del tablón está sin ver en este dispositivo y, al cerrarlo, darlo por visto */
export function useAnnouncementPrompt(): { show: boolean; dismiss: () => void } {
  const [dismissed, setDismissed] = useState(false)
  const show = useUnseen('board:prompt', LATEST_ANNOUNCEMENT?.id ?? null, dismissed)
  return { show, dismiss: () => setDismissed(true) }
}

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
