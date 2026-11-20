interface ComingSoonProps {
  title: string
  description: string
}

// Marcador de las vistas que se construyen en checkpoints posteriores.
export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <section className="bg-xo-elevated border border-xo-border rounded-card p-8 max-w-xl">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-xo-text-secondary">{description}</p>
    </section>
  )
}
