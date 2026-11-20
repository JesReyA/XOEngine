import { useEffect, useState } from 'react'
import { NFL_TEAMS } from '../../constants/teams'
import { useApiResource } from '../../hooks/useApiResource'
import { api } from '../../services/api'
import type { StatsResponse } from '../../types/api'
import ErrorBanner from '../shared/ErrorBanner'
import LoadingSkeleton from '../shared/LoadingSkeleton'
import Select from '../shared/Select'
import AlertCard from './AlertCard'
import CoverageRadar from './CoverageRadar'
import PlayerProfileCard from './PlayerProfileCard'

interface ScoutingPanelProps {
  team: string // rival a analizar
  opponent: string | null // equipo propio (activa alertas comparativas)
}

const TEAM_OPTIONS = [
  { value: '', label: 'Selecciona un rival' },
  ...NFL_TEAMS.map((t) => ({ value: t.abbr, label: `${t.abbr} · ${t.name}` })),
]

const pct = (v: number) => `${Math.round(v * 100)}%`

export default function ScoutingPanel({ team, opponent }: ScoutingPanelProps) {
  const [rival, setRival] = useState(team)
  const [playerId, setPlayerId] = useState('')
  const [players, setPlayers] = useState<StatsResponse['top_players']>([])
  const { data, error, loading, reload } = useApiResource(
    () =>
      api.scouting({
        team: rival,
        opponent: opponent ?? undefined,
        player_id: playerId ? Number(playerId) : undefined,
      }),
    [rival, opponent, playerId],
    rival !== '',
  )

  // Jugadores del rival para el selector de perfil individual.
  useEffect(() => {
    setPlayerId('')
    if (!rival) {
      setPlayers([])
      return
    }
    let cancelled = false
    api.stats({ team: rival }).then((s) => {
      if (!cancelled) setPlayers(s.top_players.filter((p) => p.team === rival || !rival))
    })
    return () => {
      cancelled = true
    }
  }, [rival])

  const playerOptions = [
    { value: '', label: 'Sin jugador' },
    ...players.map((p) => ({ value: String(p.player_id), label: `${p.display_name} (${p.position})` })),
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Scouting del rival</h1>
          <p className="mt-1 text-sm text-xo-text-secondary">Tendencias y alertas por percentil de liga.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select label="Equipo rival" value={rival} options={TEAM_OPTIONS} onChange={setRival} className="w-60" />
          <Select label="Jugador" value={playerId} options={playerOptions} onChange={setPlayerId} className="w-56" />
        </div>
      </header>

      {!rival ? (
        <p className="py-16 text-center text-sm text-xo-text-secondary">Selecciona un rival para ver su scouting</p>
      ) : error ? (
        <ErrorBanner message={error} onRetry={reload} />
      ) : loading || !data ? (
        <LoadingSkeleton count={2} className="h-72" />
      ) : (
        <>
          {data.player_profile && <PlayerProfileCard profile={data.player_profile} />}

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="bg-xo-elevated border border-xo-border rounded-card p-4" aria-labelledby="team-profile-title">
              <h2 id="team-profile-title" className="text-lg font-semibold">Perfil de {data.team_profile.team}</h2>
              <dl className="mt-3 grid grid-cols-3 gap-3">
                <div><dt className="text-xs text-xo-text-secondary">Velocidad de jugada</dt><dd className="font-mono text-2xl font-bold">{data.team_profile.avg_play_speed.toFixed(1)}</dd></div>
                <div><dt className="text-xs text-xo-text-secondary">Blitz</dt><dd className="font-mono text-2xl font-bold">{pct(data.team_profile.blitz_rate)}</dd></div>
                <div><dt className="text-xs text-xo-text-secondary">Blitz en 3ro</dt><dd className="font-mono text-2xl font-bold">{pct(data.team_profile.third_down_blitz_rate)}</dd></div>
              </dl>
              <h3 className="mt-4 text-sm font-semibold text-xo-text-secondary">Distribución de coberturas</h3>
              <CoverageRadar distribution={data.team_profile.coverage_distribution} />
            </section>

            <section aria-labelledby="alerts-title">
              <h2 id="alerts-title" className="text-lg font-semibold mb-3">Alertas críticas</h2>
              {data.critical_alerts.length === 0 ? (
                <p className="text-sm text-xo-text-secondary">Sin alertas para este rival.</p>
              ) : (
                <ul className="space-y-3">
                  {data.critical_alerts.map((a, i) => (
                    <AlertCard key={a.id} alert={a} index={i} />
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
