import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../../services/api'
import { getFanTeam } from '../../services/storage'
import type { ChatCurrentPlay, CurrentView, Mode, SuggestedPlayer } from '../../types/api'
import { accentFor } from './accent'
import { IconClose, IconCopilot, IconSend } from './icons'

interface CopilotProps {
  mode: Mode
  currentView: CurrentView
  currentPlay: ChatCurrentPlay | null
  onNavigate: (view: CurrentView) => void
  onSuggestedPlayers: (players: SuggestedPlayer[]) => void
  preloadMessage?: string
  preloadAutoSend?: boolean
  onPreloadConsumed?: () => void
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  note?: string
}

const GREETING: ChatMessage = {
  role: 'assistant',
  content: '¡Hola! ¿En qué puedo ayudarte hoy?',
}

export default function Copilot({
  mode,
  currentView,
  currentPlay,
  onNavigate,
  onSuggestedPlayers,
  preloadMessage,
  preloadAutoSend = false,
  onPreloadConsumed,
}: CopilotProps) {
  const accent = accentFor(mode)
  const onAccent = mode === 'coach' ? 'text-white' : 'text-xo-deep-bg'
  const [isOpen, setIsOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [aiAvailable, setAiAvailable] = useState(true)
  const endRef = useRef<HTMLDivElement>(null)
  const busyRef = useRef(false)

  const sendText = async (raw: string) => {
    const text = raw.trim()
    if (!text || busyRef.current) return
    busyRef.current = true
    setMessages((m) => [...m, { role: 'user', content: text }])
    setInput('')
    setIsLoading(true)
    try {
      const res = await api.chat({
        message: text,
        mode,
        context: {
          current_play: mode === 'coach' ? currentPlay : null,
          fan_team: mode === 'fan' ? getFanTeam() : null,
          current_view: currentView,
        },
      })
      const hasSuggestions = res.suggested_players.length > 0
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: res.reply,
          note: hasSuggestions ? 'Actualicé las fichas de la pizarra con mi sugerencia.' : undefined,
        },
      ])
      setAiAvailable(res.ai_available)
      if (hasSuggestions) onSuggestedPlayers(res.suggested_players)
      if (res.navigate_to) onNavigate(res.navigate_to)
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'No pude responder ahora. Inténtalo de nuevo en un momento.' }])
    } finally {
      busyRef.current = false
      setIsLoading(false)
    }
  }
  const sendRef = useRef(sendText)
  sendRef.current = sendText

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, isLoading, isOpen])

  // Pregunta lanzada desde otra parte de la app: abre el panel y la precarga o la envía.
  useEffect(() => {
    if (!preloadMessage) return
    setClosing(false)
    setIsOpen(true)
    if (preloadAutoSend) void sendRef.current(preloadMessage)
    else setInput(preloadMessage)
    onPreloadConsumed?.()
  }, [preloadMessage, preloadAutoSend, onPreloadConsumed])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void sendText(input)
  }

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir copiloto"
          className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-pill shadow-lg shadow-black/40 flex items-center justify-center press-tactile ${accent.bg} ${accent.bgHover} ${onAccent}`}
        >
          <IconCopilot width={22} height={22} />
        </button>
      )}

      {isOpen && (
        <aside
          aria-label="X&O Copilot"
          className={`fixed right-0 top-0 h-screen w-full sm:w-80 z-40 flex flex-col bg-xo-elevated/95 backdrop-blur-sm border-l border-xo-border ${
            closing ? 'animate-slide-out-right' : 'animate-slide-in-right'
          }`}
          onAnimationEnd={() => {
            if (closing) {
              setIsOpen(false)
              setClosing(false)
            }
          }}
        >
          <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-xo-border">
            <h2 className="font-semibold">X&amp;O Copilot</h2>
            <button
              type="button"
              onClick={() => setClosing(true)}
              aria-label="Cerrar copiloto"
              className="text-xo-text-secondary hover:text-xo-text-primary press-tactile p-1 rounded-chip"
            >
              <IconClose />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'ml-auto max-w-[85%]' : 'max-w-[85%]'}>
                <div
                  className={`text-sm rounded-card p-3 ${
                    m.role === 'user' ? 'bg-xo-electric/20 text-xo-text-primary' : 'bg-xo-surface text-xo-text-primary'
                  }`}
                >
                  {m.content}
                </div>
                {m.note && <p className="mt-1 text-xs text-xo-text-secondary">{m.note}</p>}
              </div>
            ))}
            {isLoading && (
              <div className="bg-xo-surface rounded-card p-3 max-w-[85%] text-sm text-xo-text-secondary animate-pulse">
                Pensando…
              </div>
            )}
            {!aiAvailable && <p className="text-xs text-xo-warning">Modo heurístico</p>}
            <div ref={endRef} />
          </div>

          <form onSubmit={submit} className="shrink-0 p-3 border-t border-xo-border flex items-end gap-2">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  e.currentTarget.form?.requestSubmit()
                }
              }}
              placeholder="Escribe tu pregunta…"
              aria-label="Mensaje para el copiloto"
              className="flex-1 resize-none bg-xo-surface border border-xo-border rounded-chip px-3 py-2 text-sm text-xo-text-primary placeholder:text-xo-text-muted focus:border-xo-electric outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Enviar mensaje"
              className={`w-10 h-10 rounded-chip flex items-center justify-center press-tactile disabled:opacity-40 disabled:pointer-events-none ${accent.bg} ${accent.bgHover} ${onAccent}`}
            >
              <IconSend width={18} height={18} />
            </button>
          </form>
        </aside>
      )}
    </>
  )
}
