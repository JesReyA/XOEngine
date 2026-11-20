import type { FunFact } from '../../types/api'

interface FunFactsProps {
  facts: FunFact[]
}

const STAGGER = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4']

export default function FunFacts({ facts }: FunFactsProps) {
  return (
    <section aria-labelledby="fun-facts-title">
      <h2 id="fun-facts-title" className="text-xl font-semibold mb-3">¿Sabías qué?</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {facts.map((f, i) => (
          <article
            key={f.id}
            className={`bg-xo-elevated border border-xo-border rounded-card p-4 text-sm leading-relaxed animate-panel-enter ${STAGGER[i % 4]}`}
          >
            {f.text}
          </article>
        ))}
      </div>
    </section>
  )
}
