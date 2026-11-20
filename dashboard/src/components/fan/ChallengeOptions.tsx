import type { ChallengeOption } from '../../types/api'

export const MIN_FREE_TEXT = 10

interface ChallengeOptionsProps {
  options: ChallengeOption[]
  selected: ChallengeOption['id'] | null
  freeText: string
  disabled: boolean
  onSelect: (id: ChallengeOption['id']) => void
  onFreeText: (text: string) => void
}

export default function ChallengeOptions({
  options,
  selected,
  freeText,
  disabled,
  onSelect,
  onFreeText,
}: ChallengeOptionsProps) {
  const len = freeText.trim().length

  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Opciones tácticas" className="grid gap-3 md:grid-cols-3">
        {options.map((o) => {
          const on = selected === o.id
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={disabled}
              onClick={() => onSelect(o.id)}
              className={`text-left rounded-card border p-4 press-tactile disabled:opacity-60 disabled:pointer-events-none ${
                on
                  ? 'border-xo-fan-accent bg-xo-fan-accent/10'
                  : 'border-xo-border bg-xo-elevated hover:border-xo-fan-accent/40'
              }`}
            >
              <span className="block font-semibold">{o.label}</span>
              <span className="mt-1 block text-sm text-xo-text-secondary">{o.description}</span>
            </button>
          )
        })}
      </div>

      <div>
        <label htmlFor="free-text" className="text-sm text-xo-text-secondary">
          O describe tu propia jugada
        </label>
        <textarea
          id="free-text"
          rows={3}
          value={freeText}
          disabled={disabled}
          onChange={(e) => onFreeText(e.target.value)}
          placeholder="Describe tu jugada en texto libre…"
          className="mt-1 w-full resize-none bg-xo-surface border border-xo-border rounded-chip px-3 py-2 text-sm placeholder:text-xo-text-muted focus:border-xo-fan-accent outline-none disabled:opacity-60"
        />
        {len > 0 && len < MIN_FREE_TEXT && (
          <p className="text-xs text-xo-warning">Escribe al menos {MIN_FREE_TEXT} caracteres ({len}/{MIN_FREE_TEXT}).</p>
        )}
      </div>
    </div>
  )
}
