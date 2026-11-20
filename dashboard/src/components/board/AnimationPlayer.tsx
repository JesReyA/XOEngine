import { IconExpand, IconPause, IconPlay, IconReset } from '../shared/icons'

interface AnimationPlayerProps {
  currentFrame: number
  totalFrames: number
  isPlaying: boolean
  fps: number
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onSeek: (frame: number) => void
  onFullscreen?: () => void
}

const BTN =
  'w-9 h-9 flex items-center justify-center rounded-chip border border-xo-border text-xo-text-secondary hover:text-xo-text-primary hover:border-xo-electric press-tactile disabled:opacity-40 disabled:pointer-events-none'

export default function AnimationPlayer({
  currentFrame,
  totalFrames,
  isPlaying,
  fps,
  onPlay,
  onPause,
  onReset,
  onSeek,
  onFullscreen,
}: AnimationPlayerProps) {
  const empty = totalFrames === 0
  const last = Math.max(0, totalFrames - 1)
  const time = `${(currentFrame / fps).toFixed(1)}s / ${(last / fps).toFixed(1)}s`

  return (
    <div className="flex items-center gap-3 bg-xo-surface border border-xo-border rounded-card px-3 py-2">
      <button
        type="button"
        className={BTN}
        onClick={isPlaying ? onPause : onPlay}
        disabled={empty}
        aria-label={isPlaying ? 'Pausar animación' : 'Reproducir animación'}
      >
        {isPlaying ? <IconPause width={16} height={16} /> : <IconPlay width={16} height={16} />}
      </button>
      <button
        type="button"
        className={BTN}
        onClick={onReset}
        disabled={empty}
        aria-label="Reiniciar animación"
      >
        <IconReset width={16} height={16} />
      </button>

      <input
        type="range"
        min={0}
        max={last}
        value={Math.min(currentFrame, last)}
        disabled={empty}
        onChange={(e) => onSeek(Number(e.target.value))}
        aria-label="Posición de la animación"
        className="flex-1 h-1.5 cursor-pointer disabled:opacity-40"
        style={{ accentColor: '#6038F5' }}
      />

      <span className="font-mono text-xs text-xo-text-secondary tabular-nums whitespace-nowrap">
        {empty ? 'Sin simulación' : time}
      </span>

      {onFullscreen && (
        <button
          type="button"
          className={BTN}
          onClick={onFullscreen}
          aria-label="Pantalla completa"
        >
          <IconExpand width={16} height={16} />
        </button>
      )}
    </div>
  )
}
