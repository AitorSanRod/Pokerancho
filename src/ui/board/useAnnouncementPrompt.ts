import { useState } from 'react'
import { LATEST_ANNOUNCEMENT } from '../../data/announcements'
import { useUnseen } from '../shared/useUnseen'

/** Si el anuncio más nuevo del tablón está sin ver en este dispositivo y, al cerrarlo, darlo por visto */
export function useAnnouncementPrompt(): { show: boolean; dismiss: () => void } {
  const [dismissed, setDismissed] = useState(false)
  const show = useUnseen('board:prompt', LATEST_ANNOUNCEMENT?.id ?? null, dismissed)
  return { show, dismiss: () => setDismissed(true) }
}
