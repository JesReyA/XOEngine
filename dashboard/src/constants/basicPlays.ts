import type { Effectiveness, PlayerInput, SimFrame } from '../types/api'
import { getFormation, type FormationId } from './formations'
import { buildFrames } from './trackFrames'

export interface BasicPlay {
  id: 'run_middle' | 'slant' | 'screen' | 'blitz'
  label: string
  summary: string
  steps: string[]
  players: PlayerInput[]
  frames: SimFrame[]
  effectiveness: Effectiveness
}

const LOS = 35 // línea de scrimmage en yardas
const FPS = 10

const lineup = (f: FormationId): PlayerInput[] => getFormation(f).build(LOS)

export const BASIC_PLAYS: BasicPlay[] = [
  {
    id: 'run_middle',
    label: 'Acarreo por el centro',
    summary: 'El RB recibe el balón y corre entre los guardias.',
    steps: ['El QB entrega el balón al RB.', 'La línea ofensiva abre un hueco al centro.', 'El LB central sale a frenar la corrida.'],
    players: lineup('singleback_12'),
    frames: buildFrames({
      1: [[33, 26.65], [31.5, 27]],
      2: [[29, 26.65], [32, 26.65], [36, 26.65], [48, 25]],
      13: [[36, 25.15], [37, 26], [38, 26.3]],
      17: [[39.5, 26.65], [40, 26.65], [45, 26]],
      21: [[47, 19.65], [48, 22], [50, 25.5]],
    }),
    effectiveness: {
      score: 0.48,
      label: '48%',
      factors: [
        { name: 'Espacio al centro', weight: 0.34, value: 2.1, impact: 'neutral' },
        { name: 'Cajón defensivo', weight: 0.28, value: 6.0, impact: 'negative' },
        { name: 'Bloqueo de la línea', weight: 0.22, value: 1.4, impact: 'positive' },
      ],
    },
  },
  {
    id: 'slant',
    label: 'Pase rápido Slant',
    summary: 'El WR corta en diagonal hacia el centro y recibe de inmediato.',
    steps: ['El QB da un paso atrás y lanza rápido.', 'El WR sale recto y corta en diagonal.', 'El CB intenta pegarse al receptor.'],
    players: lineup('shotgun_11'),
    frames: buildFrames({
      1: [[30, 26.65], [28, 26.65]],
      3: [[34, 5], [37, 5], [45, 12], [55, 15]],
      19: [[36.5, 5], [39, 6], [47, 12.5], [56, 15.5]],
      16: [[39.5, 20.65], [41, 18], [46, 15]],
      21: [[47, 19.65], [48, 17], [52, 15]],
    }),
    effectiveness: {
      score: 0.62,
      label: '62%',
      factors: [
        { name: 'Separación del receptor', weight: 0.38, value: 2.4, impact: 'positive' },
        { name: 'Tiempo de lanzamiento', weight: 0.3, value: 2.1, impact: 'positive' },
        { name: 'Cobertura del CB', weight: 0.2, value: 1.1, impact: 'negative' },
      ],
    },
  },
  {
    id: 'screen',
    label: 'Screen Pass',
    summary: 'El QB atrae la presión y lanza corto al RB con bloqueadores al frente.',
    steps: ['La línea deja pasar a los defensores a propósito.', 'El QB lanza por encima al RB, que sale a la banda.', 'Los bloqueadores abren camino al frente.'],
    players: lineup('shotgun_11'),
    frames: buildFrames({
      1: [[30, 26.65], [27, 26.65]],
      2: [[30, 29.65], [27, 33], [28, 38], [38, 41], [48, 42]],
      12: [[36, 21.65], [31, 24], [27.5, 26.2]],
      13: [[36, 25.15], [31, 27], [28, 27]],
      18: [[39.5, 32.65], [36, 35], [33, 38]],
      5: [[33, 44], [36, 43], [43, 42.3]],
      20: [[36.5, 44], [40, 43], [46, 42.5]],
    }),
    effectiveness: {
      score: 0.55,
      label: '55%',
      factors: [
        { name: 'Presión atraída', weight: 0.33, value: 3.2, impact: 'positive' },
        { name: 'Bloqueo al frente', weight: 0.27, value: 1.6, impact: 'positive' },
        { name: 'Velocidad del cierre', weight: 0.22, value: 5.4, impact: 'negative' },
      ],
    },
  },
  {
    id: 'blitz',
    label: 'Carga defensiva Blitz',
    summary: 'Linebackers y un safety atacan al QB junto con la línea.',
    steps: ['Un LB y un S se suman al rush.', 'El QB tiene menos de 3 segundos para lanzar.', 'El receptor corta pero llega tarde el balón.'],
    players: lineup('shotgun_11'),
    frames: buildFrames({
      1: [[30, 26.65], [26, 26.65]],
      16: [[39.5, 20.65], [34, 24], [28, 26.2]],
      21: [[47, 19.65], [38, 23], [29, 26]],
      18: [[39.5, 32.65], [33, 30], [27.5, 27.5]],
      3: [[34, 5], [38, 5], [45, 12]],
      19: [[36.5, 5], [39, 6], [46, 11.5]],
    }),
    effectiveness: {
      score: 0.34,
      label: '34%',
      factors: [
        { name: 'Presión al QB', weight: 0.4, value: 3.6, impact: 'negative' },
        { name: 'Tiempo de lanzamiento', weight: 0.3, value: 1.8, impact: 'negative' },
        { name: 'Separación del receptor', weight: 0.18, value: 1.2, impact: 'neutral' },
      ],
    },
  },
]

export const BASIC_PLAY_FPS = FPS
