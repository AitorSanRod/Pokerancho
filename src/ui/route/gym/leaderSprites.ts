import { GymId } from '../../../data/gyms'
import brock from '../../../assets/gyms/brock.gif'
import misty from '../../../assets/gyms/misty.gif'

/**
 * GIF de cada líder de gimnasio (sacados de WikiDex, los de Oro HeartGold y Plata SoulSilver). Un gimnasio sin el suyo
 * se juega igual, sin el líder a la vista
 */
export const LEADER_SPRITES: Partial<Record<GymId, string>> = {
  [GymId.Plateada]: brock,
  [GymId.Celeste]: misty,
}
