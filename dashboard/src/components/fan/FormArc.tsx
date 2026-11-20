interface FormArcProps {
  value: number // 0–100
}

const R = 20
const C = 2 * Math.PI * R

const colorFor = (v: number) => (v > 70 ? '#10B981' : v >= 40 ? '#F59E0B' : '#D50A0A')

// Índice de forma: arco circular SVG propio (sin Recharts, según design.md §10).
export default function FormArc({ value }: FormArcProps) {
  const v = Math.min(Math.max(value, 0), 100)
  return (
    <div className="relative w-14 h-14 shrink-0" role="img" aria-label={`Índice de forma ${Math.round(v)} de 100`}>
      <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r={R} fill="none" stroke="#232A42" strokeWidth="5" />
        <circle
          cx="24"
          cy="24"
          r={R}
          fill="none"
          stroke={colorFor(v)}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - v / 100)}
          style={{ transition: 'stroke-dashoffset 500ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold">
        {Math.round(v)}
      </span>
    </div>
  )
}
