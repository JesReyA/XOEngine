import type { ChallengeResponse } from '../../types/api'
import EffectivenessBar from '../shared/EffectivenessBar'

interface ChallengeVerdictProps {
  result: ChallengeResponse
  isLast: boolean
  onNext: () => void
}

export default function ChallengeVerdict({ result, isLast, onNext }: ChallengeVerdictProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px] animate-panel-enter">
      <div className="space-y-4">
        <div className="bg-xo-elevated border border-xo-border rounded-card p-4">
          <p className="text-xs text-xo-text-secondary">Puntos de esta jugada</p>
          <p className="font-mono text-4xl font-bold text-xo-fan-accent">+{result.score_earned}</p>
          <p className="mt-3 text-base leading-relaxed">{result.verdict}</p>
          <p className="mt-2 text-xs text-xo-text-secondary">Interpretamos tu jugada así: {result.interpreted_play.description}</p>
        </div>

        <div className="bg-xo-elevated border border-xo-border rounded-card p-4">
          <h3 className="text-sm font-semibold mb-3">Así rinden las opciones sugeridas</h3>
          <ul className="space-y-2">
            {result.options_reference.map((o) => (
              <li key={o.id} className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0 truncate text-xo-text-secondary">{o.label}</span>
                <div className="flex-1 h-1.5 rounded-pill bg-xo-border overflow-hidden">
                  <div
                    className="h-full w-full origin-left rounded-pill bg-xo-violet"
                    style={{ transform: `scaleX(${o.effectiveness})`, transition: 'transform 450ms cubic-bezier(0.22, 1, 0.36, 1)' }}
                  />
                </div>
                <span className="w-10 text-right font-mono">{Math.round(o.effectiveness * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={onNext}
          className="bg-xo-fan-accent hover:bg-amber-400 text-xo-deep-bg font-semibold px-5 py-2.5 rounded-chip press-tactile"
        >
          {isLast ? 'Ver resultados' : 'Siguiente jugada'}
        </button>
      </div>

      <EffectivenessBar effectiveness={result.effectiveness} isLoading={false} />
    </div>
  )
}
