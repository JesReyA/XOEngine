import { useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../../services/api'
import { getUsername, setFanTeam, setUsername } from '../../services/storage'
import type { ChallengeResponse, RankingsSubmitResponse } from '../../types/api'
import ErrorBanner from '../shared/ErrorBanner'

interface ChallengeSummaryProps {
  results: ChallengeResponse[]
  fanTeam: string
  onRestart: () => void
  onGoRankings: () => void
}

export default function ChallengeSummary({ results, fanTeam, onRestart, onGoRankings }: ChallengeSummaryProps) {
  const [name, setName] = useState(getUsername() ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<RankingsSubmitResponse | null>(null)

  const total = results.reduce((s, r) => s + r.score_earned, 0)
  const avg = results.length ? results.reduce((s, r) => s + r.effectiveness.score, 0) / results.length : 0

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const username = name.trim()
    if (username.length < 3 || busy) return
    setBusy(true)
    setError(null)
    try {
      setUsername(username)
      setFanTeam(fanTeam)
      setSent(
        await api.submitRanking({
          username,
          fan_team: fanTeam,
          total_score: total,
          avg_effectiveness: +avg.toFixed(4),
          challenges_completed: results.length,
        }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar tu resultado.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="max-w-2xl space-y-5 animate-panel-enter" aria-labelledby="summary-title">
      <h2 id="summary-title" className="text-2xl font-bold">Reto completado</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-xo-elevated border border-xo-border rounded-card p-4">
          <p className="text-xs text-xo-text-secondary">Puntuación total</p>
          <p className="font-mono text-3xl font-bold text-xo-fan-accent">{total}</p>
        </div>
        <div className="bg-xo-elevated border border-xo-border rounded-card p-4">
          <p className="text-xs text-xo-text-secondary">Efectividad media</p>
          <p className="font-mono text-3xl font-bold">{Math.round(avg * 100)}%</p>
        </div>
      </div>

      <ol className="bg-xo-elevated border border-xo-border rounded-card divide-y divide-xo-border">
        {results.map((r, i) => (
          <li key={i} className="flex items-center justify-between px-4 py-2 text-sm">
            <span>Jugada {i + 1}</span>
            <span className="font-mono text-xo-text-secondary">{Math.round(r.effectiveness.score * 100)}%</span>
            <span className="font-mono font-bold">+{r.score_earned}</span>
          </li>
        ))}
      </ol>

      {error && <ErrorBanner message={error} />}

      {sent ? (
        <div className="bg-xo-elevated border border-xo-border rounded-card p-4">
          <p className="text-sm">{sent.message}</p>
          <p className="mt-1 text-sm text-xo-text-secondary">
            Tu posición: <span className="font-mono font-bold text-xo-text-primary">#{sent.new_rank}</span>
          </p>
          <div className="mt-3 flex gap-3">
            <button type="button" onClick={onGoRankings} className="bg-xo-fan-accent hover:bg-amber-400 text-xo-deep-bg font-semibold px-5 py-2.5 rounded-chip press-tactile">
              Ver rankings
            </button>
            <button type="button" onClick={onRestart} className="border border-xo-border text-xo-text-secondary hover:text-xo-text-primary hover:border-xo-fan-accent px-5 py-2.5 rounded-chip press-tactile">
              Jugar de nuevo
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label htmlFor="username" className="text-sm text-xo-text-secondary">Tu nombre en el ranking</label>
            <input
              id="username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="Ej. ChiefsNation_88"
              className="mt-1 w-full bg-xo-surface border border-xo-border rounded-chip px-3 py-2 text-sm placeholder:text-xo-text-muted focus:border-xo-fan-accent outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={name.trim().length < 3 || busy}
            className="bg-xo-fan-accent hover:bg-amber-400 text-xo-deep-bg font-semibold px-5 py-2.5 rounded-chip press-tactile disabled:opacity-50 disabled:pointer-events-none"
          >
            {busy ? 'Enviando…' : 'Enviar al ranking'}
          </button>
        </form>
      )}
    </section>
  )
}
