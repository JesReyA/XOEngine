interface ErrorBannerProps {
  message: string
  onRetry?: () => void
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 bg-xo-danger/15 border border-xo-danger/40 text-xo-danger rounded-card px-4 py-3 text-sm"
    >
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-3 py-1.5 rounded-chip border border-xo-danger/40 hover:bg-xo-danger/15 press-tactile"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
