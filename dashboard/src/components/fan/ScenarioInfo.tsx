import { FIELD_ZONE_OPTIONS } from '../../constants/formations'
import type { ChallengeScenario } from '../../types/api'

interface ScenarioInfoProps {
  scenario: ChallengeScenario
}

const ZONE_LABEL: Record<string, string> = {
  red_zone: 'Zona roja',
  ...Object.fromEntries(FIELD_ZONE_OPTIONS.map((z) => [z.value, z.label])),
}

const ORDINAL = ['', '1º', '2º', '3º', '4º']

export default function ScenarioInfo({ scenario }: ScenarioInfoProps) {
  const s = scenario.scenario
  const diff = s.score_diff === 0 ? 'Empate' : s.score_diff > 0 ? `Ganas por ${s.score_diff}` : `Pierdes por ${-s.score_diff}`
  const chips = [
    s.quarter ? `Cuarto ${s.quarter}` : null,
    s.clock ? s.clock : null,
    `${ORDINAL[s.down] ?? `${s.down}º`} y ${s.yards_to_go}`,
    ZONE_LABEL[s.field_zone] ?? s.field_zone,
    diff,
  ].filter((c): c is string => c !== null)

  return (
    <div>
      <ul className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <li key={c} className="bg-xo-surface border border-xo-border rounded-pill px-3 py-1 text-xs font-medium font-mono">
            {c}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-base">{s.situation_text ?? scenario.description}</p>
    </div>
  )
}
