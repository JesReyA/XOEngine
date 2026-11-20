import {
  FIELD_ZONE_OPTIONS,
  FORMATIONS,
  type FormationId,
} from '../../constants/formations'
import { NFL_TEAMS } from '../../constants/teams'
import Select from '../shared/Select'
import { IconPlay } from '../shared/icons'

interface ControlBarProps {
  offenseTeam: string
  defenseTeam: string
  formation: FormationId
  down: number
  yardsToGo: number
  fieldZone: string
  isLoading: boolean
  onChangeOffense: (abbr: string) => void
  onChangeDefense: (abbr: string) => void
  onChangeFormation: (id: FormationId) => void
  onChangeDown: (down: number) => void
  onChangeYards: (yards: number) => void
  onChangeZone: (zone: string) => void
  onSimulate: () => void
}

const TEAM_OPTIONS = NFL_TEAMS.map((t) => ({ value: t.abbr, label: t.abbr }))
const FORMATION_OPTIONS = FORMATIONS.map((f) => ({ value: f.id, label: f.label }))
const DOWN_LABELS = ['1st', '2nd', '3rd', '4th']
const DOWN_OPTIONS = DOWN_LABELS.map((l, i) => ({ value: String(i + 1), label: `${l} down` }))
const YARD_OPTIONS = [
  ...Array.from({ length: 25 }, (_, i) => ({ value: String(i + 1), label: `& ${i + 1}` })),
  { value: '26', label: '& 25+' },
]

export default function ControlBar(props: ControlBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Select label="Equipo ofensivo" value={props.offenseTeam} options={TEAM_OPTIONS} onChange={props.onChangeOffense} className="w-24" />
        <span className="text-xs text-xo-text-secondary">vs</span>
        <Select label="Equipo defensivo" value={props.defenseTeam} options={TEAM_OPTIONS} onChange={props.onChangeDefense} className="w-24" />
      </div>
      <Select label="Formación" value={props.formation} options={FORMATION_OPTIONS} onChange={(v) => props.onChangeFormation(v as FormationId)} className="w-56" />
      <Select label="Down" value={String(props.down)} options={DOWN_OPTIONS} onChange={(v) => props.onChangeDown(Number(v))} className="w-32" />
      <Select label="Yardas por recorrer" value={String(props.yardsToGo)} options={YARD_OPTIONS} onChange={(v) => props.onChangeYards(Number(v))} className="w-24" />
      <Select label="Zona del campo" value={props.fieldZone} options={FIELD_ZONE_OPTIONS} onChange={props.onChangeZone} className="w-32" />

      <button
        type="button"
        onClick={props.onSimulate}
        disabled={props.isLoading}
        className="md:ml-auto flex items-center gap-2 bg-xo-electric hover:bg-xo-violet text-white font-semibold px-5 py-2.5 rounded-chip press-tactile disabled:opacity-60 disabled:pointer-events-none"
      >
        {props.isLoading ? (
          <svg viewBox="0 0 24 24" width="16" height="16" className="animate-spin" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="12" cy="12" r="9" opacity="0.3" />
            <path d="M21 12a9 9 0 00-9-9" strokeLinecap="round" />
          </svg>
        ) : (
          <IconPlay width={16} height={16} />
        )}
        Simular
      </button>
    </div>
  )
}
