import { FORMATIONS, fieldZoneToX } from '../constants/formations'
import type {
  ChallengeOption,
  ChallengeResponse,
  ChallengeScenario,
  ChallengeScenariosResponse,
  ChallengeSituation,
} from '../types/api'
import { simulateMock } from './simulateMock'

const OPTIONS: ChallengeOption[] = [
  { id: 'option_a', label: 'Run up the middle', description: 'Corrida al centro con el RB tras el bloqueo de los guardias.' },
  { id: 'option_b', label: 'QB sneak', description: 'El mariscal avanza detrás del centro para ganar la yarda necesaria.' },
  { id: 'option_c', label: 'Play-action deep', description: 'Finta de corrida y pase profundo al receptor más rápido.' },
]

function scenario(
  step: number,
  description: string,
  situation: ChallengeSituation,
  formation: number,
): ChallengeScenario {
  const ls = fieldZoneToX(situation.field_zone)
  return {
    step,
    description,
    scenario: {
      ...situation,
      quarter: [1, 2, 3, 4, 4][step - 1],
      clock: ['14:32', '0:48', '6:15', '9:40', '2:05'][step - 1],
      situation_text: description,
    },
    players: FORMATIONS[formation % FORMATIONS.length].build(ls),
    options: OPTIONS,
  }
}

export const challengeScenariosMock: ChallengeScenariosResponse = {
  game_id: '2022090800',
  fan_team: 'KC',
  scenarios: [
    scenario(1, 'Primer down desde tu propia yarda 25. El marcador está empatado.', { down: 1, yards_to_go: 10, field_zone: 'own_25', score_diff: 0 }, 0),
    scenario(2, 'Cuarto down y una yarda en zona roja. Ganas por tres.', { down: 4, yards_to_go: 1, field_zone: 'red_zone', score_diff: 3 }, 1),
    scenario(3, 'Tercer down y siete en medio campo. Pierdes por tres.', { down: 3, yards_to_go: 7, field_zone: 'midfield', score_diff: -3 }, 0),
    scenario(4, 'Segundo down y cinco en territorio rival.', { down: 2, yards_to_go: 5, field_zone: 'opp_35', score_diff: 7 }, 2),
    scenario(5, 'Tercer down y dos, últimos minutos del cuarto periodo.', { down: 3, yards_to_go: 2, field_zone: 'opp_28', score_diff: -4 }, 1),
  ],
}

export const challengeResponseMock: ChallengeResponse = {
  challenge_step: 2,
  interpreted_play: {
    description: 'Ruta fly de WR1 con cruce del TE y acción de pase del QB.',
    players: [
      { player_id: 3, role: 'WR1', team: 'offense', x: 94, y: 5, route: 'fly' },
      { player_id: 6, role: 'TE', team: 'offense', x: 94, y: 33.5, route: 'cross' },
    ],
  },
  frames: simulateMock.frames,
  total_frames: simulateMock.total_frames,
  fps: simulateMock.fps,
  effectiveness: {
    score: 0.54,
    label: '54%',
    factors: [
      { name: 'Separación del receptor', weight: 0.28, value: 1.9, impact: 'positive' },
      { name: 'Presión al QB', weight: 0.3, value: 1.8, impact: 'negative' },
    ],
  },
  verdict:
    'Tu decisión abre espacio en el centro, pero la presión de la línea defensiva reduce el tiempo de lanzamiento. Efectividad estimada: 54%.',
  options_reference: [
    { id: 'option_a', label: 'Run up the middle', effectiveness: 0.48 },
    { id: 'option_b', label: 'QB sneak', effectiveness: 0.61 },
    { id: 'option_c', label: 'Play-action deep', effectiveness: 0.55 },
  ],
  score_earned: 72,
  is_last_step: false,
}
