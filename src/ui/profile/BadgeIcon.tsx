import type { ReactNode } from 'react'
import { Badge, BADGES } from '../../data/badges'
import './badge-icon.css'

/** Borde oscuro común de las medallas */
const INK = '#2b2820'

/** Dibujo de cada medalla en una caja de 64×64: su forma con borde, su color y un brillo */
const SHAPES: Record<Badge, ReactNode> = {
  [Badge.Boulder]: (
    <>
      <polygon points="21,4 43,4 60,21 60,43 43,60 21,60 4,43 4,21" fill="#9a9aa6" stroke={INK} strokeWidth="3" />
      <polygon points="25,14 39,14 50,25 50,39 39,50 25,50 14,39 14,25" fill="#c4c4cc" />
      <polygon points="25,14 39,14 44,19 21,19" fill="#ececf0" />
    </>
  ),
  [Badge.Cascade]: (
    <>
      <path d="M32 4 C32 4 10 30 10 42 a22 22 0 0 0 44 0 C54 30 32 4 32 4 Z" fill="#3f8fd6" stroke={INK} strokeWidth="3" />
      <path d="M32 18 C32 18 20 34 20 42 a12 12 0 0 0 24 0 C44 34 32 18 32 18 Z" fill="#7cc0f0" />
      <ellipse cx="25" cy="40" rx="4" ry="7" fill="#e8f6ff" />
    </>
  ),
  [Badge.Thunder]: (
    <>
      <polygon points="32,3 38,20 56,12 46,28 61,36 44,40 50,58 32,46 14,58 20,40 3,36 18,28 8,12 26,20" fill="#f2a93b" stroke={INK} strokeWidth="3" />
      <circle cx="32" cy="32" r="10" fill="#ffd866" stroke={INK} strokeWidth="2" />
      <circle cx="29" cy="29" r="3" fill="#fff6c8" />
    </>
  ),
  [Badge.Rainbow]: (
    <>
      <circle cx="32" cy="15" r="12" fill="#e84d4d" stroke={INK} strokeWidth="3" />
      <circle cx="49" cy="32" r="12" fill="#f2c23b" stroke={INK} strokeWidth="3" />
      <circle cx="32" cy="49" r="12" fill="#4caf50" stroke={INK} strokeWidth="3" />
      <circle cx="15" cy="32" r="12" fill="#3f8fd6" stroke={INK} strokeWidth="3" />
      <circle cx="32" cy="32" r="8" fill="#f4f0e0" stroke={INK} strokeWidth="2.5" />
    </>
  ),
  [Badge.Soul]: (
    <>
      <path d="M32 58 C10 42 4 30 4 20 a14 14 0 0 1 28 -6 a14 14 0 0 1 28 6 C60 30 54 42 32 58 Z" fill="#e0548f" stroke={INK} strokeWidth="3" />
      <path d="M32 46 C18 36 14 28 14 22 a8 8 0 0 1 18 -3 a8 8 0 0 1 18 3 C50 28 46 36 32 46 Z" fill="#f59cc0" />
      <ellipse cx="18" cy="20" rx="3" ry="5" fill="#ffe0ee" />
    </>
  ),
  [Badge.Marsh]: (
    <>
      <circle cx="32" cy="32" r="28" fill="#e2ad35" stroke={INK} strokeWidth="3" />
      <circle cx="32" cy="32" r="17" fill="#f6d771" stroke={INK} strokeWidth="2.5" />
      <circle cx="32" cy="32" r="7" fill="#e2ad35" stroke={INK} strokeWidth="2" />
      <path d="M14 22 a20 20 0 0 1 12 -10" fill="none" stroke="#fff3c4" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  [Badge.Volcano]: (
    <>
      <polygon points="32,3 58,32 32,61 6,32" fill="#d9432f" stroke={INK} strokeWidth="3" />
      <path d="M32 16 C38 26 44 30 44 38 a12 12 0 0 1 -24 0 C20 30 26 26 32 16 Z" fill="#f79a3a" />
      <path d="M32 30 C35 35 37 37 37 41 a5 5 0 0 1 -10 0 C27 37 29 35 32 30 Z" fill="#ffe08a" />
    </>
  ),
  [Badge.Earth]: (
    <>
      <path d="M32 4 C50 14 58 30 52 46 C46 58 32 60 32 60 C32 60 18 58 12 46 C6 30 14 14 32 4 Z" fill="#4f9e4a" stroke={INK} strokeWidth="3" />
      <path d="M32 12 L32 56 M32 26 L22 18 M32 26 L42 18 M32 40 L20 32 M32 40 L44 32" stroke="#2f6a2b" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="22" cy="24" rx="3" ry="6" fill="#a9df8f" />
    </>
  ),
}

/** Una medalla de gimnasio dibujada; `off`, apagada (aún no se tiene) */
export function BadgeIcon({ badge, size = 48, off = false }: { badge: Badge; size?: number; off?: boolean }) {
  return (
    <svg className={`badge-icon ${off ? 'off' : ''}`} viewBox="0 0 64 64" width={size} height={size} role="img" aria-label={BADGES[badge].name}>
      {SHAPES[badge]}
    </svg>
  )
}
