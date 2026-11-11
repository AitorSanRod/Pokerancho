// Cartel de madera con el nombre de la ruta, en una o dos líneas centradas.

import { StopLandmark } from '../../../../data/maps'
import type { Landmark } from '../engine/types'
import { Pixmap, type Color } from '../paint/pixmap'
import { GLYPH_HEIGHT, paintText, textWidth, toGlyphText } from './pixelFont'

/** Ancho máximo de una línea del cartel, en píxeles de arte; un nombre más largo pasa a la línea siguiente */
const MAX_LINE_WIDTH = 64
/** Píxeles de arte entre dos líneas de texto */
const LINE_GAP = 2
/** Alto de los postes bajo el tablero, en píxeles de arte */
const POST_HEIGHT = 12

/** Parte el texto en líneas: primero por « - » (p. ej. «Ruta 1 - Jefe») y luego por palabras si no cabe */
export function signLines(text: string): string[] {
  return toGlyphText(text)
    .split(' - ')
    .flatMap((part) => wrapWords(part.trim().split(/ +/)))
}

function wrapWords(words: string[]): string[] {
  const lines: string[] = []
  for (const word of words) {
    const last = lines.at(-1)
    if (last !== undefined && textWidth(`${last} ${word}`) <= MAX_LINE_WIDTH) lines[lines.length - 1] = `${last} ${word}`
    else lines.push(word)
  }
  return lines
}

/** `wood`: rampa de 5 tonos de madera (oscuro → claro); `grass`: color de las matas de la base */
export function signpost(text: string, wood: readonly Color[], grass: readonly Color[]): Pixmap {
  const lines = signLines(text)
  const textW = Math.max(...lines.map(textWidth))
  const boardW = textW + 8
  const boardH = 6 + lines.length * (GLYPH_HEIGHT + LINE_GAP) - LINE_GAP
  const pix = new Pixmap(boardW + 2, boardH + POST_HEIGHT + 1, false)
  const posts = [Math.round(boardW * 0.22), Math.round(boardW * 0.78) - 1]
  for (const px of posts) {
    pix.rect(px, boardH, 1, POST_HEIGHT, wood[3])
    pix.rect(px + 1, boardH, 1, POST_HEIGHT, wood[1])
    pix.rect(px, boardH, 2, 1, wood[0])
  }
  pix.rect(1, 0, boardW, boardH, wood[0])
  pix.rect(2, 1, boardW - 2, boardH - 2, wood[3])
  pix.rect(2, 1, boardW - 2, 1, wood[4])
  pix.rect(2, boardH - 2, boardW - 2, 1, wood[2])
  pix.rect(boardW - 1, 1, 1, boardH - 2, wood[2])
  lines.forEach((line, i) => {
    const x = 5 + Math.floor((textW - textWidth(line)) / 2)
    paintText(pix, line, x, 3 + i * (GLYPH_HEIGHT + LINE_GAP), wood[0])
  })
  const baseY = pix.h - 1
  for (const px of posts)
    for (const [dx, dy, c] of [[-1, 0, 2], [2, 0, 1], [-2, 0, 3], [3, 0, 2], [0, -1, 3], [2, -1, 2]] as const)
      pix.set(px + dx, baseY + dy, grass[c])
  return pix
}

/**
 * Parada «Cartel» de una escena: lleva `text` (el nombre de la escena en el banco de pruebas) y, en el juego, se vuelve
 * a pintar con el nombre de la ruta (`relabel`). `bottom`: altura de su base sobre el borde inferior; `parallax`, el
 * del suelo en el que se apoya.
 */
export function signLandmark(text: string, wood: readonly Color[], grass: readonly Color[], bottom: number, parallax = 1): Landmark {
  return {
    id: StopLandmark.Sign,
    label: 'Cartel',
    pixmap: signpost(text, wood, grass),
    relabel: (name) => signpost(name, wood, grass),
    parallax,
    bottom,
    afterLayer: 'path',
  }
}
