import type { ScoutingResponse } from '../../types/api'

interface PlayerProfileCardProps {
  profile: NonNullable<ScoutingResponse['player_profile']>
}

export default function PlayerProfileCard({ profile }: PlayerProfileCardProps) {
  const s = profile.stats
  return (
    <section className="bg-xo-elevated border border-xo-border rounded-card p-4" aria-labelledby="player-profile-title">
      <h2 id="player-profile-title" className="text-lg font-semibold">
        {profile.display_name}
        <span className="ml-2 text-sm font-normal text-xo-text-secondary">{profile.position} · {profile.team}</span>
      </h2>
      <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div><dt className="text-xs text-xo-text-secondary">Velocidad máx.</dt><dd className="font-mono text-xl font-bold">{s.max_speed.toFixed(1)}<span className="text-xs text-xo-text-secondary"> yd/s</span></dd></div>
        <div><dt className="text-xs text-xo-text-secondary">Velocidad media</dt><dd className="font-mono text-xl font-bold">{s.avg_speed.toFixed(1)}<span className="text-xs text-xo-text-secondary"> yd/s</span></dd></div>
        <div><dt className="text-xs text-xo-text-secondary">Separación</dt><dd className="font-mono text-xl font-bold">{s.avg_separation.toFixed(1)}<span className="text-xs text-xo-text-secondary"> yd</span></dd></div>
        <div><dt className="text-xs text-xo-text-secondary">Percentil de separación</dt><dd className="font-mono text-xl font-bold">{s.separation_percentile}</dd></div>
      </dl>
      {s.favorite_zones.length > 0 && (
        <p className="mt-3 text-xs text-xo-text-secondary">Zonas favoritas: {s.favorite_zones.join(', ')}</p>
      )}
    </section>
  )
}
