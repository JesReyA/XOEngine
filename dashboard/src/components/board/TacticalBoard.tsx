import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { FIELD_LENGTH, FIELD_WIDTH } from '../../constants/formations'
import { useInterpolation } from '../../hooks/useInterpolation'
import type { PlayerInput, SimFrame } from '../../types/api'
import FieldMarkings from './FieldMarkings'
import PlayerToken, { type TokenPlayer } from './PlayerToken'
import RouteDrawer, { type Trajectory } from './RouteDrawer'
import { routePoints, toSvg, type Point } from './routePaths'

interface TacticalBoardProps {
  players: PlayerInput[]
  frames: SimFrame[]
  currentFrame: number
  isPlaying: boolean
  fps?: number
  readOnly?: boolean
  lineOfScrimmage?: number // yardas
  firstDownLine?: number // yardas
  onPlayerMove?: (playerId: number, x: number, y: number) => void
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

export default function TacticalBoard({
  players,
  frames,
  currentFrame,
  isPlaying,
  fps = 10,
  readOnly = false,
  lineOfScrimmage = 35,
  firstDownLine = 45,
  onPlayerMove,
}: TacticalBoardProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [svgScale, setSvgScale] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [drag, setDrag] = useState<{ id: number; x: number; y: number } | null>(null)

  const interpolated = useInterpolation(frames, currentFrame, fps, isPlaying)

  // Escala px/unidad-SVG para mantener legibles los textos de las fichas.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const update = () => setSvgScale(svg.getBoundingClientRect().width / 1200)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(svg)
    return () => ro.disconnect()
  }, [])

  const tokens: TokenPlayer[] = useMemo(() => {
    const live = new Map(interpolated.map((f) => [f.player_id, f]))
    return players.map((p) => {
      const f = live.get(p.player_id)
      const base = { player_id: p.player_id, role: p.role, team: p.team }
      if (drag && drag.id === p.player_id) {
        return { ...base, x: drag.x, y: drag.y, speed: 0, dir: 0 }
      }
      return f
        ? { ...base, x: f.x, y: f.y, speed: f.speed, dir: f.dir }
        : { ...base, x: p.x, y: p.y, speed: 0, dir: 0 }
    })
  }, [players, interpolated, drag])

  const trajectories: Trajectory[] = useMemo(() => {
    if (frames.length > 1) {
      return players.flatMap((p) => {
        const pts: Point[] = frames
          .map((f) => f.players.find((q) => q.player_id === p.player_id))
          .filter((q): q is NonNullable<typeof q> => !!q)
          .map((q) => [toSvg(q.x), toSvg(q.y)])
        return pts.length > 1 ? [{ playerId: p.player_id, points: pts, team: p.team }] : []
      })
    }
    return players.flatMap((p) => {
      const pts = routePoints(p).map(([x, y]): Point => [toSvg(x), toSvg(y)])
      return pts.length > 1 ? [{ playerId: p.player_id, points: pts, team: p.team }] : []
    })
  }, [players, frames])

  const progress = frames.length > 1 ? currentFrame / Math.max(1, frames.length - 1) : 1

  const toYards = useCallback((e: MouseEvent<SVGElement>): [number, number] | null => {
    const svg = svgRef.current
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm) return null
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const local = pt.matrixTransform(ctm.inverse())
    return [
      clamp(local.x / 10, 0, FIELD_LENGTH),
      clamp(local.y / 10, 0, FIELD_WIDTH),
    ]
  }, [])

  const canDrag = !readOnly && !isPlaying

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (!drag) return
    const pos = toYards(e)
    if (pos) setDrag({ id: drag.id, x: pos[0], y: pos[1] })
  }

  const endDrag = () => {
    if (!drag) return
    onPlayerMove?.(drag.id, +drag.x.toFixed(2), +drag.y.toFixed(2))
    setDrag(null)
  }

  return (
    <div className="w-full aspect-[120/53.3] rounded-card overflow-hidden border border-xo-border">
      <svg
        ref={svgRef}
        viewBox="0 0 1200 533"
        className="w-full h-full select-none"
        role="img"
        aria-label="Pizarra táctica de la cancha NFL"
        onMouseMove={handleMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onMouseDown={() => setSelectedId(null)}
      >
        <FieldMarkings lineOfScrimmage={lineOfScrimmage} firstDownLine={firstDownLine} />
        <RouteDrawer trajectories={trajectories} progress={progress} />
        {tokens.map((t) => (
          <PlayerToken
            key={t.player_id}
            player={t}
            svgScale={svgScale}
            isDragging={drag?.id === t.player_id}
            isSelected={selectedId === t.player_id}
            draggable={canDrag}
            onMouseDown={(e) => {
              e.stopPropagation()
              setSelectedId(t.player_id)
              if (!canDrag) return
              setDrag({ id: t.player_id, x: t.x, y: t.y })
            }}
          />
        ))}
      </svg>
    </div>
  )
}
