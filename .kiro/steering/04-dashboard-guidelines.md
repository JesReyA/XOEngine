# X&O Engine — Guía de Dashboard (Frontend)

Propietario: **Integrante 2**. Carpeta exclusiva: `dashboard/src/`, `dashboard/public/`.

---

## Estructura de Archivos

```
dashboard/
├── index.html
├── vite.config.ts           # base: './', proxy /api → localhost:8000
├── tailwind.config.js       # Tailwind v3
├── tsconfig.json
└── src/
    ├── main.tsx
    ├── App.tsx              # Router dual Entrenador / Aficionado
    ├── types/
    │   └── api.ts           # Tipos TypeScript del contrato (02-api-contract.md)
    ├── services/
    │   └── api.ts           # Funciones fetch — RUTAS RELATIVAS sin /
    ├── mocks/
    │   ├── simulateMock.ts
    │   ├── statsMock.ts
    │   ├── scoutingMock.ts
    │   ├── challengeMock.ts
    │   └── rankingsMock.ts
    ├── components/
    │   ├── shared/
    │   │   ├── Navbar.tsx           # Toggle Entrenador / Aficionado + indicador de vista
    │   │   ├── Copilot.tsx          # Chat flotante omnipresente
    │   │   └── EffectivenessBar.tsx # Barra de porcentaje con desglose de factores
    │   ├── board/
    │   │   ├── TacticalBoard.tsx    # Cancha NFL 2D en <svg>, fichas arrastrables
    │   │   ├── PlayerToken.tsx      # Ficha individual de jugador
    │   │   ├── AnimationPlayer.tsx  # Reproduce frames a 10 Hz
    │   │   └── RouteDrawer.tsx      # Dibuja rutas sobre el SVG
    │   ├── coach/
    │   │   ├── CoachView.tsx        # Layout de la vista del Entrenador
    │   │   └── ScoutingPanel.tsx    # Perfiles + alertas críticas
    │   └── fan/
    │       ├── FanView.tsx          # Layout de la vista del Aficionado
    │       ├── StatsExplorer.tsx    # Explorador de estadísticas y curiosidades
    │       ├── MyTeam.tsx           # Panel de equipo favorito
    │       ├── Challenge.tsx        # Reto de 5 jugadas
    │       ├── Rankings.tsx         # Tabla de líderes individual + liga de aficiones
    │       └── NflAcademy.tsx       # Pestaña Academia NFL
    └── hooks/
        └── useAnimation.ts         # Lógica de reproducción de frames
```

---

## `vite.config.ts` (Obligatorio)

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // obligatorio para despliegue en subruta AWS
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
});
```

---

## `tailwind.config.js` (Tailwind v3)

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nfl: {
          dark: "#013369", // azul NFL
          red: "#D50A0A", // rojo NFL
          field: "#4A7C59", // verde campo
          line: "#FFFFFF",
        },
      },
    },
  },
  plugins: [],
};
```

En `src/index.css` usar sintaxis v3:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Nunca** usar `@import "tailwindcss"` ni `@theme` (son sintaxis de Tailwind v4).

---

## Regla Crítica de Rutas (fetch)

Toda llamada de red usa rutas **sin diagonal inicial**:

```ts
// ✅ Correcto
fetch('api/simulate', { method: 'POST', body: JSON.stringify(payload) })
fetch('api/stats?team=KC')

// ❌ Incorrecto — rompe en producción AWS
fetch('/api/simulate', ...)
fetch('http://localhost:8000/api/simulate', ...)
```

La misma regla aplica a rutas de assets e imágenes:

```tsx
// ✅
<img src="assets/logo.png" />

// ❌
<img src="/assets/logo.png" />
```

---

## `dashboard/src/services/api.ts`

Centraliza todas las llamadas al backend. El Integrante 2 importa desde aquí; **nunca** hace `fetch` directamente en componentes.

```ts
import type {
  SimulateRequest,
  SimulateResponse,
  ChatRequest,
  ChatResponse,
  ChallengeRequest,
  ChallengeResponse,
  RankingsSubmitRequest,
  RankingsSubmitResponse,
} from "../types/api";

const json = (res: Response) => res.json();

export const api = {
  health: () => fetch("api/health").then(json),

  stats: (params?: { team?: string; player_id?: number }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return fetch(`api/stats${qs ? "?" + qs : ""}`).then(json);
  },

  team: (abbr: string) => fetch(`api/team/${abbr}`).then(json),

  scouting: (params?: {
    player_id?: number;
    team?: string;
    opponent?: string;
  }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return fetch(`api/scouting${qs ? "?" + qs : ""}`).then(json);
  },

  simulate: (body: SimulateRequest): Promise<SimulateResponse> =>
    fetch("api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(json),

  challenge: (body: ChallengeRequest): Promise<ChallengeResponse> =>
    fetch("api/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(json),

  rankings: (params?: { limit?: number; team?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return fetch(`api/rankings${qs ? "?" + qs : ""}`).then(json);
  },

  submitRanking: (
    body: RankingsSubmitRequest,
  ): Promise<RankingsSubmitResponse> =>
    fetch("api/rankings/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(json),

  chat: (body: ChatRequest): Promise<ChatResponse> =>
    fetch("api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(json),
};
```

---

## Capa de Mocks

Cuando el backend no está disponible (desarrollo independiente), `services/api.ts` puede importar desde `mocks/`. El flag de control:

```ts
// services/api.ts — flag para desarrollo sin backend
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
```

Cada mock devuelve datos tipados que respetan exactamente el contrato de `02-api-contract.md`:

```ts
// mocks/simulateMock.ts
import type { SimulateResponse } from "../types/api";

export const simulateMock: SimulateResponse = {
  play_id_ref: "mock_sim_001",
  frames: [
    {
      frame: 0,
      t_ms: 0,
      players: [{ player_id: 1, x: 20, y: 26.5, speed: 0, dir: 90 }],
    },
    {
      frame: 1,
      t_ms: 100,
      players: [{ player_id: 1, x: 20.6, y: 27.0, speed: 4.1, dir: 92 }],
    },
  ],
  total_frames: 2,
  fps: 10,
  effectiveness: {
    score: 0.67,
    label: "67%",
    factors: [
      {
        name: "Separación del receptor",
        weight: 0.31,
        value: 2.8,
        impact: "positive",
      },
    ],
  },
  similar_plays_found: 14,
};
```

---

## `App.tsx` — Navegación Dual

```tsx
import { useState } from "react";
import CoachView from "./components/coach/CoachView";
import FanView from "./components/fan/FanView";
import Navbar from "./components/shared/Navbar";
import Copilot from "./components/shared/Copilot";
import type { Mode, CurrentView } from "./types/api";

export default function App() {
  const [mode, setMode] = useState<Mode>("fan");
  const [view, setView] = useState<CurrentView>("stats");

  // navigate_to desde el copiloto cambia la vista activa
  const handleNavigate = (target: CurrentView) => setView(target);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar
        mode={mode}
        onModeChange={setMode}
        currentView={view}
        onNavigate={setView}
      />
      {mode === "coach" ? (
        <CoachView currentView={view} onNavigate={handleNavigate} />
      ) : (
        <FanView currentView={view} onNavigate={handleNavigate} />
      )}
      <Copilot mode={mode} currentView={view} onNavigate={handleNavigate} />
    </div>
  );
}
```

---

## `components/board/TacticalBoard.tsx` — Pizarra 2D en SVG

### Especificaciones del SVG

- Viewbox: `0 0 1200 533` (proporcional a 120 yd × 53.3 yd de cancha NFL)
- Escala: 10 px por yarda
- Elementos obligatorios del SVG:
  - Fondo verde con líneas de yarda cada 10 yd
  - Zona de anotación (end zones) en cada extremo
  - Línea de _scrimmage_ y línea de primer down en color distinto
  - Fichas arrastrables (`<circle>`) para jugadores ofensivos (azul) y defensivos (rojo)
  - Rutas animadas (`<path>` con `stroke-dasharray` animado) dibujadas en tiempo real

### Props

```ts
interface TacticalBoardProps {
  players: PlayerInput[];
  frames: SimFrame[];
  currentFrame: number;
  isPlaying: boolean;
  onPlayerMove: (playerId: number, x: number, y: number) => void;
}
```

### Conversión de coordenadas

```ts
// Coordenadas del dataset (yardas) → píxeles del SVG
const toSvgX = (yd: number) => yd * 10;
const toSvgY = (yd: number) => yd * 10;
```

### Arrastre de fichas

Usar eventos `onMouseDown` / `onMouseMove` / `onMouseUp` nativos del SVG (sin librerías de drag & drop). Al soltar, llamar `onPlayerMove` con las coordenadas en yardas.

---

## `hooks/useAnimation.ts`

```ts
import { useEffect, useRef, useState } from "react";
import type { SimFrame } from "../types/api";

export function useAnimation(frames: SimFrame[], fps: number = 10) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);
  const reset = () => {
    setCurrentFrame(0);
    setIsPlaying(false);
  };

  useEffect(() => {
    if (!isPlaying) {
      clearInterval(intervalRef.current!);
      return;
    }
    intervalRef.current = setInterval(() => {
      setCurrentFrame((prev) => {
        if (prev >= frames.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / fps);
    return () => clearInterval(intervalRef.current!);
  }, [isPlaying, frames.length, fps]);

  return { currentFrame, isPlaying, play, pause, reset };
}
```

---

## `components/shared/Copilot.tsx` — Chat Flotante

- Botón flotante fijo en esquina inferior derecha (`fixed bottom-6 right-6`).
- Al abrir, muestra un panel lateral o modal con historial de mensajes.
- No interrumpe la vista activa.
- Envía `mode` y `current_view` en cada request a `api/chat`.
- Si la respuesta incluye `navigate_to !== null`, llama al callback `onNavigate`.
- Si la respuesta incluye `suggested_players` con elementos, dispara un evento/callback para actualizar la pizarra si está activa.
- Muestra un indicador sutil si `ai_available === false` (modo heurístico).

---

## `components/fan/Challenge.tsx` — Reto de 5 Jugadas

### Flujo de UI

1. Se cargan los 5 escenarios del juego elegido (desde mock o API).
2. Para cada escenario:
   a. Se muestra la pizarra 2D con la situación pre-jugada.
   b. El usuario elige entre 3 opciones con descripción táctica **o** escribe libremente en un textarea.
   c. Al confirmar, se llama `api.challenge()` con `decision_type` y datos del escenario.
   d. Se reproduce la animación del resultado y se muestra el veredicto + efectividad.
   e. Aparece un botón «Siguiente jugada» o «Ver resultados» en el paso 5.
3. Al terminar los 5 pasos, se muestra resumen y se llama `api.submitRanking()`.

### Estado local

```ts
const [step, setStep] = useState(0); // 0–4
const [scores, setScores] = useState<number[]>([]); // puntuación por paso
const [freeText, setFreeText] = useState("");
const [selectedOption, setSelectedOption] = useState<string | null>(null);
```

---

## `components/fan/Rankings.tsx` — Rankings Dobles

- Tabla superior: ranking individual con columnas `#`, `Usuario`, `Equipo`, `Puntuación`, `Efectividad %`, `Racha`.
- Tabla inferior: liga de aficiones con columnas `#`, `Franquicia`, `Puntuación Media`, `Efectividad %`, `Participantes`.
- Usar `Recharts` (`BarChart`) para visualizar las top 10 franquicias por efectividad.
- Se actualiza automáticamente al montar el componente con `api.rankings()`.

---

## `components/fan/NflAcademy.tsx` — Academia NFL

### Secciones obligatorias

1. **Anatomía del Juego** — explicación de cuartos, el reloj y la regla de 4 intentos para avanzar 10 yardas. Usar cards con iconos SVG simples.
2. **Jugadas Básicas Animadas** — al menos 3 jugadas básicas (run up the middle, slant route, screen pass) mostradas en la pizarra 2D en modo solo-lectura con animación automática al hacer hover o clic.
3. **Diccionario de Estadísticas** — lista de términos clave (yards after contact, separation, air yards, etc.) con definición breve. Al hacer clic en cualquier término, abre el copiloto con el término pre-cargado como mensaje.

### Implementación de jugadas básicas

Cada jugada básica usa frames hardcodeados (no llama a la API) para funcionar sin backend:

```ts
const BASIC_PLAYS: Record<string, SimulateResponse> = {
  slant_route: {
    play_id_ref: "academy_slant_01",
    frames: [
      /* frames hardcodeados */
    ],
    total_frames: 20,
    fps: 10,
    effectiveness: { score: 0.62, label: "62%", factors: [] },
    similar_plays_found: 0,
  },
};
```

---

## `components/fan/StatsExplorer.tsx` — Estadísticas y Curiosidades

- Sección «Estadísticas de Liga» con `Recharts` (`RadarChart` o `BarChart`): velocidad, separación, aceleración promedio por posición.
- Sección «¿Sabías qué?» con cards de `fun_facts` del endpoint `GET /api/stats`. Cada card tiene animación de entrada con CSS.
- Selector de equipo para filtrar: al cambiar, llama `api.stats({ team })`.
- Selector de jugador (autocomplete de texto) para ver perfil individual.

---

## Recharts — Uso Permitido

Importar solo componentes necesarios para mantener el bundle pequeño:

```ts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer, // para rankings
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis, // para scouting
  LineChart,
  Line, // para progresión en el tiempo
} from "recharts";
```

Siempre envolver en `<ResponsiveContainer width="100%" height={300}>`.

---

## Paleta de Colores y Convenciones de UI

| Elemento                   | Clase Tailwind                                   |
| -------------------------- | ------------------------------------------------ |
| Fondo principal            | `bg-gray-950`                                    |
| Paneles / cards            | `bg-gray-900 rounded-xl p-4`                     |
| Acento azul NFL            | `text-blue-600 bg-blue-600` (aproxima `#013369`) |
| Acento rojo NFL            | `text-red-600 bg-red-600` (aproxima `#D50A0A`)   |
| Texto principal            | `text-white`                                     |
| Texto secundario           | `text-gray-400`                                  |
| Fichas ofensivas           | `fill-blue-500` (SVG)                            |
| Fichas defensivas          | `fill-red-500` (SVG)                             |
| Efectividad alta (>70%)    | `text-green-400`                                 |
| Efectividad media (40–70%) | `text-yellow-400`                                |
| Efectividad baja (<40%)    | `text-red-400`                                   |

---

## Checklist del Integrante 2

- [ ] `vite.config.ts` tiene `base: './'` y proxy `/api`
- [ ] `tailwind.config.js` usa sintaxis v3 (`@tailwind base/components/utilities`)
- [ ] Ningún `fetch` en el código usa `/api/...` ni `localhost` ni URL absoluta
- [ ] Todos los tipos en `types/api.ts` coinciden exactamente con `02-api-contract.md`
- [ ] `services/api.ts` centraliza todas las llamadas; los componentes nunca llaman `fetch` directamente
- [ ] Existe un mock para cada endpoint en `mocks/`
- [ ] `NflAcademy.tsx` está en `components/fan/NflAcademy.tsx`
- [ ] El copiloto flotante usa `navigate_to` para cambiar la vista activa
- [ ] La pizarra 2D usa `<svg>` nativo (sin librerías de canvas adicionales fuera del stack)
- [ ] `Recharts` es el único motor de gráficas
- [ ] No se agrega ninguna dependencia npm fuera del stack de `rules.md`
