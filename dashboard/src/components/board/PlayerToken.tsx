import type { MouseEvent } from 'react'
import type { PlayerFrame } from '../../types/api'
import { toSvg } from './routePaths'

export type TokenPlayer = PlayerFrame & { role: string; team: 'offense' | 'defense' }

interface PlayerTokenProps {
  player: TokenPlayer
  isDragging: boolean
  isSelected: boolean
  svgScale: number
  draggable?: boolean
  onMouseDown?: (e: MouseEvent<SVGGElement>) => void
}

const STYLE = {
  offense: { fill: '#6038F5', stroke: '#8B6CFF' },
  defense: { fill: '#D50A0A', stroke: '#FF4444' },
} as const

export default function PlayerToken({
  player,
  isDragging,
  isSelected,
  svgScale,
  draggable = false,
  onMouseDown,
}: PlayerTokenProps) {
  const { fill, stroke } = STYLE[player.team]
  // Mantiene el texto legible cuando la pizarra se reduce (spec base: 8 px).
  const fontSize = Math.min(12, Math.max(8, 8 / Math.max(svgScale, 0.01)))

  return (
    <g
      transform={`translate(${toSvg(player.x)} ${toSvg(player.y)})`}
      onMouseDown={onMouseDown}
      aria-label={player.role}
      style={{ cursor: draggable ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
    >
      {isSelected && (
        <circle r="20" fill="none" stroke="#8B6CFF" strokeWidth="1.5" opacity="0.6" />
      )}
      <g
        style={{
          transform: isDragging ? 'scale(1.14)' : 'scale(1)',
          transition: 'transform 140ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <circle r="14" fill={fill} stroke={stroke} strokeWidth="2" />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize={fontSize}
          fontWeight="700"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {player.role}
        </text>
      </g>
    </g>
  )
}
