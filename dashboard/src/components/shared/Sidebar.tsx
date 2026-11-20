import type { CurrentView, Mode } from '../../types/api'
import { accentFor } from './accent'
import { navItemsFor } from './navItems'

interface SidebarProps {
  mode: Mode
  currentView: CurrentView
  onNavigate: (view: CurrentView) => void
}

export default function Sidebar({ mode, currentView, onNavigate }: SidebarProps) {
  const accent = accentFor(mode)

  return (
    <nav
      aria-label="Navegación principal"
      className="hidden md:flex w-56 shrink-0 bg-xo-surface border-r border-xo-border flex-col py-4"
    >
      <ul className="flex flex-col gap-1 px-2">
        {navItemsFor(mode).map((item) => {
          const active = item.view === currentView
          return (
            <li key={item.view}>
              <button
                type="button"
                onClick={() => onNavigate(item.view)}
                aria-current={active ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-chip text-sm text-left press-tactile border-l-2 ${
                  active
                    ? `${accent.bgSoft} ${accent.borderActive} text-xo-text-primary`
                    : 'border-transparent text-xo-text-secondary hover:text-xo-text-primary hover:bg-xo-elevated/50'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-auto px-4">
        <div
          className="w-12 h-12 rounded-pill border border-xo-border flex items-center justify-center text-xs font-semibold text-xo-text-muted"
          aria-label="NFL"
        >
          NFL
        </div>
      </div>
    </nav>
  )
}
