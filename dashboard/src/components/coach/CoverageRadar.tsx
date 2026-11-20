import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts'

interface CoverageRadarProps {
  distribution: Record<string, number>
}

const label = (k: string) => k.replace(/^cover_/, 'Cover ').replace(/_/g, ' ')

export default function CoverageRadar({ distribution }: CoverageRadarProps) {
  const data = Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k, v]) => ({ name: label(k), value: Math.round(v * 100) }))

  if (data.length < 3) {
    return <p className="py-10 text-center text-sm text-xo-text-secondary">Sin datos de cobertura suficientes.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="#232A42" />
        <PolarAngleAxis dataKey="name" tick={{ fill: '#8B9ABF', fontSize: 11 }} />
        <PolarRadiusAxis tick={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: '#1C2238', border: '1px solid #232A42', borderRadius: '8px', color: '#F5F6FC' }}
          formatter={(v) => [`${v}%`, 'Frecuencia']}
        />
        <Radar dataKey="value" stroke="#6038F5" fill="#6038F5" fillOpacity={0.25} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
