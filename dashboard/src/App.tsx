import { useCallback, useState } from 'react'
import CoachView from './components/coach/CoachView'
import FanView from './components/fan/FanView'
import Copilot from './components/shared/Copilot'
import Navbar from './components/shared/Navbar'
import type { CurrentView, Mode, SuggestedPlayer } from './types/api'

const DEFAULT_VIEW: Record<Mode, CurrentView> = { coach: 'board', fan: 'stats' }

export default function App() {
  const [mode, setMode] = useState<Mode>('fan')
  const [view, setView] = useState<CurrentView>('stats')
  const [suggestedPlayers, setSuggestedPlayers] = useState<SuggestedPlayer[]>([])
  const [copilotPreload, setCopilotPreload] = useState('')

  const handleNavigate = (target: CurrentView) => setView(target)

  const handleModeChange = (next: Mode) => {
    setMode(next)
    setView(DEFAULT_VIEW[next])
  }

  const clearPreload = useCallback(() => setCopilotPreload(''), [])

  return (
    <div className="min-h-screen bg-xo-deep-bg text-xo-text-primary font-sans">
      <Navbar
        mode={mode}
        onModeChange={handleModeChange}
        currentView={view}
        onNavigate={handleNavigate}
      />
      {mode === 'coach' ? (
        <CoachView
          currentView={view}
          onNavigate={handleNavigate}
          suggestedPlayers={suggestedPlayers}
        />
      ) : (
        <FanView
          currentView={view}
          onNavigate={handleNavigate}
          onDictionaryTerm={setCopilotPreload}
        />
      )}
      <Copilot
        mode={mode}
        currentView={view}
        onNavigate={handleNavigate}
        onSuggestedPlayers={setSuggestedPlayers}
        preloadMessage={copilotPreload}
        onPreloadConsumed={clearPreload}
      />
    </div>
  )
}
