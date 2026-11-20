import type { PlayerFrame, SimFrame } from '../types/api'

export type Pt = [number, number]

// Posición a lo largo de una polilínea para t en 0–1 (interpolación lineal por tramos).
function along(points: Pt[], t: number): Pt {
  const segs = points.length - 1
  const f = Math.min(Math.max(t, 0), 1) * segs
  const i = Math.min(Math.floor(f), segs - 1)
  const u = f - i
  const [x0, y0] = points[i]
  const [x1, y1] = points[i + 1]
  return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u]
}

// Genera SimFrame[] a partir de recorridos por jugador (id → puntos en yardas).
export function buildFrames(tracks: Record<number, Pt[]>, total: number = 30, fps: number = 10): SimFrame[] {
  return Array.from({ length: total }, (_, k) => {
    const players: PlayerFrame[] = Object.entries(tracks).map(([id, pts]) => {
      const [x, y] = along(pts, k / (total - 1))
      const [px, py] = along(pts, Math.max(k - 1, 0) / (total - 1))
      const dir = (Math.atan2(y - py, x - px) * 180) / Math.PI
      return {
        player_id: Number(id),
        x: +x.toFixed(2),
        y: +y.toFixed(2),
        speed: +(Math.hypot(x - px, y - py) * fps).toFixed(2),
        dir: +((dir + 360) % 360).toFixed(1),
      }
    })
    return { frame: k, t_ms: k * (1000 / fps), players }
  })
}
