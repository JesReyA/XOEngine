import type { PlayerFrame, SimFrame, SimulateResponse } from '../types/api'

const FPS = 10
const TOTAL = 30

type Pt = [number, number]

// Interpolación lineal por tramos a lo largo de una polilínea (t en 0–1).
function along(points: Pt[], t: number): Pt {
  const segs = points.length - 1
  const f = Math.min(Math.max(t, 0), 1) * segs
  const i = Math.min(Math.floor(f), segs - 1)
  const u = f - i
  const [x0, y0] = points[i]
  const [x1, y1] = points[i + 1]
  return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u]
}

function track(playerId: number, points: Pt[]): PlayerFrame[] {
  return Array.from({ length: TOTAL }, (_, k) => {
    const [x, y] = along(points, k / (TOTAL - 1))
    const [px, py] = along(points, Math.max(k - 1, 0) / (TOTAL - 1))
    const speed = Math.hypot(x - px, y - py) * FPS
    const dir = (Math.atan2(y - py, x - px) * 180) / Math.PI
    return {
      player_id: playerId,
      x: +x.toFixed(2),
      y: +y.toFixed(2),
      speed: +speed.toFixed(2),
      dir: +((dir + 360) % 360).toFixed(1),
    }
  })
}

// Línea de scrimmage en x = 35. WR1 (3) corre un slant, CB1 (19) lo cubre, QB (1) lanza.
const tracks = [
  track(1, [[30, 26.65], [28.6, 26.65]]),
  track(3, [[34, 5], [38, 5.4], [46, 13], [58, 20]]),
  track(19, [[36.5, 5], [39.5, 6], [47.5, 14.5], [57, 19.5]]),
]

const frames: SimFrame[] = Array.from({ length: TOTAL }, (_, k) => ({
  frame: k,
  t_ms: k * (1000 / FPS),
  players: tracks.map((t) => t[k]),
}))

export const simulateMock: SimulateResponse = {
  play_id_ref: 'mock_sim_kc_sf_3rd7_001',
  frames,
  total_frames: TOTAL,
  fps: FPS,
  effectiveness: {
    score: 0.67,
    label: '67%',
    factors: [
      { name: 'Separación del receptor', weight: 0.31, value: 2.8, impact: 'positive' },
      { name: 'Presión al QB', weight: 0.24, value: 1.2, impact: 'negative' },
      { name: 'Velocidad de cierre defensivo', weight: 0.19, value: 7.1, impact: 'negative' },
      { name: 'Contexto de down', weight: 0.15, value: 3.0, impact: 'neutral' },
      { name: 'Emparejamiento en ruta', weight: 0.11, value: 1.9, impact: 'positive' },
    ],
  },
  similar_plays_found: 14,
}
