interface LoadingSkeletonProps {
  count?: number
  className?: string
}

// Placeholder de cards mientras llega la respuesta de la API.
export default function LoadingSkeleton({ count = 1, className = 'h-32' }: LoadingSkeletonProps) {
  return (
    <div className="grid gap-4" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`animate-pulse bg-xo-elevated rounded-card ${className}`} />
      ))}
    </div>
  )
}
