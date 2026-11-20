import { IconChevronDown } from './icons'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  className?: string
}

// Dropdown nativo con estilo del sistema (accesible por teclado sin código extra).
export default function Select({ label, value, options, onChange, className = '' }: SelectProps) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-xo-elevated border border-xo-border rounded-chip pl-3 pr-9 py-2 text-sm text-xo-text-primary hover:border-xo-text-muted focus:border-xo-electric outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <IconChevronDown
        width={16}
        height={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xo-text-secondary"
      />
    </label>
  )
}
