import type { Effectiveness, ImpactType } from '../../types/api'

interface EffectivenessBarProps {
  effectiveness: Effectiveness | null
  isLoading: boolean
  baseline?: number // efectividad promedio de jugadas similares (0–1), opcional
  similarPlays?: number // jugadas históricas similares encontradas
}

const R = 48
const CIRC = 2 * Math.PI * R

const scoreColor = (s: number) => (s > 0.7 ? '#10B981' : s >= 0.4 ? '#F59E0B' : '#D50A0A')

const IMPACT_TEXT: Record<ImpactType, string> = {
  positive: 'text-xo-success',
  negative: 'text-xo-danger',
  neutral: 'text-xo-text-secondary',
}
const IMPACT_BAR: Record<ImpactType, string> = {
  positive: 'bg-xo-success',
  negative: 'bg-xo-danger',
  neutral: 'bg-xo-text-muted',
}
const SIGN: Record<ImpactType, string> = { positive: '+', negative: '−', neutral: '' }

export default function EffectivenessBar({
  effectiveness,
  isLoading,
  baseline,
  similarPlays,
}: EffectivenessBarProps) {
  if (isLoading) {
    return (
      <div className="bg-xo-elevated border border-xo-border rounded-card p-4 animate-pulse" aria-busy="true">
        <div className="mx-auto w-28 h-28 rounded-pill bg-xo-border" />
        <div className="mt-5 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3 rounded-pill bg-xo-border" />
          ))}
        </div>
      </div>
    )
  }

  if (!effectiveness) {
    return (
      <div className="bg-xo-elevated border border-xo-border rounded-card p-4 text-sm text-xo-text-secondary">
        Pulsa «Simular» para estimar la probabilidad de éxito de la jugada.
      </div>
    )
  }

  const { score, factors } = effectiveness
  const color = scoreColor(score)
  const sorted = [...factors].sort((a, b) => b.weight - a.weight)
  const maxWeight = Math.max(...sorted.map((f) => f.weight), 0.01)
  const delta = baseline === undefined ? null : Math.round((score - baseline) * 100)

  return (
    <div className="bg-xo-elevated border border-xo-border rounded-card p-4">
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
            <circle cx="60" cy="60" r={R} fill="none" stroke="#232A42" strokeWidth="12" />
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={(1 - score) * CIRC}
              style={{ transition: 'stroke-dashoffset 500ms cubic-bezier(0.22, 1, 0.36, 1)' }}
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center font-mono text-2xl font-bold"
            style={{ color }}
          >
            {Math.round(score * 100)}%
          </span>
        </div>
        <p className="mt-2 text-sm text-xo-text-primary">Probabilidad de éxito</p>
        <p className="sr-only">Efectividad {effectiveness.label}</p>
        {similarPlays !== undefined && (
          <p className="text-xs text-xo-text-secondary">
            Basado en <span className="font-mono font-bold text-xo-text-primary">{similarPlays}</span> jugadas históricas similares
          </p>
        )}
        {delta !== null && (
          <p className={`text-xs ${delta >= 0 ? 'text-xo-success' : 'text-xo-danger'}`}>
            {delta >= 0 ? '↑' : '↓'}
            {delta >= 0 ? '+' : ''}
            {delta}% vs. promedio
          </p>
        )}
      </div>

      <h3 className="mt-5 mb-3 text-sm font-semibold text-xo-text-primary">Factores clave</h3>
      <ul className="space-y-3">
        {sorted.map((f) => (
          <li key={f.name}>
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="text-xo-text-secondary">
                {f.name}
                <span className="ml-1.5 font-mono text-xo-text-muted">{Math.round(f.weight * 100)}%</span>
              </span>
              <span className={`font-mono font-bold ${IMPACT_TEXT[f.impact]}`}>
                {SIGN[f.impact]}
                {f.value.toFixed(1)}
                <span className="sr-only"> impacto {f.impact}</span>
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-pill bg-xo-border overflow-hidden">
              <div
                className={`h-full w-full rounded-pill origin-left ${IMPACT_BAR[f.impact]}`}
                style={{
                  transform: `scaleX(${f.weight / maxWeight})`,
                  transition: 'transform 450ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
