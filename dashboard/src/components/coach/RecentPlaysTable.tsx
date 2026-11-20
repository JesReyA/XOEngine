import { IconPlay } from '../shared/icons'

export interface RecentPlay {
  id: string
  name: string
  result: 'success' | 'failure'
  effectiveness: number // 0–1
  time: string
}

interface RecentPlaysTableProps {
  plays: RecentPlay[]
  onReplay?: (id: string) => void
}

export default function RecentPlaysTable({ plays, onReplay }: RecentPlaysTableProps) {
  return (
    <section className="bg-xo-elevated border border-xo-border rounded-card p-4" aria-labelledby="recent-title">
      <h2 id="recent-title" className="text-lg font-semibold mb-3">Jugadas recientes</h2>
      {plays.length === 0 ? (
        <p className="text-sm text-xo-text-secondary">Aún no has simulado jugadas.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-xo-text-secondary">
            <tr>
              <th className="pb-2 font-medium">Jugada</th>
              <th className="pb-2 font-medium">Resultado</th>
              <th className="pb-2 font-medium">Efectividad</th>
              <th className="pb-2 font-medium">Tiempo</th>
              <th className="pb-2 font-medium text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {plays.map((p) => (
              <tr key={p.id} className="border-t border-xo-border hover:bg-xo-surface/60">
                <td className="py-2 pr-2">{p.name}</td>
                <td className="py-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-pill ${p.result === 'success' ? 'bg-xo-success/15 text-xo-success' : 'bg-xo-danger/15 text-xo-danger'}`}>
                    {p.result === 'success' ? 'Éxito' : 'Fracaso'}
                  </span>
                </td>
                <td className="py-2 font-mono">{Math.round(p.effectiveness * 100)}%</td>
                <td className="py-2 font-mono text-xo-text-secondary">{p.time}</td>
                <td className="py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onReplay?.(p.id)}
                    aria-label={`Reproducir ${p.name}`}
                    className="inline-flex w-8 h-8 items-center justify-center rounded-chip border border-xo-border text-xo-text-secondary hover:text-xo-text-primary hover:border-xo-electric press-tactile"
                  >
                    <IconPlay width={14} height={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
