import { useEffect, useState } from 'react'
import type { RouteDraft } from '../draft'
import { draftToRoute } from './draftData'
import { RoutePreview } from './RoutePreview'
import { TeamPreview, type TeamDraft } from './TeamPreview'

/** Lo que manda el editor: el modo activo y su borrador */
type PreviewMessage = { kind: 'route'; draft: RouteDraft } | TeamDraft

/** Espera el borrador del editor (avisándole de que ya está lista) y pinta la vista de su modo */
export function Preview() {
  const [msg, setMsg] = useState<PreviewMessage | null>(null)
  useEffect(() => {
    const onMessage = (e: MessageEvent<PreviewMessage>) => {
      if (e.origin === location.origin && e.data?.kind) setMsg(e.data)
    }
    addEventListener('message', onMessage)
    parent.postMessage({ previewReady: true }, location.origin)
    return () => removeEventListener('message', onMessage)
  }, [])
  if (!msg) return <p className="preview-note">Cargando…</p>
  if (msg.kind === 'route') return <RoutePreview route={draftToRoute(msg.draft)} />
  return <TeamPreview key={msg.kind} team={msg} />
}
