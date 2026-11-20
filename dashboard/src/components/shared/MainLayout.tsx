import type { ReactNode } from 'react'
import type { CurrentView, Mode } from '../../types/api'
import { accentFor } from './accent'
import { navItemsFor } from './navItems'
import Sidebar from './Sidebar'

interface MainLayoutProps {
  mode: Mode
  currentView: CurrentView
  onNavigate: (view: CurrentView) => void
  children: ReactNode
}

export default function MainLayout({ mode, currentView, onNavigate, children }: MainLayoutProps) {
  const accent = accentFor(mode)

  return (
    <div className="flex flex-col md:flex-row md:h-[calc(100vh-56px)]">
      <Sidebar mode={mode} currentView={currentView} onNavigate={onNavigate} />

      {/* Navegación compacta: el sidebar se oculta en pantallas < 768 px */}
      <div className="md:hidden flex gap-1 overflow-x-auto bg-xo-surface border-b border-xo-border px-2 py-2">
        {navItemsFor(mode).map((item) => {
          const active = item.view === currentView
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => onNavigate(item.view)}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 px-3 py-1.5 rounded-chip text-sm press-tactile ${
                active ? `${accent.bgSoft} text-xo-text-primary` : 'text-xo-text-secondary'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      <main className="flex-1 overflow-y-auto bg-xo-deep-bg p-6">
        <div key={currentView} className="animate-panel-enter">
          {children}
        </div>
      </main>
    </div>
  )
}
