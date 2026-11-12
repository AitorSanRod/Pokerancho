import { useEffect, useState } from 'react'

/** Rectángulo, en píxeles de la imagen, que ocupa el Pokémon dentro de su sprite */
export interface SpriteBounds {
  x: number
  y: number
  w: number
  h: number
}

/** Transparencia por debajo de la cual un píxel no cuenta como parte del Pokémon */
const OPAQUE_ALPHA = 16

const cache = new Map<string, Promise<SpriteBounds | null>>()

/** Recorre los píxeles y devuelve el rectángulo de los que no son transparentes */
function opaqueBounds(img: HTMLImageElement): SpriteBounds | null {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(img, 0, 0)
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let minX = width, minY = height, maxX = -1, maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] < OPAQUE_ALPHA) continue
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
  }
  return maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

/**
 * Contorno del Pokémon en una imagen estática (los PNG traen margen transparente). Se pide aparte con CORS, y con
 * otra dirección para que la caché del service worker no devuelva la copia sin CORS; si falla, null (sin recortar).
 */
function measureBounds(src: string): Promise<SpriteBounds | null> {
  let pending = cache.get(src)
  if (!pending) {
    pending = new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          resolve(opaqueBounds(img))
        } catch {
          resolve(null)
        }
      }
      img.onerror = () => resolve(null)
      img.src = `${src}?bounds`
    })
    cache.set(src, pending)
  }
  return pending
}

/** Contorno de `src` cuando `enabled`: undefined mientras se mide, null si no se pudo medir */
export function useSpriteBounds(src: string, enabled: boolean): SpriteBounds | null | undefined {
  const [measured, setMeasured] = useState<{ src: string; bounds: SpriteBounds | null } | null>(null)
  useEffect(() => {
    if (!enabled) return
    let alive = true
    void measureBounds(src).then((bounds) => alive && setMeasured({ src, bounds }))
    return () => {
      alive = false
    }
  }, [src, enabled])
  if (!enabled) return null
  return measured?.src === src ? measured.bounds : undefined
}
