import type { PlayerInput } from '../../types/api'

export type Point = [number, number]

export const toSvg = (yd: number): number => yd * 10

const MID_Y = 26.65

// Trazo de una ruta (yardas) a partir de la posición inicial del receptor.
// La ofensiva avanza hacia +x; "dentro" es el sentido hacia el centro del campo.
export function routePoints(p: PlayerInput): Point[] {
  if (!p.route) return []
  const { x, y } = p
  const inward = y < MID_Y ? 1 : -1
  switch (p.route) {
    case 'slant':
      return [[x, y], [x + 3, y], [x + 10, y + inward * 7]]
    case 'post':
      return [[x, y], [x + 10, y], [x + 22, y + inward * 9]]
    case 'curl':
      return [[x, y], [x + 11, y], [x + 8.5, y + inward * 2]]
    case 'fly':
      return [[x, y], [x + 38, y]]
    case 'out':
      return [[x, y], [x + 8, y], [x + 8, y - inward * 7]]
    case 'cross':
      return [[x, y], [x + 4, y], [x + 11, y + inward * 16]]
    case 'screen':
      return [[x, y], [x - 2, y + inward * 3], [x + 2, y + inward * 6]]
    default:
      return []
  }
}

export const pathLength = (pts: Point[]): number =>
  pts.slice(1).reduce((sum, [x, y], i) => sum + Math.hypot(x - pts[i][0], y - pts[i][1]), 0)
