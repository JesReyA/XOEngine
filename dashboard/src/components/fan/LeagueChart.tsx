import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { FanLeagueRank } from '../../types/api'

interface LeagueChartProps {
  leagues: FanLeagueRank[]
}

const TICK = { fill: '#8B9ABF', fontSize: 11 }

export default function LeagueChart({ leagues }: LeagueChartProps) {
  const data = [...leagues]
    .sort((a, b) => b.avg_effectiveness - a.avg_effectiveness)
    .slice(0, 10)
    .map((l) => ({ name: l.team_abbr, value: Math.round(l.avg_effectiveness * 100) }))

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232A42" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={TICK} axisLine={false} tickLine={false} unit="%" />
        <YAxis type="category" dataKey="name" width={44} tick={TICK} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#1C2238', border: '1px solid #232A42', borderRadius: '8px', color: '#F5F6FC' }}
          cursor={{ fill: 'rgba(245,158,11,0.08)' }}
          formatter={(v) => [`${v}%`, 'Efectividad media']}
        />
        <Bar dataKey="value" fill="#F59E0B" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
