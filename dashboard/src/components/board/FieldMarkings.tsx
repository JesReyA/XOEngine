import { toSvg } from './routePaths'

interface FieldMarkingsProps {
  lineOfScrimmage: number // yardas (x)
  firstDownLine: number // yardas (x)
}

const NUMBERS = [10, 20, 30, 40, 50, 40, 30, 20, 10]
const LINE = 'rgba(255,255,255,0.2)'
// Hash marks NFL: 70'9" desde cada banda ≈ 23.58 yd y 29.75 yd.
const HASH_Y = [235.8, 297.5]

export default function FieldMarkings({ lineOfScrimmage, firstDownLine }: FieldMarkingsProps) {
  const yardTicks = Array.from({ length: 99 }, (_, i) => 110 + i * 10).filter(
    (x) => x < 1100,
  )

  return (
    <g aria-hidden="true">
      <rect width="1200" height="533" fill="#2D5A27" />
      <rect x="0" y="0" width="100" height="533" fill="#1E3D1A" />
      <rect x="1100" y="0" width="100" height="533" fill="#1E3D1A" />

      {/* Líneas de yarda cada 10 yd; las de 0 y 100 son las líneas de gol */}
      {Array.from({ length: 11 }, (_, i) => 100 + i * 100).map((x) => (
        <line
          key={x}
          x1={x}
          x2={x}
          y1="0"
          y2="533"
          stroke={x === 100 || x === 1100 ? 'rgba(255,255,255,0.7)' : LINE}
          strokeWidth={x === 100 || x === 1100 ? 3 : 1}
        />
      ))}

      {/* Hash marks y marcas de banda en cada yarda */}
      {yardTicks.map((x) => (
        <g key={x} stroke="rgba(255,255,255,0.28)" strokeWidth="1">
          {HASH_Y.map((y) => (
            <line key={y} x1={x} x2={x} y1={y - 5} y2={y + 5} />
          ))}
          <line x1={x} x2={x} y1="0" y2="8" />
          <line x1={x} x2={x} y1="525" y2="533" />
        </g>
      ))}

      {/* Números de yarda */}
      {NUMBERS.map((n, i) => {
        const x = 200 + i * 100
        return (
          <g key={x} fill="rgba(255,255,255,0.4)" fontSize="14" textAnchor="middle">
            <text x={x} y="20">{n}</text>
            <text x={x} y="513">{n}</text>
          </g>
        )
      })}

      {/* Línea de scrimmage y primer down */}
      <line
        x1={toSvg(lineOfScrimmage)}
        x2={toSvg(lineOfScrimmage)}
        y1="0"
        y2="533"
        stroke="#FFD700"
        strokeWidth="2"
        strokeDasharray="8 4"
      />
      <line
        x1={toSvg(firstDownLine)}
        x2={toSvg(firstDownLine)}
        y1="0"
        y2="533"
        stroke="#00BFFF"
        strokeWidth="2"
        strokeDasharray="8 4"
      />
    </g>
  )
}
