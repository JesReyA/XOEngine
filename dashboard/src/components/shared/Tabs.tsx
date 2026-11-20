interface TabsProps<T extends string> {
  tabs: Array<{ id: T; label: string }>
  active: T
  onChange: (id: T) => void
  label: string
}

export default function Tabs<T extends string>({ tabs, active, onChange, label }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="bg-xo-surface rounded-chip p-1 inline-flex gap-1 max-w-full overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === active}
          onClick={() => onChange(t.id)}
          className={`px-4 py-1.5 rounded-chip text-sm whitespace-nowrap transition-colors duration-200 ${
            t.id === active
              ? 'bg-xo-elevated text-xo-text-primary font-medium'
              : 'text-xo-text-secondary hover:text-xo-text-primary'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
