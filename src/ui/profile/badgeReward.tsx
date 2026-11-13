import { BADGES, type Badge } from '../../data/badges'
import type { RewardItem } from '../shared/RewardOverlay'
import { BadgeIcon } from './BadgeIcon'

/** La medalla ganada, en la pantalla de premios al acabar la ruta del gimnasio */
export const badgeReward = (badge: Badge): RewardItem => ({
  key: `badge-${badge}`,
  icon: <BadgeIcon badge={badge} size={96} />,
  title: BADGES[badge].name,
  detail: '¡Nueva medalla!',
  color: '#c9952e',
})
