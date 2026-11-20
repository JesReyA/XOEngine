import type { TeamResponse } from '../types/api'

export const teamMock: TeamResponse = {
  team_abbr: 'KC',
  team_name: 'Kansas City Chiefs',
  schedule: [
    { game_id: '2022090800', week: 1, opponent: 'ARI', home: false, result: 'W 44-21' },
    { game_id: '2022091500', week: 2, opponent: 'LAC', home: true, result: 'W 27-24' },
    { game_id: '2022092200', week: 3, opponent: 'IND', home: true, result: 'W 17-20' },
    { game_id: '2022092900', week: 4, opponent: 'TB', home: false, result: 'L 41-31' },
    { game_id: '2022100600', week: 5, opponent: 'LV', home: true, result: 'W 30-29' },
    { game_id: '2022101300', week: 6, opponent: 'BUF', home: false, result: 'L 24-20' },
    { game_id: '2022102000', week: 7, opponent: 'SF', home: true, result: 'W 19-10' },
  ],
  key_players: [
    { player_id: 53441, display_name: 'Patrick Mahomes', position: 'QB', max_speed: 9.6, avg_separation: 0, form_index: 91 },
    { player_id: 43299, display_name: 'Travis Kelce', position: 'TE', max_speed: 10.1, avg_separation: 2.6, form_index: 84 },
    { player_id: 52444, display_name: 'Xavier Worthy', position: 'WR', max_speed: 11.0, avg_separation: 3.1, form_index: 78 },
    { player_id: 47122, display_name: 'Isiah Pacheco', position: 'RB', max_speed: 10.3, avg_separation: 1.7, form_index: 69 },
  ],
  team_stats: {
    avg_play_speed: 5.4,
    offensive_efficiency: 0.63,
    red_zone_efficiency: 0.58,
    favorite_formation: '11 personnel',
  },
  next_opponent: { team_abbr: 'SEA', week: 8, tendencies: ['blitz_heavy', 'cover_2'] },
}
