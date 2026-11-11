import { dismissUpdate, reloadToUpdate, useAppUpdate } from '../../net/appUpdate'
import { ConfirmDialog } from './ConfirmDialog'

/** Aviso de versión nueva de la app: recargar ahora o más tarde (se vuelve a avisar al volver a la app) */
export function UpdatePrompt() {
  const { ready, dismissed } = useAppUpdate()
  if (!ready || dismissed) return null
  return (
    <ConfirmDialog title="¡Pokérancho se ha actualizado!" confirmLabel="Actualizar" cancelLabel="Más tarde" onConfirm={reloadToUpdate} onCancel={dismissUpdate}>
      <p className="small">Hay novedades esperándote. Actualiza ahora o, si estás a mitad de algo, más tarde: también vale cerrar y volver a abrir la app.</p>
      <p className="small">Tu partida está a salvo: tus Pokémon, tu dinero y todo lo que has conseguido se quedan tal cual.</p>
    </ConfirmDialog>
  )
}
