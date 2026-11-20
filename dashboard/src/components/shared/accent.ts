import type { Mode } from '../../types/api'

// Clases completas (necesario para el escaneo estático de Tailwind).
export interface AccentClasses {
  bg: string
  bgHover: string
  bgSoft: string
  borderSoft: string
  borderActive: string
  text: string
  accentHex: string
}

const COACH: AccentClasses = {
  bg: 'bg-xo-electric',
  bgHover: 'hover:bg-xo-violet',
  bgSoft: 'bg-xo-electric/15',
  borderSoft: 'hover:border-xo-electric/40',
  borderActive: 'border-xo-electric',
  text: 'text-xo-violet',
  accentHex: '#6038F5',
}

const FAN: AccentClasses = {
  bg: 'bg-xo-fan-accent',
  bgHover: 'hover:bg-amber-400',
  bgSoft: 'bg-xo-fan-accent/15',
  borderSoft: 'hover:border-xo-fan-accent/40',
  borderActive: 'border-xo-fan-accent',
  text: 'text-xo-fan-accent',
  accentHex: '#F59E0B',
}

export const accentFor = (mode: Mode): AccentClasses => (mode === 'coach' ? COACH : FAN)
