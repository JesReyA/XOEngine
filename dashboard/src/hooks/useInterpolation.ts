import { useEffect, useState } from 'react'
import type { PlayerFrame, SimFrame } from '../types/api'

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// Interpola entre el ángulo a y b por el camino corto.
const lerpAngle = (a: number, b: number, t: number) => {
  const d = ((b - a + 540) % 360) - 180
  return (a + d * t + 360) % 360
}

function mix(a: PlayerFrame[], b: PlayerFrame[], t: number): PlayerFrame[] {
  const next = new Map(b.map((p) => [p.player_id, p]))
  return a.map((p) => {
    const n = next.get(p.player_id)
    if (!n) return p
    return {
      player_id: p.player_id,
      x: lerp(p.x, n.x, t),
      y: lerp(p.y, n.y, t),
      speed: lerp(p.speed, n.speed, t),
      dir: lerpAngle(p.dir, n.dir, t),
    }
  })
}

// Posición suavizada (≈60 fps) entre frames[currentFrame] y frames[currentFrame + 1].
export function useInterpolation(
  frames: SimFrame[],
  currentFrame: number,
  fps: number,
  isPlaying: boolean = true,
): PlayerFrame[] {
  const exact = frames[currentFrame]?.players ?? []
  const [interpolated, setInterpolated] = useState<PlayerFrame[]>(exact)

  useEffect(() => {
    const here = frames[currentFrame]?.players ?? []
    const next = frames[currentFrame + 1]?.players
    if (frames.length <= 1 || !isPlaying || !next) {
      setInterpolated(here)
      return
    }
    const start = performance.now()
    const duration = 1000 / fps
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setInterpolated(mix(here, next, t))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [frames, currentFrame, fps, isPlaying])

  return frames.length <= 1 ? exact : interpolated
}
