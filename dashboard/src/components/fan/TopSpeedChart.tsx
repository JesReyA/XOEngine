import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TopPlayer } from '../../types/api'

interface TopSpeedChartProps {
  players: TopPlayer[]
}

const TICK = { fill: '#8B9ABF', fontSize: 11 }

export default function TopSpeedChart({ players }: TopSpeedChartProps) {
  if (players.length === 0) {
    return <p className="py-10 text-center text-sm text-xo-text-secondary">Ningún jugador coincide con la búsqueda.</p>
  }

  const data = players.map((p) => ({ name: `${p.display_name} (${p.team})`, max_speed: p.max_speed }))

  return (
    <ResponsiveContainer width="100%" height={Math.max(240, players.length * 48)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232A42" horizontal={false} />
        <XAxis type="number" tick={TICK} axisLine={false} tickLine={false} unit=" yd/s" domain={[0, 'dataMax + 1']} />
        <YAxis type="category" dataKey="name" width={150} tick={TICK} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#1C2238', border: '1px solid #232A42', borderRadius: '8px', color: '#F5F6FC' }}
          cursor={{ fill: 'rgba(96,56,245,0.08)' }}
          formatter={(v) => [`${v} yd/s`, 'Velocidad máxima']}
        />
        <Bar dataKey="max_speed" fill="#6038F5" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
