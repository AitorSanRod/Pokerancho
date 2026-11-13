import { useState } from 'react'
import type { Item } from '../../data/items'
import { claimableMissions } from '../../game/collection/missions'
import type { GameState } from '../../game/core/state'
import { giftReady, useDailyGift } from '../../net/dailyGift'
import { BagSheet } from '../bag/BagSheet'
import { DailyGiftSheet } from '../gift/DailyGiftSheet'
import { InboxSheet } from '../inbox/InboxSheet'
import { MissionsSheet } from '../missions/MissionsSheet'
import { ProfileSheet } from '../profile/ProfileSheet'
import { RankingSheet } from '../ranking/RankingSheet'
import { useInboxCount } from '../inbox/useInboxCount'
import { ICON } from '../shared/icons'
import { ItemIcon } from '../shared/ItemIcon'
import { useUnseen } from '../shared/useUnseen'
import { TutorialsSheet } from '../tutorials/TutorialsSheet'
import { useMenuPending } from './useMenuPending'

type Panel = 'menu' | 'profile' | 'gift' | 'missions' | 'bag' | 'tutorials' | 'inbox' | 'ranking'

/**
 * Botón de menú del rancho (esquina inferior derecha) y lo que abre: perfil, Notificaciones (obsequio listo, premios de
 * raid e intercambios), obsequio diario, misiones del día, Mochila, ranking y tutoriales
 */
export function RanchMenu({ game }: { game: GameState }) {
  const [panel, setPanel] = useState<Panel | null>(null)
  const gift = useDailyGift()
  const giftKey = giftReady(gift) && gift.state ? `gift:${gift.state.claimed}` : null
  const inboxCount = useInboxCount(game)
  const missionsReady = claimableMissions(game)
  // Algo nuevo en el menú: punto en la pestaña Rancho (App.tsx) y, ya en el rancho, en este botón hasta abrir el menú;
  // el de la entrada del obsequio, hasta abrirlo
  const menuDot = useUnseen('ranch:menu', useMenuPending(game), panel !== null)
  const giftDot = useUnseen('ranch:gift', giftKey, panel === 'gift')
  const close = () => setPanel(null)
  const back = () => setPanel('menu')

  return (
    <>
      <button className="ranch-menu-button" onClick={() => setPanel('menu')} aria-label="Abrir el menú">
        <ItemIcon item={ICON.Menu} size={34} />
        <span className="tiny">Menú</span>
        {menuDot && <span className="dot" />}
      </button>
      {panel && (
        <div className="ranch-sheet-backdrop" onClick={close}>
          <div className="ranch-sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            {panel === 'profile' ? (
              <ProfileSheet game={game} onBack={back} />
            ) : panel === 'gift' ? (
              <DailyGiftSheet onBack={back} />
            ) : panel === 'missions' ? (
              <MissionsSheet game={game} onBack={back} />
            ) : panel === 'bag' ? (
              <BagSheet game={game} onBack={back} />
            ) : panel === 'inbox' ? (
              <InboxSheet game={game} onBack={back} />
            ) : panel === 'ranking' ? (
              <RankingSheet onBack={back} />
            ) : panel === 'tutorials' ? (
              <TutorialsSheet onBack={back} />
            ) : (
              <>
                <h2 className="with-icon">
                  <ItemIcon item={ICON.Menu} size={32} /> Menú
                </h2>
                <MenuItem icon={ICON.Profile} title="Perfil" onClick={() => setPanel('profile')}>
                  Tus medallas, la Pokédex, tus datos y tus puestos en los rankings
                </MenuItem>
                <MenuItem icon={ICON.Inbox} title="Notificaciones" count={inboxCount} onClick={() => setPanel('inbox')}>
                  {inboxCount > 0 ? '¡Tienes cosas por recoger!' : 'Obsequio diario, premios de raid e intercambios'}
                </MenuItem>
                <MenuItem icon={ICON.Gift} title="Obsequio diario" dot={giftDot} onClick={() => setPanel('gift')}>
                  {giftKey ? '¡Ya puedes recogerlo!' : 'Un regalo cada día, en ciclo'}
                </MenuItem>
                <MenuItem icon={ICON.Missions} title="Misiones" count={missionsReady} onClick={() => setPanel('missions')}>
                  {missionsReady > 0 ? '¡Tienes misiones por cobrar!' : 'Misiones nuevas cada día, con su premio'}
                </MenuItem>
                <MenuItem icon={ICON.Bag} title="Mochila" onClick={() => setPanel('bag')}>
                  Lo que has comprado y aún no has usado
                </MenuItem>
                <MenuItem icon={ICON.Ranking} title="Ranking" onClick={() => setPanel('ranking')}>
                  La fiesta capitalista
                </MenuItem>
                <MenuItem icon={ICON.Tutorials} title="Tutoriales" onClick={() => setPanel('tutorials')}>
                  Cómo jugar, raids, evolucionar, mejoras y ganar dinero
                </MenuItem>
              </>
            )}
            <button className="btn primary wide" onClick={close}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  )
}

interface MenuItemProps {
  icon: Item
  title: string
  dot?: boolean
  /** Contador rojo a la derecha; 0 o sin él, no se pinta */
  count?: number
  onClick: () => void
  children: string
}

function MenuItem({ icon, title, dot = false, count = 0, onClick, children }: MenuItemProps) {
  return (
    <button className="ranch-menu-item" onClick={onClick}>
      <ItemIcon item={icon} size={36} />
      <span className="grow">
        <strong>{title}</strong>
        <span className="tiny muted ranch-menu-hint">{children}</span>
      </span>
      {dot && <span className="dot" />}
      {count > 0 && <span className="count-badge">{count}</span>}
    </button>
  )
}
