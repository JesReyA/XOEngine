// Tipos del contrato de API (.kiro/steering/02-api-contract.md).

export type Mode = 'coach' | 'fan'
export type CurrentView =
  | 'board'
  | 'scouting'
  | 'stats'
  | 'team'
  | 'challenge'
  | 'rankings'
  | 'academy'
export type DecisionType = 'option_a' | 'option_b' | 'option_c' | 'free_text'
export type ImpactType = 'positive' | 'negative' | 'neutral'
export type Severity = 'high' | 'medium' | 'low'

// ── Simulación ──
export interface GameContext {
  down: number
  yards_to_go: number
  field_zone: string
  quarter: number
  score_diff: number
}

export interface PlayerInput {
  player_id: number
  role: string
  team: 'offense' | 'defense'
  x: number
  y: number
  route?: string | null
  coverage?: string | null
}

export interface PlayerFrame {
  player_id: number
  x: number
  y: number
  speed: number
  dir: number
}

export interface SimFrame {
  frame: number
  t_ms: number
  players: PlayerFrame[]
}

export interface EffectivenessFactor {
  name: string
  weight: number
  value: number
  impact: ImpactType
}

export interface Effectiveness {
  score: number
  label: string
  factors: EffectivenessFactor[]
}

export interface SimulateRequest {
  game_context: GameContext
  offense_team: string
  defense_team: string
  players: PlayerInput[]
  play_type: string
  mode: Mode
}

export interface SimulateResponse {
  play_id_ref: string
  frames: SimFrame[]
  total_frames: number
  fps: number
  effectiveness: Effectiveness
  similar_plays_found: number
}

// ── Chat ──
export interface ChatContext {
  current_play: {
    play_id_ref: string
    effectiveness_score: number
    players: PlayerInput[]
  } | null
  fan_team: string | null
  current_view: CurrentView
}

export interface ChatRequest {
  message: string
  mode: Mode
  context?: ChatContext | null
}

export interface SuggestedPlayer {
  player_id: number
  x: number
  y: number
  route?: string
}

export interface ChatResponse {
  reply: string
  suggested_players: SuggestedPlayer[]
  navigate_to: CurrentView | null
  data_sources: string[]
  ai_available: boolean
}

// ── Stats ──
export interface TopPlayer {
  player_id: number
  display_name: string
  team: string
  position: string
  max_speed: number
  avg_separation: number
  avg_yards_after_contact: number
}

export interface FunFact {
  id: string
  text: string
  category: string
}

export interface StatsResponse {
  league_averages: {
    avg_speed: number
    avg_separation: number
    avg_acceleration: number
  }
  top_players: TopPlayer[]
  fun_facts: FunFact[]
  total_plays: number
  total_games: number
}

// ── Equipo ──
export interface ScheduleEntry {
  game_id: string
  week: number
  opponent: string
  home: boolean
  result: string
}

export interface KeyPlayer {
  player_id: number
  display_name: string
  position: string
  max_speed: number
  avg_separation: number
  form_index: number
}

export interface TeamResponse {
  team_abbr: string
  team_name: string
  schedule: ScheduleEntry[]
  key_players: KeyPlayer[]
  team_stats: {
    avg_play_speed: number
    offensive_efficiency: number
    red_zone_efficiency: number
    favorite_formation: string
  }
  next_opponent: {
    team_abbr: string
    week: number
    tendencies: string[]
  }
}

// ── Scouting ──
export interface ScoutingAlert {
  id: string
  severity: Severity
  type: string
  message: string
  stat_key: string
  value: number
  percentile: number
}

export interface ScoutingResponse {
  player_profile: {
    player_id: number
    display_name: string
    team: string
    position: string
    stats: {
      max_speed: number
      avg_speed: number
      avg_separation: number
      separation_percentile: number
      favorite_zones: string[]
      effectiveness_by_formation: Record<string, number>
    }
  }
  team_profile: {
    team: string
    avg_play_speed: number
    blitz_rate: number
    third_down_blitz_rate: number
    coverage_distribution: {
      cover_1: number
      cover_2: number
      cover_3: number
      cover_4: number
    }
  }
  critical_alerts: ScoutingAlert[]
}

// ── Reto de 5 jugadas ──
export interface ChallengeSituation {
  down: number
  yards_to_go: number
  field_zone: string
  score_diff: number
}

export interface ChallengeOption {
  id: Exclude<DecisionType, 'free_text'>
  label: string
  description: string
}

export interface ChallengeScenario {
  step: number
  description: string
  scenario: ChallengeSituation
  players: PlayerInput[]
  options: ChallengeOption[]
}

// GET api/challenge (extensión pendiente de consenso en el contrato)
export interface ChallengeScenariosResponse {
  game_id: string
  fan_team: string | null
  scenarios: ChallengeScenario[]
}

export interface ChallengeRequest {
  game_id: string
  challenge_step: number
  fan_team: string
  scenario: ChallengeSituation
  decision_type: DecisionType
  selected_option: string | null
  free_text: string | null
  mode: Mode
}

export interface ChallengeResponse {
  challenge_step: number
  interpreted_play: {
    description: string
    players: PlayerInput[]
  }
  frames: SimFrame[]
  total_frames: number
  fps: number
  effectiveness: Effectiveness
  verdict: string
  options_reference: Array<{ id: string; label: string; effectiveness: number }>
  score_earned: number
  is_last_step: boolean
}

// ── Rankings ──
export interface IndividualRank {
  rank: number
  username: string
  fan_team: string
  total_score: number
  avg_effectiveness: number
  streak: number
  challenges_completed: number
}

export interface FanLeagueRank {
  rank: number
  team_abbr: string
  team_name: string
  avg_score: number
  avg_effectiveness: number
  participant_count: number
}

export interface RankingsResponse {
  individual: IndividualRank[]
  fan_leagues: FanLeagueRank[]
  total_participants: number
  last_updated_ms: number
}

export interface RankingsSubmitRequest {
  username: string
  fan_team: string
  total_score: number
  avg_effectiveness: number
  challenges_completed: number
}

export interface RankingsSubmitResponse {
  submitted: boolean
  new_rank: number
  message: string
}
