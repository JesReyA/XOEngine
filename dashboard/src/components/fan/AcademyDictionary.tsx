interface Term {
  name: string
  plain: string
  example: string
}

const TERMS: Term[] = [
  { name: 'Separación promedio', plain: 'Cuántas yardas de ventaja saca un receptor sobre su defensor cuando llega el balón.', example: '3 yardas son más o menos una puerta de distancia.' },
  { name: 'Yardas después de la recepción (YAC)', plain: 'Lo que el receptor avanza después de atrapar el balón, ya sin ayuda del mariscal.', example: 'Atrapa en la yarda 30 y lo tumban en la 38: 8 de YAC.' },
  { name: 'Eficiencia en zona roja', plain: 'Qué porcentaje de las veces que un equipo llega a las últimas 20 yardas termina anotando.', example: '58% significa que casi 6 de cada 10 visitas acaban en touchdown.' },
  { name: 'Velocidad punta', plain: 'La velocidad más alta que alcanza un jugador en una jugada, medida en yardas por segundo.', example: '11 yd/s equivalen a unos 36 km/h.' },
  { name: 'Tasa de blitz', plain: 'Con qué frecuencia la defensa manda a 5 o más jugadores a presionar al mariscal.', example: '40% en tercer down: casi la mitad de las veces te cargan.' },
]

interface AcademyDictionaryProps {
  onAsk: (text: string, autoSend?: boolean) => void
}

export default function AcademyDictionary({ onAsk }: AcademyDictionaryProps) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {TERMS.map((t, i) => (
        <li
          key={t.name}
          className="bg-xo-elevated border border-xo-border rounded-card p-4 flex flex-col animate-panel-enter"
          style={{ animationDelay: `${i * 35}ms` }}
        >
          <h3 className="font-semibold">{t.name}</h3>
          <p className="mt-1 text-sm text-xo-text-secondary">{t.plain}</p>
          <p className="mt-2 text-sm bg-xo-surface rounded-chip px-3 py-2">{t.example}</p>
          <button
            type="button"
            onClick={() => onAsk(`Dame un ejemplo sencillo de ${t.name} con datos reales de la NFL.`, true)}
            className="mt-3 self-start text-sm font-medium text-xo-fan-accent border border-xo-fan-accent/40 hover:bg-xo-fan-accent/10 px-3 py-1.5 rounded-chip press-tactile"
          >
            Pedir ejemplo a la IA
          </button>
        </li>
      ))}
    </ul>
  )
}
