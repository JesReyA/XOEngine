import type { PlayerInput } from '../types/api'

// Coordenadas en yardas: x 0–120 (end zones 0–10 y 110–120), y 0–53.3.
// La ofensiva avanza hacia la derecha.
export const FIELD_LENGTH = 120
export const FIELD_WIDTH = 53.3
const MID_Y = 26.65

export type FormationId = 'shotgun_11' | 'i_form_21' | 'singleback_12'

export interface FormationPreset {
  id: FormationId
  label: string
  build: (ls: number) => PlayerInput[]
}

const off = (
  player_id: number,
  role: string,
  x: number,
  y: number,
  route: string | null = null,
): PlayerInput => ({ player_id, role, team: 'offense', x, y, route })

const def = (
  player_id: number,
  role: string,
  x: number,
  y: number,
  coverage: string | null = null,
): PlayerInput => ({ player_id, role, team: 'defense', x, y, coverage })

const offensiveLine = (ls: number): PlayerInput[] => [
  off(7, 'LT', ls - 1, MID_Y - 4),
  off(8, 'LG', ls - 1, MID_Y - 2),
  off(9, 'C', ls - 1, MID_Y),
  off(10, 'RG', ls - 1, MID_Y + 2),
  off(11, 'RT', ls - 1, MID_Y + 4),
]

const defense43 = (ls: number): PlayerInput[] => [
  def(12, 'DE1', ls + 1, MID_Y - 5),
  def(13, 'DT1', ls + 1, MID_Y - 1.5),
  def(14, 'DT2', ls + 1, MID_Y + 1.5),
  def(15, 'DE2', ls + 1, MID_Y + 5),
  def(16, 'LB1', ls + 4.5, MID_Y - 6),
  def(17, 'LB2', ls + 4.5, MID_Y),
  def(18, 'LB3', ls + 4.5, MID_Y + 6),
  def(19, 'CB1', ls + 1.5, 5, 'man'),
  def(20, 'CB2', ls + 1.5, 44, 'man'),
  def(21, 'S1', ls + 12, MID_Y - 7, 'zone'),
  def(22, 'S2', ls + 12, MID_Y + 7, 'zone'),
]

export const FORMATIONS: FormationPreset[] = [
  {
    id: 'shotgun_11',
    label: 'Shotgun 11 personnel',
    build: (ls) => [
      off(1, 'QB', ls - 5, MID_Y),
      off(2, 'RB', ls - 5, MID_Y + 3),
      ...offensiveLine(ls),
      off(6, 'TE', ls - 1, MID_Y + 7, 'out'),
      off(3, 'WR1', ls - 1, 5, 'slant'),
      off(4, 'WR2', ls - 2, 12, 'post'),
      off(5, 'WR3', ls - 2, 44, 'curl'),
      ...defense43(ls),
    ],
  },
  {
    id: 'i_form_21',
    label: 'I-Formation 21 personnel',
    build: (ls) => [
      off(1, 'QB', ls - 2, MID_Y),
      off(2, 'RB', ls - 7, MID_Y),
      ...offensiveLine(ls),
      off(6, 'TE', ls - 1, MID_Y + 7),
      off(3, 'WR1', ls - 1, 5, 'fly'),
      off(4, 'WR2', ls - 1, 48, 'cross'),
      off(5, 'FB', ls - 4.5, MID_Y),
      ...defense43(ls),
    ],
  },
  {
    id: 'singleback_12',
    label: 'Singleback 12 personnel',
    build: (ls) => [
      off(1, 'QB', ls - 2, MID_Y),
      off(2, 'RB', ls - 6, MID_Y),
      ...offensiveLine(ls),
      off(6, 'TE1', ls - 1, MID_Y + 6.5, 'out'),
      off(5, 'TE2', ls - 1, MID_Y - 6.5, 'curl'),
      off(3, 'WR1', ls - 1, 6, 'post'),
      off(4, 'WR2', ls - 2, 46, 'slant'),
      ...defense43(ls),
    ],
  },
]

export const getFormation = (id: FormationId): FormationPreset =>
  FORMATIONS.find((f) => f.id === id) ?? FORMATIONS[0]

// ── Zona de campo ↔ línea de scrimmage (x en yardas) ──
export const FIELD_ZONE_OPTIONS: Array<{ value: string; label: string }> = [
  ...Array.from({ length: 49 }, (_, i) => ({
    value: `own_${i + 1}`,
    label: `Own ${i + 1}`,
  })),
  { value: 'midfield', label: 'Midfield' },
  ...Array.from({ length: 49 }, (_, i) => ({
    value: `opp_${49 - i}`,
    label: `Opp ${49 - i}`,
  })),
]

export function fieldZoneToX(zone: string): number {
  if (zone === 'midfield') return 60
  if (zone === 'red_zone') return 95
  const [side, n] = zone.split('_')
  const yd = Number(n)
  if (Number.isNaN(yd)) return 35
  return side === 'opp' ? 110 - yd : 10 + yd
}
