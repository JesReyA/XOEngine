import { useCallback, useState } from 'react'
import CoachView from './components/coach/CoachView'
import FanView from './components/fan/FanView'
import Copilot from './components/shared/Copilot'
import Navbar from './components/shared/Navbar'
import type { ChatCurrentPlay, CurrentView, Mode, SuggestedPlayer } from './types/api'

const DEFAULT_VIEW: Record<Mode, CurrentView> = { coach: 'board', fan: 'stats' }
const COACH_VIEWS: CurrentView[] = ['board', 'scouting']

interface Preload {
  text: string
  autoSend: boolean
}

export default function App() {
  const [mode, setMode] = useState<Mode>('fan')
  const [view, setView] = useState<CurrentView>('stats')
  const [suggestedPlayers, setSuggestedPlayers] = useState<SuggestedPlayer[]>([])
  const [currentPlay, setCurrentPlay] = useState<ChatCurrentPlay | null>(null)
  const [preload, setPreload] = useState<Preload | null>(null)

  // navigate_to del copiloto puede apuntar a una vista del otro modo: cambia el modo con ella.
  const handleNavigate = (target: CurrentView) => {
    setMode(COACH_VIEWS.includes(target) ? 'coach' : 'fan')
    setView(target)
  }

  const handleModeChange = (next: Mode) => {
    setMode(next)
    setView(DEFAULT_VIEW[next])
    setSuggestedPlayers([])
  }

  const ask = useCallback((text: string, autoSend: boolean = false) => setPreload({ text, autoSend }), [])
  const clearPreload = useCallback(() => setPreload(null), [])

  return (
    <div className="min-h-screen bg-xo-deep-bg text-xo-text-primary font-sans">
      <Navbar mode={mode} onModeChange={handleModeChange} currentView={view} onNavigate={handleNavigate} />
      {mode === 'coach' ? (
        <CoachView
          currentView={view}
          onNavigate={handleNavigate}
          suggestedPlayers={suggestedPlayers}
          onPlayChange={setCurrentPlay}
        />
      ) : (
        <FanView currentView={view} onNavigate={handleNavigate} onAsk={ask} />
      )}
      <Copilot
        mode={mode}
        currentView={view}
        currentPlay={currentPlay}
        onNavigate={handleNavigate}
        onSuggestedPlayers={setSuggestedPlayers}
        preloadMessage={preload?.text ?? ''}
        preloadAutoSend={preload?.autoSend ?? false}
        onPreloadConsumed={clearPreload}
      />
    </div>
  )
}
