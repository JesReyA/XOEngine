import type { ReactNode } from 'react'
import type { CurrentView, Mode } from '../../types/api'
import { accentFor } from './accent'
import { IconBell, IconBriefcase, IconTrophy } from './icons'

interface NavbarProps {
  mode: Mode
  onModeChange: (mode: Mode) => void
  currentView: CurrentView
  onNavigate: (view: CurrentView) => void
}

const MODES: Array<{ id: Mode; label: string; icon: ReactNode }> = [
  { id: 'coach', label: 'Entrenador', icon: <IconBriefcase width={16} height={16} /> },
  { id: 'fan', label: 'Aficionado', icon: <IconTrophy width={16} height={16} /> },
]

export default function Navbar({ mode, onModeChange }: NavbarProps) {
  const accent = accentFor(mode)
  const activeText = mode === 'coach' ? 'text-white' : 'text-xo-deep-bg'

  return (
    <header className="h-14 bg-xo-surface border-b border-xo-border flex items-center justify-between px-6">
      <span className="text-lg font-bold">
        <span className="text-xo-electric">X&amp;O</span>{' '}
        <span className="text-xo-text-primary">Engine</span>
      </span>

      <div
        role="tablist"
        aria-label="Modo de la aplicación"
        className="bg-xo-deep-bg rounded-pill p-1 flex relative"
      >
        <span
          aria-hidden="true"
          className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-pill ${accent.bg} transition-transform duration-[240ms] ease-apple`}
          style={{ transform: mode === 'coach' ? 'translateX(0)' : 'translateX(100%)' }}
        />
        {MODES.map((m) => {
          const selected = m.id === mode
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onModeChange(m.id)}
              className={`relative z-10 flex items-center justify-center gap-2 w-32 sm:w-40 py-1.5 rounded-pill text-sm font-semibold transition-colors duration-200 ${
                selected ? activeText : 'text-xo-text-secondary hover:text-xo-text-primary'
              }`}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notificaciones"
          className="text-xo-text-secondary hover:text-xo-text-primary press-tactile p-1.5 rounded-chip"
        >
          <IconBell />
        </button>
        <div
          className="w-8 h-8 rounded-pill bg-xo-elevated border border-xo-border flex items-center justify-center text-xs font-semibold"
          aria-label="Usuario JR"
        >
          JR
        </div>
      </div>
    </header>
  )
}
