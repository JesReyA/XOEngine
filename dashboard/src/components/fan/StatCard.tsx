interface StatCardProps {
  label: string
  value: string
  unit: string
}

export default function StatCard({ label, value, unit }: StatCardProps) {
  return (
    <div className="bg-xo-elevated border border-xo-border rounded-card p-4 hover:-translate-y-0.5 hover:border-xo-fan-accent/40 transition-[transform,border-color] duration-[180ms]">
      <p className="text-xs font-medium tracking-[0.025em] text-xo-text-secondary">{label}</p>
      <p className="mt-2 font-mono text-3xl font-bold tracking-[-0.02em] text-xo-text-primary">
        {value}
        <span className="ml-1.5 text-sm font-medium text-xo-text-secondary">{unit}</span>
      </p>
    </div>
  )
}
