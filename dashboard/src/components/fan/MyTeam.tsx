import { useEffect, useMemo, useState } from 'react'
import { NFL_TEAMS, teamByAbbr } from '../../constants/teams'
import { api } from '../../services/api'
import type { TeamResponse } from '../../types/api'
import Select from '../shared/Select'
import FormArc from './FormArc'

const STORAGE_KEY = 'xo_fan_team'
const TEAM_OPTIONS = NFL_TEAMS.map((t) => ({ value: t.abbr, label: `${t.abbr} · ${t.name}` }))

const TENDENCY_STYLE: Record<string, string> = {
  blitz_heavy: 'bg-xo-danger/15 text-xo-danger',
  cover_2: 'bg-xo-electric/15 text-xo-violet',
  cover_3: 'bg-xo-electric/15 text-xo-violet',
}
const tendencyLabel = (t: string) => t.replace(/_/g, ' ')

function readStoredTeam(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'KC'
  } catch {
    return 'KC'
  }
}

export default function MyTeam() {
  const [selected, setSelected] = useState(readStoredTeam)
  const [data, setData] = useState<TeamResponse | null>(null)

  useEffect(() => {
    let cancelled = false
    setData(null)
    api.team(selected).then((d) => {
      if (!cancelled) setData(d)
    })
    return () => {
      cancelled = true
    }
  }, [selected])

  const choose = (abbr: string) => {
    setSelected(abbr)
    try {
      localStorage.setItem(STORAGE_KEY, abbr)
    } catch {
      /* almacenamiento no disponible: la selección sigue vigente en memoria */
    }
  }

  const record = useMemo(() => {
    const games = data?.schedule ?? []
    const wins = games.filter((g) => g.result.startsWith('W')).length
    const losses = games.filter((g) => g.result.startsWith('L')).length
    return wins + losses === 0 ? 'sin resultados' : `${wins}-${losses}`
  }, [data])

  const team = teamByAbbr(selected)
  const name = data?.team_name ?? team?.name ?? selected

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 48 48" className="w-14 h-14" role="img" aria-label={`Logo de ${name}`}>
            <circle cx="24" cy="24" r="22" fill={team?.color ?? '#232A42'} stroke="#232A42" strokeWidth="2" />
            <text x="24" y="25" textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize="14" fontWeight="700">
              {selected}
            </text>
          </svg>
          <div>
            <h1 className="text-2xl font-bold">{name}</h1>
            <p className="text-sm text-xo-text-secondary">
              Récord <span className="font-mono font-bold text-xo-text-primary">{record}</span>
              {data && <> · Formación favorita: {data.team_stats.favorite_formation}</>}
            </p>
          </div>
        </div>
        <Select label="Equipo favorito" value={selected} options={TEAM_OPTIONS} onChange={choose} className="w-64" />
      </header>

      {!data ? (
        <div className="grid gap-4 md:grid-cols-2 animate-pulse" aria-busy="true">
          <div className="h-64 rounded-card bg-xo-elevated" />
          <div className="h-64 rounded-card bg-xo-elevated" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="bg-xo-elevated border border-xo-border rounded-card p-4" aria-labelledby="sched-title">
            <h2 id="sched-title" className="text-lg font-semibold mb-3">Calendario</h2>
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-xo-text-secondary">
                <tr><th className="pb-2 font-medium">Sem</th><th className="pb-2 font-medium">Rival</th><th className="pb-2 font-medium">Sede</th><th className="pb-2 font-medium text-right">Resultado</th></tr>
              </thead>
              <tbody>
                {data.schedule.map((g) => (
                  <tr key={g.game_id} className="border-t border-xo-border">
                    <td className="py-2 font-mono">{g.week}</td>
                    <td className="py-2">{g.opponent}</td>
                    <td className="py-2 text-xo-text-secondary">{g.home ? 'Local' : 'Visitante'}</td>
                    <td className={`py-2 text-right font-mono ${g.result.startsWith('W') ? 'text-xo-success' : g.result.startsWith('L') ? 'text-xo-danger' : 'text-xo-text-muted'}`}>{g.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="bg-xo-elevated border border-xo-border rounded-card p-4" aria-labelledby="players-title">
            <h2 id="players-title" className="text-lg font-semibold mb-3">Jugadores clave</h2>
            <ul className="space-y-3">
              {data.key_players.map((p) => (
                <li key={p.player_id} className="flex items-center gap-3">
                  <FormArc value={p.form_index} />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.display_name}</p>
                    <p className="text-xs text-xo-text-secondary">
                      {p.position} · máx. <span className="font-mono">{p.max_speed.toFixed(1)}</span> yd/s
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-xo-elevated border border-xo-border rounded-card p-4 md:col-span-2" aria-labelledby="next-title">
            <h2 id="next-title" className="text-lg font-semibold">
              Próximo rival: {data.next_opponent.team_abbr}
              <span className="ml-2 text-sm font-normal text-xo-text-secondary">Semana {data.next_opponent.week}</span>
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.next_opponent.tendencies.map((t) => (
                <span key={t} className={`text-xs font-medium px-2 py-0.5 rounded-pill ${TENDENCY_STYLE[t] ?? 'bg-xo-border text-xo-text-secondary'}`}>
                  {tendencyLabel(t)}
                </span>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
