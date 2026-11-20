"""Modelos Pydantic v2 del contrato de API (ver .kiro/steering/02-api-contract.md)."""
from typing import Literal

from pydantic import BaseModel, ConfigDict

Mode = Literal["coach", "fan"]
CurrentView = Literal["board", "scouting", "stats", "challenge", "rankings", "academy", "team"]
DecisionType = Literal["option_a", "option_b", "option_c", "free_text"]
ImpactType = Literal["positive", "negative", "neutral"]
Severity = Literal["high", "medium", "low"]


class _Base(BaseModel):
    model_config = ConfigDict(extra="ignore")


# ---------------------------------------------------------------- /health
class HealthResponse(_Base):
    status: str = "ok"


# ---------------------------------------------------------------- /api/simulate
class GameContext(_Base):
    down: int
    yards_to_go: int
    field_zone: str
    quarter: int = 2
    score_diff: int = 0


class PlayerInput(_Base):
    player_id: int
    role: str
    team: Literal["offense", "defense"]
    x: float
    y: float
    route: str | None = None
    coverage: str | None = None


class SimulateRequest(_Base):
    game_context: GameContext
    offense_team: str
    defense_team: str
    players: list[PlayerInput]
    play_type: str = "pass"
    mode: Mode = "coach"


class EffectivenessFactor(_Base):
    name: str
    weight: float
    value: float
    impact: ImpactType


class Effectiveness(_Base):
    score: float
    label: str
    factors: list[EffectivenessFactor]


class PlayerFrame(_Base):
    player_id: int
    x: float
    y: float
    speed: float
    dir: float


class SimFrame(_Base):
    frame: int
    t_ms: int
    players: list[PlayerFrame]


class SimulateResponse(_Base):
    play_id_ref: str
    frames: list[SimFrame]
    total_frames: int
    fps: int
    effectiveness: Effectiveness
    similar_plays_found: int


# ---------------------------------------------------------------- /api/stats
class LeagueAverages(_Base):
    avg_speed: float
    avg_separation: float
    avg_acceleration: float


class TopPlayer(_Base):
    player_id: int
    display_name: str
    team: str
    position: str
    max_speed: float
    avg_separation: float
    avg_yards_after_contact: float


class FunFact(_Base):
    id: str
    text: str
    category: str


class StatsResponse(_Base):
    league_averages: LeagueAverages
    top_players: list[TopPlayer]
    fun_facts: list[FunFact]
    total_plays: int
    total_games: int


# ---------------------------------------------------------------- /api/team/{team_abbr}
class ScheduleItem(_Base):
    game_id: str
    week: int
    opponent: str
    home: bool
    result: str


class KeyPlayer(_Base):
    player_id: int
    display_name: str
    position: str
    max_speed: float
    avg_separation: float
    form_index: int


class TeamStats(_Base):
    avg_play_speed: float
    offensive_efficiency: float
    red_zone_efficiency: float
    favorite_formation: str


class NextOpponent(_Base):
    team_abbr: str
    week: int
    tendencies: list[str]


class TeamResponse(_Base):
    team_abbr: str
    team_name: str
    schedule: list[ScheduleItem]
    key_players: list[KeyPlayer]
    team_stats: TeamStats
    next_opponent: NextOpponent | None = None


# ---------------------------------------------------------------- /api/scouting
class PlayerScoutingStats(_Base):
    max_speed: float
    avg_speed: float
    avg_separation: float
    separation_percentile: int
    favorite_zones: list[str]
    effectiveness_by_formation: dict[str, float]


class PlayerProfile(_Base):
    player_id: int
    display_name: str
    team: str
    position: str
    stats: PlayerScoutingStats


class TeamProfile(_Base):
    team: str
    avg_play_speed: float
    blitz_rate: float
    third_down_blitz_rate: float
    coverage_distribution: dict[str, float]


class CriticalAlert(_Base):
    id: str
    severity: Severity
    type: str
    message: str
    stat_key: str
    value: float
    percentile: int


class ScoutingResponse(_Base):
    player_profile: PlayerProfile | None = None
    team_profile: TeamProfile | None = None
    critical_alerts: list[CriticalAlert] = []


# ---------------------------------------------------------------- /api/challenge
class ChallengeScenario(_Base):
    down: int
    yards_to_go: int
    field_zone: str
    score_diff: int = 0


class ChallengeRequest(_Base):
    game_id: str
    challenge_step: int
    fan_team: str
    scenario: ChallengeScenario
    decision_type: DecisionType
    selected_option: str | None = None
    free_text: str | None = None
    mode: Mode = "fan"


class InterpretedPlay(_Base):
    description: str
    players: list[PlayerInput]


class OptionReference(_Base):
    id: str
    label: str
    effectiveness: float


class ChallengeResponse(_Base):
    challenge_step: int
    interpreted_play: InterpretedPlay
    frames: list[SimFrame]
    total_frames: int
    fps: int
    effectiveness: Effectiveness
    verdict: str
    options_reference: list[OptionReference]
    score_earned: int
    is_last_step: bool


# ---------------------------------------------------------------- /api/rankings
class IndividualRanking(_Base):
    rank: int
    username: str
    fan_team: str
    total_score: int
    avg_effectiveness: float
    streak: int
    challenges_completed: int


class FanLeagueRanking(_Base):
    rank: int
    team_abbr: str
    team_name: str
    avg_score: float
    avg_effectiveness: float
    participant_count: int


class RankingsResponse(_Base):
    individual: list[IndividualRanking]
    fan_leagues: list[FanLeagueRanking]
    total_participants: int
    last_updated_ms: int


class RankingsSubmitRequest(_Base):
    username: str
    fan_team: str
    total_score: int
    avg_effectiveness: float
    challenges_completed: int


class RankingsSubmitResponse(_Base):
    submitted: bool
    new_rank: int
    message: str


# ---------------------------------------------------------------- /api/chat
class ChatContext(_Base):
    current_play: dict | None = None
    fan_team: str | None = None
    current_view: str = "board"


class ChatRequest(_Base):
    message: str
    mode: Mode = "fan"
    context: ChatContext | None = None


class ChatResponse(_Base):
    reply: str
    suggested_players: list[dict] = []
    navigate_to: str | None = None
    data_sources: list[str] = []
    ai_available: bool
