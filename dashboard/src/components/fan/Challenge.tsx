import { useEffect, useRef, useState } from 'react'
import { fieldZoneToX, toApiFieldZone } from '../../constants/formations'
import { NFL_TEAMS } from '../../constants/teams'
import { useAnimation } from '../../hooks/useAnimation'
import { useApiResource } from '../../hooks/useApiResource'
import { api } from '../../services/api'
import { getFanTeam, setFanTeam } from '../../services/storage'
import type { ChallengeOption, ChallengeResponse, CurrentView, SimFrame } from '../../types/api'
import AnimationPlayer from '../board/AnimationPlayer'
import TacticalBoard from '../board/TacticalBoard'
import ErrorBanner from '../shared/ErrorBanner'
import LoadingSkeleton from '../shared/LoadingSkeleton'
import Select from '../shared/Select'
import ChallengeOptions, { MIN_FREE_TEXT } from './ChallengeOptions'
import ChallengeProgress from './ChallengeProgress'
import ChallengeSummary from './ChallengeSummary'
import ChallengeVerdict from './ChallengeVerdict'
import ScenarioInfo from './ScenarioInfo'

type Phase = 'select' | 'animating' | 'verdict' | 'summary'

interface ChallengeProps {
  onNavigate: (view: CurrentView) => void
}

const EMPTY: SimFrame[] = []
const TEAM_OPTIONS = NFL_TEAMS.map((t) => ({ value: t.abbr, label: `${t.abbr} · ${t.name}` }))

export default function Challenge({ onNavigate }: ChallengeProps) {
  const [team, setTeam] = useState(() => getFanTeam() ?? 'KC')
  const { data, error, loading, reload } = useApiResource(() => api.getChallenge({ team }), [team])
  const scenarios = data?.scenarios ?? []

  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<Phase>('select')
  const [selected, setSelected] = useState<ChallengeOption['id'] | null>(null)
  const [freeText, setFreeText] = useState('')
  const [result, setResult] = useState<ChallengeResponse | null>(null)
  const [results, setResults] = useState<ChallengeResponse[]>([])
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const sawPlaying = useRef(false)

  const frames = result?.frames ?? EMPTY
  const fps = result?.fps ?? 10
  const anim = useAnimation(frames, fps)
  const { play } = anim

  // Un reto nuevo (otro equipo o recarga) reinicia todo el progreso.
  useEffect(() => {
    setStep(0)
    setPhase('select')
    setSelected(null)
    setFreeText('')
    setResult(null)
    setResults([])
    setActionError(null)
  }, [data])

  // Arranca la animación del resultado; sin frames pasa directo al veredicto.
  useEffect(() => {
    if (phase !== 'animating' || !result) return
    sawPlaying.current = false
    if (result.frames.length === 0) setPhase('verdict')
    else play()
  }, [phase, result, play])

  useEffect(() => {
    if (anim.isPlaying) sawPlaying.current = true
    else if (phase === 'animating' && sawPlaying.current && anim.currentFrame >= anim.totalFrames - 1) {
      setPhase('verdict')
    }
  }, [phase, anim.isPlaying, anim.currentFrame, anim.totalFrames])

  const scenario = scenarios[step]
  const useText = freeText.trim().length >= MIN_FREE_TEXT
  const canConfirm = phase === 'select' && !busy && (useText || selected !== null)

  const confirm = async () => {
    if (!scenario || !data) return
    setBusy(true)
    setActionError(null)
    try {
      const s = scenario.scenario
      const res = await api.challenge({
        game_id: data.game_id,
        challenge_step: scenario.step,
        fan_team: team,
        scenario: { down: s.down, yards_to_go: s.yards_to_go, field_zone: toApiFieldZone(s.field_zone), score_diff: s.score_diff },
        decision_type: useText ? 'free_text' : (selected ?? 'free_text'),
        selected_option: useText ? null : selected,
        free_text: useText ? freeText.trim() : null,
        mode: 'fan',
      })
      setResults((r) => [...r, res])
      setResult(res)
      setPhase('animating')
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'No se pudo evaluar tu jugada.')
    } finally {
      setBusy(false)
    }
  }

  const next = () => {
    if (step >= scenarios.length - 1) {
      setPhase('summary')
      return
    }
    setStep((s) => s + 1)
    setSelected(null)
    setFreeText('')
    setResult(null)
    setPhase('select')
  }

  const restart = () => {
    reload()
  }

  const changeTeam = (abbr: string) => {
    setTeam(abbr)
    setFanTeam(abbr)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Juega a ser el entrenador</h1>
          <p className="mt-1 text-sm text-xo-text-secondary">Resuelve 5 jugadas y compara tu decisión con los datos reales.</p>
        </div>
        <Select label="Tu equipo" value={team} options={TEAM_OPTIONS} onChange={changeTeam} className="w-64" />
      </header>

      {error && <ErrorBanner message={error} onRetry={reload} />}
      {loading && !data && <LoadingSkeleton count={2} className="h-48" />}

      {data && phase === 'summary' && (
        <ChallengeSummary results={results} fanTeam={team} onRestart={restart} onGoRankings={() => onNavigate('rankings')} />
      )}

      {data && scenario && phase !== 'summary' && (
        <>
          <ChallengeProgress total={scenarios.length} step={step} completed={results.length - (phase === 'select' ? 0 : 1)} />
          <ScenarioInfo scenario={scenario} />

          <div className="space-y-3">
            <TacticalBoard
              players={scenario.players}
              frames={frames}
              currentFrame={anim.currentFrame}
              isPlaying={anim.isPlaying}
              fps={fps}
              readOnly={true}
              lineOfScrimmage={fieldZoneToX(scenario.scenario.field_zone)}
              firstDownLine={Math.min(fieldZoneToX(scenario.scenario.field_zone) + scenario.scenario.yards_to_go, 110)}
            />
            {phase !== 'select' && (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <AnimationPlayer
                    currentFrame={anim.currentFrame}
                    totalFrames={anim.totalFrames}
                    isPlaying={anim.isPlaying}
                    fps={fps}
                    onPlay={anim.play}
                    onPause={anim.pause}
                    onReset={anim.reset}
                    onSeek={anim.goToFrame}
                  />
                </div>
                {phase === 'animating' && (
                  <button type="button" onClick={() => setPhase('verdict')} className="text-sm text-xo-text-secondary hover:text-xo-text-primary press-tactile px-3 py-2 rounded-chip border border-xo-border">
                    Saltar animación
                  </button>
                )}
              </div>
            )}
          </div>

          {phase === 'verdict' && result ? (
            <ChallengeVerdict result={result} isLast={step >= scenarios.length - 1} onNext={next} />
          ) : (
            <>
              <ChallengeOptions
                options={scenario.options}
                selected={selected}
                freeText={freeText}
                disabled={phase !== 'select' || busy}
                onSelect={(id) => {
                  setSelected(id)
                  setFreeText('')
                }}
                onFreeText={(t) => {
                  setFreeText(t)
                  if (t.trim()) setSelected(null)
                }}
              />
              {actionError && <ErrorBanner message={actionError} onRetry={confirm} />}
              <button
                type="button"
                onClick={confirm}
                disabled={!canConfirm}
                className="bg-xo-fan-accent hover:bg-amber-400 text-xo-deep-bg font-semibold px-5 py-2.5 rounded-chip press-tactile disabled:opacity-50 disabled:pointer-events-none"
              >
                {busy ? 'Evaluando…' : 'Confirmar jugada'}
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}
