import type { ScoutingAlert, Severity } from '../../types/api'
import { IconAlert } from '../shared/icons'

const BADGE: Record<Severity, { label: string; cls: string }> = {
  high: { label: 'Alta', cls: 'bg-xo-danger/15 text-xo-danger' },
  medium: { label: 'Media', cls: 'bg-xo-warning/15 text-xo-warning' },
  low: { label: 'Baja', cls: 'bg-xo-success/15 text-xo-success' },
}
const BAR: Record<Severity, string> = {
  high: 'bg-xo-danger',
  medium: 'bg-xo-warning',
  low: 'bg-xo-success',
}
const STAGGER = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4']

interface AlertCardProps {
  alert: ScoutingAlert
  index: number
}

export default function AlertCard({ alert, index }: AlertCardProps) {
  const badge = BADGE[alert.severity]
  const pct = Math.min(Math.max(alert.percentile, 0), 100)

  return (
    <li
      className={`bg-xo-elevated border border-xo-border rounded-card p-4 animate-panel-enter ${STAGGER[index % 4]}`}
      style={{ animationDelay: `${index * 35}ms` }}
    >
      <div className="flex items-center gap-2">
        <IconAlert width={18} height={18} className={alert.severity === 'high' ? 'text-xo-danger' : alert.severity === 'medium' ? 'text-xo-warning' : 'text-xo-success'} />
        <span className={`text-xs font-medium px-2 py-0.5 rounded-pill ${badge.cls}`}>{badge.label}</span>
        <span className="ml-auto text-xs text-xo-text-secondary">
          Percentil <span className="font-mono font-bold text-xo-text-primary">{pct}</span>
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed">{alert.message}</p>
      <div
        className="mt-3 h-1.5 rounded-pill bg-xo-border overflow-hidden"
        role="img"
        aria-label={`Percentil ${pct} de 100`}
      >
        <div
          className={`h-full w-full origin-left rounded-pill ${BAR[alert.severity]}`}
          style={{ transform: `scaleX(${pct / 100})`, transition: 'transform 450ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </div>
    </li>
  )
}
