import { Sprite } from '../shared/common'
import { HeartIcon } from '../shared/HeartIcon'

/** Sprite de lo que se vende, con corazón si es de una especie favorita */
export function SellMonIcon({ speciesId, favorite }: { speciesId: number; favorite: boolean }) {
  return (
    <span className="sell-mon-icon">
      <Sprite id={speciesId} size={52} animated={false} />
      {favorite && <HeartIcon className="sell-heart" />}
    </span>
  )
}
