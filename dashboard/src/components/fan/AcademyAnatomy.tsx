import type { ReactNode } from 'react'

function Card({ title, children, visual }: { title: string; children: ReactNode; visual: ReactNode }) {
  return (
    <article className="bg-xo-elevated border border-xo-border rounded-card p-4 flex flex-col gap-3 animate-panel-enter">
      <h3 className="text-lg font-semibold">{title}</h3>
      {visual}
      <div className="text-sm text-xo-text-secondary space-y-1">{children}</div>
    </article>
  )
}

function Quarters() {
  return (
    <svg viewBox="0 0 300 56" className="w-full" role="img" aria-label="Cuatro cuartos de 15 minutos con medio tiempo">
      {[0, 1, 2, 3].map((i) => {
        const x = i * 70 + (i >= 2 ? 20 : 0)
        return (
          <g key={i}>
            <rect x={x} y="6" width="62" height="32" rx="6" fill="#14182A" stroke="#F59E0B" strokeOpacity="0.5" />
            <text x={x + 31} y="20" textAnchor="middle" fill="#F5F6FC" fontSize="11" fontWeight="600">Q{i + 1}</text>
            <text x={x + 31} y="33" textAnchor="middle" fill="#8B9ABF" fontSize="9">15:00</text>
          </g>
        )
      })}
      <text x="150" y="52" textAnchor="middle" fill="#8B9ABF" fontSize="9">Medio tiempo</text>
    </svg>
  )
}

function Downs() {
  return (
    <div>
      <ol className="flex items-center gap-2">
        {['1ª', '2ª', '3ª', '4ª'].map((d, i) => (
          <li key={d} className="flex items-center gap-2">
            <span className={`w-10 h-10 rounded-pill flex items-center justify-center text-sm font-bold font-mono ${i === 3 ? 'bg-xo-fan-accent text-xo-deep-bg' : 'bg-xo-surface border border-xo-border'}`}>{d}</span>
            {i < 3 && <span aria-hidden="true" className="text-xo-text-muted">→</span>}
          </li>
        ))}
      </ol>
      <ul className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <li className="bg-xo-surface rounded-chip p-2"><strong className="block text-xo-text-primary">Despeje</strong>Patear el balón lejos</li>
        <li className="bg-xo-surface rounded-chip p-2"><strong className="block text-xo-text-primary">Gol de campo</strong>3 puntos si estás cerca</li>
        <li className="bg-xo-surface rounded-chip p-2"><strong className="block text-xo-text-primary">Jugártela</strong>Intentar la yarda faltante</li>
      </ul>
    </div>
  )
}

function Zones() {
  return (
    <svg viewBox="0 0 300 70" className="w-full" role="img" aria-label="Zonas del campo: zona de anotación, zona roja y medio campo">
      <rect x="0" y="0" width="300" height="70" rx="6" fill="#2D5A27" />
      <rect x="0" y="0" width="30" height="70" rx="6" fill="#1E3D1A" />
      <rect x="270" y="0" width="30" height="70" rx="6" fill="#1E3D1A" />
      <rect x="210" y="0" width="60" height="70" fill="#D50A0A" fillOpacity="0.3" />
      {[60, 90, 120, 150, 180, 210, 240].map((x) => (
        <line key={x} x1={x} x2={x} y1="0" y2="70" stroke="rgba(255,255,255,0.25)" />
      ))}
      <text x="15" y="38" textAnchor="middle" fill="#F5F6FC" fontSize="8" transform="rotate(-90 15 35)">ZONA DE ANOTACIÓN</text>
      <text x="150" y="38" textAnchor="middle" fill="#F5F6FC" fontSize="10" fontWeight="600">Medio campo</text>
      <text x="240" y="38" textAnchor="middle" fill="#F5F6FC" fontSize="10" fontWeight="600">Zona roja</text>
    </svg>
  )
}

export default function AcademyAnatomy() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Los cuartos" visual={<Quarters />}>
        <p>Cuatro periodos de 15 minutos. Entre el 2º y el 3º hay descanso.</p>
      </Card>
      <Card
        title="El reloj"
        visual={
          <div className="flex gap-2 text-xs">
            <span className="flex-1 bg-xo-success/15 text-xo-success rounded-chip p-2">Corre: acarreos y pases completos dentro de la cancha</span>
            <span className="flex-1 bg-xo-warning/15 text-xo-warning rounded-chip p-2">Se detiene: pase incompleto, salir de la banda, tiempo fuera</span>
          </div>
        }
      >
        <p>Por eso los equipos juegan por la banda cuando necesitan tiempo.</p>
      </Card>
      <Card title="Las 4 oportunidades" visual={<Downs />}>
        <p>Tienes 4 intentos (downs) para avanzar 10 yardas. Si lo logras, empiezas de nuevo con 4 más.</p>
      </Card>
      <Card title="Las zonas del campo" visual={<Zones />}>
        <p>La cancha mide 100 yardas más dos zonas de anotación. Dentro de las últimas 20 yardas (zona roja) anotar es más probable.</p>
      </Card>
    </div>
  )
}
