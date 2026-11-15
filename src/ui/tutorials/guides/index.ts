import { EVOLVE_GUIDE } from './evolveGuide'
import { GACHA_GUIDE } from './gachaGuide'
import type { Guide } from './guide'
import { GYM_GUIDE } from './gymGuide'
import { INCURSION_GUIDE } from './incursionGuide'
import { MON_GUIDE } from './monGuide'
import { MONEY_GUIDE } from './moneyGuide'
import { ONLINE_GUIDE } from './onlineGuide'
import { PERKS_GUIDE } from './perksGuide'
import { PLAY_GUIDE } from './playGuide'
import { RAID_GUIDE } from './raidGuide'
import { SHOP_GUIDE } from './shopGuide'
import { TOWER_GUIDE } from './towerGuide'

/** Guías del menú Tutoriales, en el orden en que se muestran */
export const GUIDES: Guide[] = [
  PLAY_GUIDE,
  GYM_GUIDE,
  RAID_GUIDE,
  INCURSION_GUIDE,
  TOWER_GUIDE,
  EVOLVE_GUIDE,
  MON_GUIDE,
  GACHA_GUIDE,
  SHOP_GUIDE,
  PERKS_GUIDE,
  MONEY_GUIDE,
  ONLINE_GUIDE,
]
