import { useCallback, useEffect, useRef, useState } from 'react'
import { fieldZoneToX, getFormation, type FormationId } from '../../constants/formations'
import { useAnimation } from '../../hooks/useAnimation'
import { api } from '../../services/api'
import type {
  CurrentView,
  PlayerInput,
  SimFrame,
  SimulateResponse,
  SuggestedPlayer,
} from '../../types/api'
import AnimationPlayer from '../board/AnimationPlayer'
import TacticalBoard from '../board/TacticalBoard'
import EffectivenessBar from '../shared/EffectivenessBar'
import MainLayout from '../shared/MainLayout'
import ControlBar from './ControlBar'
import RecentPlaysTable, { type RecentPlay } from './RecentPlaysTable'
import ScoutingPanel from './ScoutingPanel'

interface CoachViewProps {
  currentView: CurrentView
  onNavigate: (view: CurrentView) => void
  suggestedPlayers: SuggestedPlayer[]
}

const EMPTY_FRAMES: SimFrame[] = []
const DEFAULT_FORMATION: FormationId = 'shotgun_11'
const DEFAULT_ZONE = 'own_25'

export default function CoachView({ currentView, onNavigate, suggestedPlayers }: CoachViewProps) {
  const [offenseTeam, setOffenseTeam] = useState('KC')
  const [defenseTeam, setDefenseTeam] = useState('SF')
  const [formation, setFormation] = useState<FormationId>(DEFAULT_FORMATION)
  const [down, setDown] = useState(3)
  const [yardsToGo, setYardsToGo] = useState(7)
  const [fieldZone, setFieldZone] = useState(DEFAULT_ZONE)
  const [players, setPlayers] = useState<PlayerInput[]>(() =>
    getFormation(DEFAULT_FORMATION).build(fieldZoneToX(DEFAULT_ZONE)),
  )
  const [simResult, setSimResult] = useState<SimulateResponse | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)
  const [history, setHistory] = useState<Array<RecentPlay & { sim: SimulateResponse }>>([])

  const frames = simResult?.frames ?? EMPTY_FRAMES
  const fps = simResult?.fps ?? 10
  const anim = useAnimation(frames, fps)
  const { play } = anim

  const lineOfScrimmage = fieldZoneToX(fieldZone)
  const firstDownLine = Math.min(lineOfScrimmage + yardsToGo, 110)

  // Cambiar formación o zona reubica a los 22 jugadores y descarta la simulación previa.
  const applyPreset = (id: FormationId, zone: string) => {
    setFormation(id)
    setFieldZone(zone)
    setPlayers(getFormation(id).build(fieldZoneToX(zone)))
    setSimResult(null)
  }

  // Sugerencias del copiloto: actualizan x, y y ruta de las fichas coincidentes.
  useEffect(() => {
    if (currentView !== 'board' || suggestedPlayers.length === 0) return
    setPlayers((prev) =>
      prev.map((p) => {
        const s = suggestedPlayers.find((q) => q.player_id === p.player_id)
        return s ? { ...p, x: s.x, y: s.y, route: s.route ?? p.route } : p
      }),
    )
    setSimResult(null)
  }, [suggestedPlayers, currentView])

  // Arranca la reproducción en cuanto llega una simulación nueva.
  useEffect(() => {
    if (simResult) play()
  }, [simResult, play])

  const handleMove = useCallback((id: number, x: number, y: number) => {
    setPlayers((prev) => prev.map((p) => (p.player_id === id ? { ...p, x, y } : p)))
    setSimResult(null)
  }, [])

  const simulate = async () => {
    setIsSimulating(true)
    const res = await api.simulate({
      game_context: {
        down,
        yards_to_go: yardsToGo,
        field_zone: fieldZone,
        quarter: 2,
        score_diff: 0,
      },
      offense_team: offenseTeam,
      defense_team: defenseTeam,
      players,
      play_type: 'pass',
      mode: 'coach',
    })
    setSimResult(res)
    setHistory((h) =>
      [
        {
          id: `${Date.now()}`,
          name: `${offenseTeam} vs ${defenseTeam} · ${down}º & ${yardsToGo}`,
          result: res.effectiveness.score >= 0.5 ? ('success' as const) : ('failure' as const),
          effectiveness: res.effectiveness.score,
          time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
          sim: res,
        },
        ...h,
      ].slice(0, 8),
    )
    setIsSimulating(false)
  }

  return (
    <MainLayout mode="coach" currentView={currentView} onNavigate={onNavigate}>
      {currentView === 'scouting' ? (
        <ScoutingPanel team={defenseTeam} opponent={offenseTeam} />
      ) : (
        <div className="space-y-5">
          <h1 className="text-3xl font-bold">Sala táctica predictiva</h1>
          <ControlBar
            offenseTeam={offenseTeam}
            defenseTeam={defenseTeam}
            formation={formation}
            down={down}
            yardsToGo={yardsToGo}
            fieldZone={fieldZone}
            isLoading={isSimulating}
            onChangeOffense={setOffenseTeam}
            onChangeDefense={setDefenseTeam}
            onChangeFormation={(id) => applyPreset(id, fieldZone)}
            onChangeDown={setDown}
            onChangeYards={setYardsToGo}
            onChangeZone={(z) => applyPreset(formation, z)}
            onSimulate={simulate}
          />

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="w-full lg:w-[65%] space-y-3">
              <div ref={boardRef} className="bg-xo-deep-bg">
                <TacticalBoard
                  players={players}
                  frames={frames}
                  currentFrame={anim.currentFrame}
                  isPlaying={anim.isPlaying}
                  fps={fps}
                  lineOfScrimmage={lineOfScrimmage}
                  firstDownLine={firstDownLine}
                  onPlayerMove={handleMove}
                />
              </div>
              <AnimationPlayer
                currentFrame={anim.currentFrame}
                totalFrames={anim.totalFrames}
                isPlaying={anim.isPlaying}
                fps={fps}
                onPlay={anim.play}
                onPause={anim.pause}
                onReset={anim.reset}
                onSeek={anim.goToFrame}
                onFullscreen={() => void boardRef.current?.requestFullscreen?.()}
              />
              <p className="text-xs text-xo-text-secondary">
                Arrastra las fichas para ajustar la formación. Línea amarilla: scrimmage. Línea azul: primer down.
              </p>
            </div>

            <div className="w-full lg:w-[32%]">
              <EffectivenessBar
                effectiveness={simResult?.effectiveness ?? null}
                isLoading={isSimulating}
                similarPlays={simResult?.similar_plays_found}
              />
            </div>
          </div>

          <RecentPlaysTable
            plays={history}
            onReplay={(id) => {
              const h = history.find((x) => x.id === id)
              if (h) setSimResult(h.sim)
            }}
          />
        </div>
      )}
    </MainLayout>
  )
}
