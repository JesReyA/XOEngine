import { useMemo, useState } from 'react'
import { NFL_TEAMS } from '../../constants/teams'
import { useApiResource } from '../../hooks/useApiResource'
import { api } from '../../services/api'
import ErrorBanner from '../shared/ErrorBanner'
import LoadingSkeleton from '../shared/LoadingSkeleton'
import Select from '../shared/Select'
import FunFacts from './FunFacts'
import StatCard from './StatCard'
import TopSpeedChart from './TopSpeedChart'

const TEAM_OPTIONS = [
  { value: '', label: 'Toda la liga' },
  ...NFL_TEAMS.map((t) => ({ value: t.abbr, label: `${t.abbr} · ${t.name}` })),
]

interface StatsExplorerProps {
  onAsk: (text: string, autoSend?: boolean) => void
}

export default function StatsExplorer({ onAsk }: StatsExplorerProps) {
  const [team, setTeam] = useState('')
  const [query, setQuery] = useState('')
  const { data: stats, error, loading, reload } = useApiResource(
    () => api.stats(team ? { team } : undefined),
    [team],
  )
  const explain = (term: string) => () => onAsk(`¿Qué significa ${term} en la NFL? Explícalo para un principiante.`, true)

  const visible = useMemo(() => {
    if (!stats) return []
    const q = query.trim().toLowerCase()
    return q ? stats.top_players.filter((p) => p.display_name.toLowerCase().includes(q)) : stats.top_players
  }, [stats, query])

  return (
    <div className="space-y-8 max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Vive la NFL como nunca antes</h1>
          <p className="mt-1 text-sm text-xo-text-secondary">
            Datos reales de seguimiento de jugadores, explicados para aficionados.
          </p>
        </div>
        <Select label="Filtrar por equipo" value={team} options={TEAM_OPTIONS} onChange={setTeam} className="w-64" />
      </header>

      {error && <ErrorBanner message={error} onRetry={reload} />}
      {(loading || !stats) && !error && <LoadingSkeleton count={3} className="h-24" />}

      {stats && !loading && (
        <>
          <section aria-label="Promedios de liga" className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Velocidad promedio" value={stats.league_averages.avg_speed.toFixed(2)} unit="yd/s" onExplain={explain('la velocidad promedio')} />
            <StatCard label="Separación promedio" value={stats.league_averages.avg_separation.toFixed(1)} unit="yd" onExplain={explain('la separación promedio')} />
            <StatCard label="Aceleración promedio" value={stats.league_averages.avg_acceleration.toFixed(1)} unit="yd/s²" onExplain={explain('la aceleración promedio')} />
          </section>

          <section aria-labelledby="top-speed-title" className="bg-xo-elevated border border-xo-border rounded-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h2 id="top-speed-title" className="text-xl font-semibold">Top velocistas</h2>
                <button
                  type="button"
                  onClick={explain('la velocidad punta')}
                  className="text-xs text-xo-text-secondary hover:text-xo-fan-accent underline underline-offset-4 press-tactile"
                >
                  ¿Qué significa?
                </button>
              </div>
              <div>
                <label className="sr-only" htmlFor="player-search">Buscar jugador</label>
                <input
                  id="player-search"
                  list="player-names"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar jugador…"
                  className="w-56 bg-xo-surface border border-xo-border rounded-chip px-3 py-2 text-sm placeholder:text-xo-text-muted focus:border-xo-fan-accent outline-none"
                />
                <datalist id="player-names">
                  {stats.top_players.map((p) => (
                    <option key={p.player_id} value={p.display_name} />
                  ))}
                </datalist>
              </div>
            </div>
            <TopSpeedChart players={visible} />
          </section>

          <FunFacts facts={stats.fun_facts} />

          <p className="text-xs text-xo-text-muted">
            Muestra: {stats.total_plays.toLocaleString('es-MX')} jugadas en {stats.total_games} partidos.
          </p>
        </>
      )}
    </div>
  )
}
