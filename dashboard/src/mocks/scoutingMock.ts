import type { ScoutingResponse } from '../types/api'

export const scoutingMock: ScoutingResponse = {
  player_profile: {
    player_id: 25511,
    display_name: 'Tyreek Hill',
    team: 'MIA',
    position: 'WR',
    stats: {
      max_speed: 11.2,
      avg_speed: 8.3,
      avg_separation: 3.4,
      separation_percentile: 94,
      favorite_zones: ['deep_left', 'slot'],
      effectiveness_by_formation: { '11 personnel': 0.72, '12 personnel': 0.58 },
    },
  },
  team_profile: {
    team: 'KC',
    avg_play_speed: 5.4,
    blitz_rate: 0.28,
    third_down_blitz_rate: 0.41,
    coverage_distribution: { cover_1: 0.15, cover_2: 0.3, cover_3: 0.35, cover_4: 0.2 },
  },
  critical_alerts: [
    { id: 'alert_001', severity: 'high', type: 'blitz_tendency', message: 'KC ejecuta blitz en el 41% de las jugadas en 3ra oportunidad, percentil 92 de la liga.', stat_key: 'third_down_blitz_rate', value: 0.41, percentile: 92 },
    { id: 'alert_002', severity: 'medium', type: 'speed_advantage', message: 'Hill supera en velocidad al esquinero rival en rutas de más de 15 yardas.', stat_key: 'speed_mismatch', value: 1.9, percentile: 88 },
    { id: 'alert_003', severity: 'low', type: 'coverage_shell', message: 'KC alterna Cover 3 y Cover 2 de forma casi pareja en 1er down.', stat_key: 'cover_3_rate', value: 0.35, percentile: 61 },
  ],
}
