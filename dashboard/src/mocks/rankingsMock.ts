import type { RankingsResponse } from '../types/api'

export const rankingsMock: RankingsResponse = {
  individual: [
    { rank: 1, username: 'ChiefsNation_88', fan_team: 'KC', total_score: 1420, avg_effectiveness: 0.71, streak: 7, challenges_completed: 12 },
    { rank: 2, username: 'BillsMafia_Ana', fan_team: 'BUF', total_score: 1355, avg_effectiveness: 0.69, streak: 5, challenges_completed: 11 },
    { rank: 3, username: 'Niners_Carlos', fan_team: 'SF', total_score: 1290, avg_effectiveness: 0.66, streak: 4, challenges_completed: 11 },
    { rank: 4, username: 'LionsRoar_Mx', fan_team: 'DET', total_score: 1210, avg_effectiveness: 0.64, streak: 3, challenges_completed: 10 },
    { rank: 5, username: 'RavensFlock', fan_team: 'BAL', total_score: 1180, avg_effectiveness: 0.62, streak: 2, challenges_completed: 10 },
  ],
  fan_leagues: [
    { rank: 1, team_abbr: 'KC', team_name: 'Kansas City Chiefs', avg_score: 980, avg_effectiveness: 0.68, participant_count: 134 },
    { rank: 2, team_abbr: 'BAL', team_name: 'Baltimore Ravens', avg_score: 955, avg_effectiveness: 0.67, participant_count: 98 },
    { rank: 3, team_abbr: 'BUF', team_name: 'Buffalo Bills', avg_score: 931, avg_effectiveness: 0.65, participant_count: 87 },
    { rank: 4, team_abbr: 'DET', team_name: 'Detroit Lions', avg_score: 912, avg_effectiveness: 0.64, participant_count: 76 },
    { rank: 5, team_abbr: 'SF', team_name: 'San Francisco 49ers', avg_score: 899, avg_effectiveness: 0.63, participant_count: 121 },
  ],
  total_participants: 847,
  last_updated_ms: 1700000000000,
}

export const rankingsSubmitMock = {
  submitted: true,
  new_rank: 4,
  message: '¡Buen intento! Estás en el top 5 de aficionados de KC.',
}
