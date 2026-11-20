import { useState } from 'react'
import type { ReactNode } from 'react'
import type { CurrentView, Mode } from '../../types/api'
import { accentFor } from './accent'
import { IconClose, IconMenu } from './icons'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const items = navItemsFor(mode)
  const current = items.find((i) => i.view === currentView)

  return (
    <div className="flex flex-col md:flex-row md:h-[calc(100vh-56px)]">
      <Sidebar mode={mode} currentView={currentView} onNavigate={onNavigate} />

      {/* En pantallas < 768 px el sidebar se sustituye por un menú hamburguesa */}
      <div className="md:hidden bg-xo-surface border-b border-xo-border">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm press-tactile"
        >
          {menuOpen ? <IconClose /> : <IconMenu />}
          <span className="font-medium">{current?.label ?? 'Menú'}</span>
        </button>
        {menuOpen && (
          <ul id="mobile-nav" className="px-2 pb-2 space-y-1 animate-panel-enter">
            {items.map((item) => {
              const active = item.view === currentView
              return (
                <li key={item.view}>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate(item.view)
                      setMenuOpen(false)
                    }}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-chip text-sm text-left press-tactile ${
                      active ? `${accent.bgSoft} text-xo-text-primary` : 'text-xo-text-secondary'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <main className="flex-1 overflow-y-auto bg-xo-deep-bg p-4 sm:p-6">
        <div key={currentView} className="animate-panel-enter">
          {children}
        </div>
      </main>
    </div>
  )
}
