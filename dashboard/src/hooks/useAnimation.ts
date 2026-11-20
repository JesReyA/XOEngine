import { useCallback, useEffect, useRef, useState } from 'react'
import type { SimFrame } from '../types/api'

// Reproduce los frames de la simulación a `fps` Hz (10 por defecto).
export function useAnimation(frames: SimFrame[], fps: number = 10) {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const totalFrames = frames.length
  const lastFrame = Math.max(0, totalFrames - 1)

  const play = useCallback(() => {
    if (totalFrames === 0) return
    // Si terminó, reinicia desde el primer frame.
    setCurrentFrame((prev) => (prev >= lastFrame ? 0 : prev))
    setIsPlaying(true)
  }, [totalFrames, lastFrame])

  const pause = useCallback(() => setIsPlaying(false), [])

  const reset = useCallback(() => {
    setCurrentFrame(0)
    setIsPlaying(false)
  }, [])

  const goToFrame = useCallback(
    (n: number) => setCurrentFrame(Math.min(Math.max(0, Math.round(n)), lastFrame)),
    [lastFrame],
  )

  useEffect(() => {
    if (!isPlaying) return
    intervalRef.current = setInterval(() => {
      setCurrentFrame((prev) => Math.min(prev + 1, lastFrame))
    }, 1000 / fps)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [isPlaying, lastFrame, fps])

  // Detiene la reproducción al llegar al último frame.
  useEffect(() => {
    if (isPlaying && currentFrame >= lastFrame) setIsPlaying(false)
  }, [isPlaying, currentFrame, lastFrame])

  // Una simulación nueva siempre arranca desde el principio.
  useEffect(() => {
    setCurrentFrame(0)
    setIsPlaying(false)
  }, [frames])

  return { currentFrame, isPlaying, totalFrames, play, pause, reset, goToFrame }
}
