import type { StatsResponse } from '../types/api'

// Velocidades en yardas por segundo.
export const statsMock: StatsResponse = {
  league_averages: { avg_speed: 4.82, avg_separation: 2.1, avg_acceleration: 1.3 },
  top_players: [
    { player_id: 25511, display_name: 'Tyreek Hill', team: 'MIA', position: 'WR', max_speed: 11.2, avg_separation: 3.4, avg_yards_after_contact: 4.1 },
    { player_id: 52444, display_name: 'Xavier Worthy', team: 'KC', position: 'WR', max_speed: 11.0, avg_separation: 3.1, avg_yards_after_contact: 3.2 },
    { player_id: 43290, display_name: 'Lamar Jackson', team: 'BAL', position: 'QB', max_speed: 10.9, avg_separation: 0, avg_yards_after_contact: 3.8 },
    { player_id: 46116, display_name: 'Deebo Samuel', team: 'SF', position: 'WR', max_speed: 10.8, avg_separation: 2.9, avg_yards_after_contact: 5.6 },
    { player_id: 47801, display_name: 'Jahmyr Gibbs', team: 'DET', position: 'RB', max_speed: 10.6, avg_separation: 1.8, avg_yards_after_contact: 3.9 },
  ],
  fun_facts: [
    { id: 'ff_001', text: 'Tyreek Hill alcanzó 11.2 yardas por segundo, unos 37 km/h, la punta más alta registrada en la muestra.', category: 'speed' },
    { id: 'ff_002', text: 'El receptor que más separación generó promedió 3.4 yardas sobre su cobertura en rutas largas.', category: 'separation' },
    { id: 'ff_003', text: 'Las jugadas con 5 o más defensas pegados a la línea de scrimmage terminan 18% más cortas que el promedio.', category: 'formation' },
    { id: 'ff_004', text: 'En tercer down con 7 o más yardas por recorrer, el blitz sube a 41% en las defensas más agresivas.', category: 'situation' },
  ],
  total_plays: 18420,
  total_games: 512,
}
