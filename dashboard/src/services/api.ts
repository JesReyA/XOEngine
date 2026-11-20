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

// Solo con VITE_USE_MOCK=true se ignora el backend por completo.
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

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

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    let detail = `Error ${res.status} del servidor`
    try {
      const body = (await res.json()) as { detail?: unknown }
      if (typeof body.detail === 'string') detail = body.detail
    } catch {
      /* cuerpo sin JSON: se conserva el mensaje genérico */
    }
    throw new ApiError(res.status, detail)
  }
  return (await res.json()) as T
}

// Endpoints ya implementados en el backend: errores reales llegan a la UI.
async function call<T>(url: string, mock: T, init?: RequestInit): Promise<T> {
  if (USE_MOCK) return mock
  return request<T>(url, init)
}

// Endpoints del Checkpoint 3 de backend (en desarrollo): si la ruta aún no existe
// (404, o 405 cuando el servidor sirve el build estático en `/`) se usa el mock.
// Cualquier otro error se propaga.
async function callWithFallback<T>(url: string, mock: T, init?: RequestInit): Promise<T> {
  if (USE_MOCK) return mock
  try {
    return await request<T>(url, init)
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 405)) return mock
    throw e
  }
}

export const api = {
  health: () => call<{ status: string }>('health', { status: 'mock' }),

  stats: (params?: { team?: string; player_id?: number }) =>
    call<StatsResponse>(`api/stats${query(params)}`, statsMock),

  team: (abbr: string) =>
    call<TeamResponse>(`api/team/${abbr}`, { ...teamMock, team_abbr: abbr }),

  scouting: (params?: { player_id?: number; team?: string; opponent?: string }) =>
    call<ScoutingResponse>(`api/scouting${query(params)}`, scoutingMock),

  simulate: (body: SimulateRequest) =>
    call<SimulateResponse>('api/simulate', simulateMock, post(body)),

  getChallenge: (params?: { team?: string }) =>
    callWithFallback<ChallengeScenariosResponse>(
      `api/challenge${query(params)}`,
      challengeScenariosMock,
    ),

  challenge: (body: ChallengeRequest) =>
    callWithFallback<ChallengeResponse>('api/challenge', challengeResponseMock, post(body)),

  rankings: (params?: { limit?: number; team?: string }) =>
    callWithFallback<RankingsResponse>(`api/rankings${query(params)}`, rankingsMock),

  submitRanking: (body: RankingsSubmitRequest) =>
    callWithFallback<RankingsSubmitResponse>('api/rankings/submit', rankingsSubmitMock, post(body)),

  chat: (body: ChatRequest) => callWithFallback<ChatResponse>('api/chat', chatMock, post(body)),
}
