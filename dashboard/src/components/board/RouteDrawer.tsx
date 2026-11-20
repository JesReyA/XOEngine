import { pathLength, type Point } from './routePaths'

export interface Trajectory {
  playerId: number
  points: Point[] // en unidades del SVG (px)
  team?: 'offense' | 'defense'
}

interface RouteDrawerProps {
  trajectories: Trajectory[]
  progress: number // 0–1
}

export default function RouteDrawer({ trajectories, progress }: RouteDrawerProps) {
  const p = Math.min(Math.max(progress, 0), 1)

  return (
    <g aria-hidden="true">
      {trajectories.map((t) => {
        if (t.points.length < 2) return null
        const total = pathLength(t.points)
        const drawn = total * p
        const d = t.points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
        return (
          <path
            key={t.playerId}
            className="route-path"
            d={d}
            stroke={t.team === 'defense' ? '#FF6B6B' : '#8B6CFF'}
            strokeWidth="1.5"
            fill="none"
            opacity="0.5"
            strokeDasharray={total}
            strokeDashoffset={total - drawn}
          />
        )
      })}
    </g>
  )
}
