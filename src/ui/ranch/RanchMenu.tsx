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
                <div className="ranch-menu-grid">
                  <MenuTile icon={ICON.Profile} title="Perfil" onClick={() => setPanel('profile')} />
                  <MenuTile icon={ICON.Inbox} title="Notificaciones" count={inboxCount} onClick={() => setPanel('inbox')} />
                  <MenuTile icon={ICON.Gift} title="Obsequio diario" dot={giftDot} onClick={() => setPanel('gift')} />
                  <MenuTile
                    icon={ICON.Missions}
                    title="Misiones"
                    count={missionsReady}
                    onClick={() => setPanel('missions')}
                  />
                  <MenuTile icon={ICON.Bag} title="Mochila" onClick={() => setPanel('bag')} />
                  <MenuTile icon={ICON.Ranking} title="Ranking" onClick={() => setPanel('ranking')} />
                  <MenuTile icon={ICON.Tutorials} title="Tutoriales" onClick={() => setPanel('tutorials')} />
                </div>
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

interface MenuTileProps {
  icon: Item
  title: string
  dot?: boolean
  /** Contador rojo en la esquina; 0 o sin él, no se pinta */
  count?: number
  onClick: () => void
}

/** Una casilla de la cuadrícula del menú: icono y nombre, con el aviso en la esquina */
function MenuTile({ icon, title, dot = false, count = 0, onClick }: MenuTileProps) {
  return (
    <button className="ranch-menu-tile" onClick={onClick}>
      <ItemIcon item={icon} size={40} />
      <strong>{title}</strong>
      {count > 0 ? <span className="count-badge">{count}</span> : dot && <span className="dot" />}
    </button>
  )
}
