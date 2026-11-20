import { challengeResponseMock, challengeScenariosMock } from '../mocks/challengeMock'
import { chatMock } from '../mocks/chatMock'
import { rankingsMock, rankingsSubmitMock } from '../mocks/rankingsMock'
import { scoutingMock } from '../mocks/scoutingMock'
import { simulateMock } from '../mocks/simulateMock'
import { statsMock } from '../mocks/statsMock'
import { teamMock } from '../mocks/teamMock'
import type {
  ChallengeRequest,
  ChallengeResponse,
  ChallengeScenariosResponse,
  ChatRequest,
  ChatResponse,
  RankingsResponse,
  RankingsSubmitRequest,
  RankingsSubmitResponse,
  ScoutingResponse,
  SimulateRequest,
  SimulateResponse,
  StatsResponse,
  TeamResponse,
} from '../types/api'

// Fuerza los mocks sin llamar al backend (desarrollo independiente).
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// Rutas SIEMPRE relativas, sin diagonal inicial: la app vive en una subruta de AWS.
function query(params?: object): string {
  if (!params) return ''
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  }
  const s = qs.toString()
  return s ? `?${s}` : ''
}

const post = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

// Respaldo automático: si el backend no responde o devuelve error, se usa el mock.
async function call<T>(url: string, mock: T, init?: RequestInit): Promise<T> {
  if (USE_MOCK) return mock
  try {
    const res = await fetch(url, init)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  } catch {
    return mock
  }
}

export const api = {
  health: () => call<{ status: string }>('health', { status: 'mock' }),

  stats: (params?: { team?: string; player_id?: number }) =>
    call<StatsResponse>(`api/stats${query(params)}`, statsMock),

  team: (abbr: string) =>
    call<TeamResponse>(`api/team/${abbr}`, {
      ...teamMock,
      team_abbr: abbr,
    }),

  scouting: (params?: { player_id?: number; team?: string; opponent?: string }) =>
    call<ScoutingResponse>(`api/scouting${query(params)}`, scoutingMock),

  simulate: (body: SimulateRequest) =>
    call<SimulateResponse>('api/simulate', simulateMock, post(body)),

  getChallenge: (params?: { team?: string }) =>
    call<ChallengeScenariosResponse>(
      `api/challenge${query(params)}`,
      challengeScenariosMock,
    ),

  challenge: (body: ChallengeRequest) =>
    call<ChallengeResponse>('api/challenge', challengeResponseMock, post(body)),

  rankings: (params?: { limit?: number; team?: string }) =>
    call<RankingsResponse>(`api/rankings${query(params)}`, rankingsMock),

  submitRanking: (body: RankingsSubmitRequest) =>
    call<RankingsSubmitResponse>(
      'api/rankings/submit',
      rankingsSubmitMock,
      post(body),
    ),

  chat: (body: ChatRequest) => call<ChatResponse>('api/chat', chatMock, post(body)),
}
