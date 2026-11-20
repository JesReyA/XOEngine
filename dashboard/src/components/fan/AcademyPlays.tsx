import { useEffect, useState } from 'react'
import { BASIC_PLAYS, BASIC_PLAY_FPS } from '../../constants/basicPlays'
import { useAnimation } from '../../hooks/useAnimation'
import AnimationPlayer from '../board/AnimationPlayer'
import TacticalBoard from '../board/TacticalBoard'
import EffectivenessBar from '../shared/EffectivenessBar'

export default function AcademyPlays() {
  const [selectedId, setSelectedId] = useState(BASIC_PLAYS[0].id)
  const play = BASIC_PLAYS.find((p) => p.id === selectedId) ?? BASIC_PLAYS[0]
  const anim = useAnimation(play.frames, BASIC_PLAY_FPS)
  const { play: start } = anim

  // Cada jugada nueva arranca sola.
  useEffect(() => {
    start()
  }, [selectedId, start])

  const choose = (id: typeof selectedId) => {
    if (id === selectedId) start()
    else setSelectedId(id)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <div role="group" aria-label="Jugadas básicas" className="flex flex-wrap gap-2">
          {BASIC_PLAYS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={p.id === selectedId}
              onMouseEnter={() => choose(p.id)}
              onFocus={() => choose(p.id)}
              onClick={() => choose(p.id)}
              className={`px-4 py-2 rounded-chip text-sm border press-tactile ${
                p.id === selectedId
                  ? 'border-xo-fan-accent bg-xo-fan-accent/10 text-xo-text-primary'
                  : 'border-xo-border text-xo-text-secondary hover:text-xo-text-primary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <TacticalBoard
          players={play.players}
          frames={play.frames}
          currentFrame={anim.currentFrame}
          isPlaying={anim.isPlaying}
          fps={BASIC_PLAY_FPS}
          readOnly={true}
        />
        <AnimationPlayer
          currentFrame={anim.currentFrame}
          totalFrames={anim.totalFrames}
          isPlaying={anim.isPlaying}
          fps={BASIC_PLAY_FPS}
          onPlay={anim.play}
          onPause={anim.pause}
          onReset={anim.reset}
          onSeek={anim.goToFrame}
        />

        <div>
          <p className="text-base">{play.summary}</p>
          <ol className="mt-2 list-decimal list-inside space-y-1 text-sm text-xo-text-secondary">
            {play.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
      </div>

      <EffectivenessBar effectiveness={play.effectiveness} isLoading={false} />
    </div>
  )
}
