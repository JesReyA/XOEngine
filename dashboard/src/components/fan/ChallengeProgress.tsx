interface ChallengeProgressProps {
  total: number
  step: number // índice activo
  completed: number // jugadas ya resueltas
}

export default function ChallengeProgress({ total, step, completed }: ChallengeProgressProps) {
  return (
    <ol className="flex items-center gap-3" aria-label="Progreso del reto">
      {Array.from({ length: total }, (_, i) => {
        const done = i < completed
        const active = i === step && !done
        return (
          <li
            key={i}
            aria-current={active ? 'step' : undefined}
            className={`w-8 h-8 rounded-pill flex items-center justify-center text-xs font-bold font-mono transition-colors duration-200 ${
              done
                ? 'bg-xo-success text-xo-deep-bg'
                : active
                  ? 'bg-xo-fan-accent text-xo-deep-bg'
                  : 'bg-xo-border text-xo-text-secondary'
            }`}
          >
            {i + 1}
          </li>
        )
      })}
    </ol>
  )
}
