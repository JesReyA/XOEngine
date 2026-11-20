import type { FanLeagueRank, IndividualRank } from '../../types/api'

const pct = (v: number) => `${Math.round(v * 100)}%`
const TH = 'pb-2 font-medium'

export function IndividualTable({ rows, me }: { rows: IndividualRank[]; me: string | null }) {
  return (
    <>
      <table className="hidden sm:table w-full text-sm">
        <thead className="text-left text-xs text-xo-text-secondary">
          <tr>
            <th className={TH}>#</th><th className={TH}>Usuario</th><th className={TH}>Equipo</th>
            <th className={`${TH} text-right`}>Puntuación</th><th className={`${TH} text-right`}>Efectividad %</th><th className={`${TH} text-right`}>Racha</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.rank}-${r.username}`} className={`border-t border-xo-border ${r.username === me ? 'bg-xo-fan-accent/10' : ''}`}>
              <td className="py-2 font-mono">{r.rank}</td>
              <td className="py-2">{r.username}{r.username === me && <span className="ml-2 text-xs text-xo-fan-accent">Tú</span>}</td>
              <td className="py-2 text-xo-text-secondary">{r.fan_team}</td>
              <td className="py-2 text-right font-mono">{r.total_score}</td>
              <td className="py-2 text-right font-mono">{pct(r.avg_effectiveness)}</td>
              <td className="py-2 text-right font-mono">{r.streak}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="sm:hidden space-y-2">
        {rows.map((r) => (
          <li key={`${r.rank}-${r.username}`} className={`rounded-chip border p-3 text-sm ${r.username === me ? 'border-xo-fan-accent bg-xo-fan-accent/10' : 'border-xo-border'}`}>
            <div className="flex justify-between"><span><span className="font-mono mr-2">#{r.rank}</span>{r.username}</span><span className="font-mono font-bold">{r.total_score}</span></div>
            <p className="mt-1 text-xs text-xo-text-secondary">{r.fan_team} · {pct(r.avg_effectiveness)} · racha {r.streak}</p>
          </li>
        ))}
      </ul>
    </>
  )
}

export function LeagueTable({ rows, myTeam }: { rows: FanLeagueRank[]; myTeam: string | null }) {
  return (
    <>
      <table className="hidden sm:table w-full text-sm">
        <thead className="text-left text-xs text-xo-text-secondary">
          <tr>
            <th className={TH}>#</th><th className={TH}>Franquicia</th>
            <th className={`${TH} text-right`}>Puntuación media</th><th className={`${TH} text-right`}>Efectividad %</th><th className={`${TH} text-right`}>Participantes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.team_abbr} className={`border-t border-xo-border ${r.team_abbr === myTeam ? 'bg-xo-fan-accent/10' : ''}`}>
              <td className="py-2 font-mono">{r.rank}</td>
              <td className="py-2">{r.team_name}</td>
              <td className="py-2 text-right font-mono">{Math.round(r.avg_score)}</td>
              <td className="py-2 text-right font-mono">{pct(r.avg_effectiveness)}</td>
              <td className="py-2 text-right font-mono">{r.participant_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="sm:hidden space-y-2">
        {rows.map((r) => (
          <li key={r.team_abbr} className={`rounded-chip border p-3 text-sm ${r.team_abbr === myTeam ? 'border-xo-fan-accent bg-xo-fan-accent/10' : 'border-xo-border'}`}>
            <div className="flex justify-between"><span><span className="font-mono mr-2">#{r.rank}</span>{r.team_name}</span><span className="font-mono font-bold">{Math.round(r.avg_score)}</span></div>
            <p className="mt-1 text-xs text-xo-text-secondary">{pct(r.avg_effectiveness)} · {r.participant_count} participantes</p>
          </li>
        ))}
      </ul>
    </>
  )
}
