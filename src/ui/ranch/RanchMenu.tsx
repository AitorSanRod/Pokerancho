import { useState } from 'react'
import { LATEST_ANNOUNCEMENT } from '../../data/announcements'
import type { Item } from '../../data/items'
import { BoardSheet } from '../board/BoardSheet'
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
import { RanchSheet } from './RanchSheet'
import { useMenuPending } from './useMenuPending'

type Panel = 'menu' | 'profile' | 'board' | 'gift' | 'missions' | 'bag' | 'tutorials' | 'inbox' | 'ranking'

/**
 * Botón de menú del rancho (esquina inferior derecha) y lo que abre: perfil, Tablón de anuncios, Notificaciones (obsequio listo, premios de
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
  const boardDot = useUnseen('ranch:board', LATEST_ANNOUNCEMENT?.id ?? null, panel === 'board')
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
        <RanchSheet label="Menú" step={panel} onClose={close} onBack={panel === 'menu' ? close : back}>
          {panel === 'menu' ? (
            <>
              <h2 className="with-icon">
                <ItemIcon item={ICON.Menu} size={32} /> Menú
              </h2>
              <div className="ranch-menu-grid">
                <MenuTile icon={ICON.Profile} title="Perfil" onClick={() => setPanel('profile')} />
                <MenuTile icon={ICON.Board} title="Tablón" dot={boardDot} onClick={() => setPanel('board')} />
                <MenuTile icon={ICON.Inbox} title="Notificaciones" count={inboxCount} onClick={() => setPanel('inbox')} />
                <MenuTile icon={ICON.Gift} title="Obsequio diario" dot={giftDot} onClick={() => setPanel('gift')} />
                <MenuTile icon={ICON.Missions} title="Misiones" count={missionsReady} onClick={() => setPanel('missions')} />
                <MenuTile icon={ICON.Bag} title="Mochila" onClick={() => setPanel('bag')} />
                <MenuTile icon={ICON.Ranking} title="Ranking" onClick={() => setPanel('ranking')} />
                <MenuTile icon={ICON.Tutorials} title="Tutoriales" onClick={() => setPanel('tutorials')} />
              </div>
            </>
          ) : (
            <MenuPanel panel={panel} game={game} onBack={back} />
          )}
        </RanchSheet>
      )}
    </>
  )
}

/** Lo que abre cada casilla del menú; todos vuelven al menú con onBack */
function MenuPanel({ panel, game, onBack }: { panel: Exclude<Panel, 'menu'>; game: GameState; onBack: () => void }) {
  switch (panel) {
    case 'profile':
      return <ProfileSheet game={game} onBack={onBack} />
    case 'gift':
      return <DailyGiftSheet onBack={onBack} />
    case 'missions':
      return <MissionsSheet game={game} onBack={onBack} />
    case 'bag':
      return <BagSheet game={game} onBack={onBack} />
    case 'inbox':
      return <InboxSheet game={game} onBack={onBack} />
    case 'ranking':
      return <RankingSheet onBack={onBack} />
    case 'board':
      return <BoardSheet onBack={onBack} />
    case 'tutorials':
      return <TutorialsSheet onBack={onBack} />
  }
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
