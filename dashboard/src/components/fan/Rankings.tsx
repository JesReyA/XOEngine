import { useState } from 'react'
import { useApiResource } from '../../hooks/useApiResource'
import { api } from '../../services/api'
import { getFanTeam, getUsername } from '../../services/storage'
import ErrorBanner from '../shared/ErrorBanner'
import LoadingSkeleton from '../shared/LoadingSkeleton'
import LeagueChart from './LeagueChart'
import { IndividualTable, LeagueTable } from './RankingTables'

const PAGE = 10

export default function Rankings() {
  const [limit, setLimit] = useState(PAGE)
  const { data, error, loading, reload } = useApiResource(() => api.rankings({ limit }), [limit])
  const me = getUsername()
  const myTeam = getFanTeam()

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Rankings</h1>
          <p className="mt-1 text-sm text-xo-text-secondary">
            {data ? `${data.total_participants.toLocaleString('es-MX')} aficionados compiten` : 'Cargando clasificación…'}
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          className="border border-xo-border text-xo-text-secondary hover:text-xo-text-primary hover:border-xo-fan-accent px-4 py-2 rounded-chip text-sm press-tactile"
        >
          Actualizar
        </button>
      </header>

      {error && <ErrorBanner message={error} onRetry={reload} />}
      {loading && !data && <LoadingSkeleton count={2} className="h-56" />}

      {data && (
        <>
          <section className="bg-xo-elevated border border-xo-border rounded-card p-4" aria-labelledby="leagues-title">
            <h2 id="leagues-title" className="text-xl font-semibold mb-3">Liga de aficiones</h2>
            <LeagueChart leagues={data.fan_leagues} />
            <div className="mt-4">
              <LeagueTable rows={data.fan_leagues} myTeam={myTeam} />
            </div>
          </section>

          <section className="bg-xo-elevated border border-xo-border rounded-card p-4" aria-labelledby="leaders-title">
            <h2 id="leaders-title" className="text-xl font-semibold mb-3">Tabla de líderes</h2>
            <IndividualTable rows={data.individual} me={me} />
            {data.individual.length >= limit && (
              <button
                type="button"
                onClick={() => setLimit((l) => l + PAGE)}
                disabled={loading}
                className="mt-4 border border-xo-border text-xo-text-secondary hover:text-xo-text-primary hover:border-xo-fan-accent px-4 py-2 rounded-chip text-sm press-tactile disabled:opacity-50"
              >
                {loading ? 'Cargando…' : 'Ver más'}
              </button>
            )}
          </section>
        </>
      )}
    </div>
  )
}
