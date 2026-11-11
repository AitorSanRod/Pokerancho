import { reloadApp } from '../../net/appUpdate'
import { dismissOutdated } from '../../net/cloudState'
import { ConfirmDialog } from '../shared/ConfirmDialog'

/**
 * La partida de la nube se guardó con una versión más nueva de la app: se pide actualizar para seguir guardando. Lo
 * jugado aquí no se pierde: se queda en el dispositivo y, ya con la versión nueva, se sube
 */
export function OutdatedAppDialog() {
  return (
    <ConfirmDialog title="¡Hay una versión nueva!" confirmLabel="Actualizar" cancelLabel="Más tarde" onConfirm={() => void reloadApp()} onCancel={dismissOutdated}>
      <p className="small">Tu partida en la nube ya usa la versión nueva de Pokérancho. Actualiza para seguir guardando: solo tarda un momento.</p>
      <p className="small">No pierdes nada: lo que has jugado en este dispositivo se queda aquí y se guarda en la nube en cuanto actualices.</p>
    </ConfirmDialog>
  )
}
