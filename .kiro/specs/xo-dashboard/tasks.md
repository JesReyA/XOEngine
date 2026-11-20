# X&O Engine Dashboard — Tasks

## Metadata

- **Spec:** xo-dashboard
- **Propietario:** Integrante 2 (Frontend)
- **Estrategia:** Las tareas están ordenadas por dependencia. Cada grupo puede ejecutarse en paralelo dentro del grupo; los grupos deben ejecutarse en orden.

---

## Grupo 0 — Scaffolding y Configuración Base

### T-00 Inicializar proyecto Vite + React + TypeScript

- [x] Ejecutar `npm create vite@5.4.21 dashboard -- --template react-ts` desde la raíz del repositorio.
- [x] Verificar que `dashboard/package.json` lista `react@18.3.1`, `react-dom@18.3.1`, `typescript@5.7.3`, `vite@5.4.21`.
- [x] Eliminar archivos de ejemplo: `src/App.css`, `src/assets/react.svg`, contenido de `src/App.tsx`.

### T-01 Instalar dependencias del stack

- [x] `npm install recharts@3.10.1` dentro de `dashboard/`.
- [x] `npm install -D tailwindcss@3.4.19 autoprefixer postcss`.
- [x] `npx tailwindcss init -p` para generar `tailwind.config.js` y `postcss.config.js`.
- [x] Verificar que no hay dependencias fuera del stack (prohibido: lucide-react, framer-motion, shadcn, react-router-dom, zustand, react-dnd).

### T-02 Configurar `tailwind.config.js`

- [x] Reemplazar el contenido con la extensión de colores `xo.*` definida en `design.md` §1.
- [x] Añadir `fontFamily.sans: ['Inter', ...]` y `fontFamily.mono: ['JetBrains Mono', ...]`.
- [x] Añadir `borderRadius.card`, `borderRadius.chip`, `borderRadius.pill`.
- [x] `content` cubre `./index.html` y `./src/**/*.{ts,tsx}`.

### T-03 Configurar `vite.config.ts`

- [x] `base: './'` — obligatorio para AWS.
- [x] Proxy `'/api': 'http://localhost:8000'`.
- [x] Plugin `@vitejs/plugin-react`.

### T-04 Configurar `src/index.css`

- [x] Primeras tres líneas: `@tailwind base; @tailwind components; @tailwind utilities;`.
- [x] Variables CSS: `--ease-apple` y `--ease-snappy` en `:root`.
- [x] Clases base: `.ease-apple`, `.press-tactile` con `:active`.
- [x] Keyframes y clases: `@keyframes panelEnter` → `.animate-panel-enter`.
- [x] `@keyframes slideInRight` → `.animate-slide-in-right`.
- [x] `@keyframes slideOutRight` → `.animate-slide-out-right`.
- [x] Clases `.stagger-1` a `.stagger-4` con `animation-delay`.
- [x] Bloque `@media (prefers-reduced-motion: reduce)`.
- [x] Focus visible global en capa `@layer base`.

### T-05 Cargar fuentes en `index.html`

- [x] `<link rel="preconnect" href="https://fonts.googleapis.com">`.
- [x] `<link>` de Google Fonts: `Inter` pesos 400, 500, 600, 700 + `JetBrains+Mono` peso 700, con `display=swap`.
- [x] `<title>X&O Engine</title>`.
- [x] `<meta name="description" content="Plataforma de analítica táctica NFL">`.

### T-06 Crear tipos TypeScript en `src/types/api.ts`

- [x] Copiar y completar exactamente los tipos definidos en `02-api-contract.md`:
  - `Mode`, `CurrentView` (incluyendo `'team'`: `'board' | 'scouting' | 'stats' | 'team' | 'challenge' | 'rankings' | 'academy'`), `DecisionType`, `ImpactType`
  - `PlayerInput`, `PlayerFrame`, `SimFrame`
  - `EffectivenessFactor`, `Effectiveness`
  - `SimulateRequest`, `SimulateResponse`
  - `ChatContext`, `ChatRequest`, `ChatResponse`
  - `ChallengeScenario`, `ChallengeScenariosResponse` (para `GET /api/challenge`), `ChallengeRequest`, `ChallengeResponse` (para `POST /api/challenge`)
  - `StatsResponse`, `TeamResponse`, `ScoutingResponse`, `RankingsResponse` (para los endpoints `GET` y `mocks/`)
  - `RankingsSubmitRequest`, `RankingsSubmitResponse`
- [x] Mantener en este archivo únicamente los tipos del contrato de API; los tipos internos de UI van en sus propios componentes.

### T-07 Crear capa de servicios `src/services/api.ts`

- [x] Flag `const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'`.
- [x] Implementar todas las funciones de `api.*` del contrato (`health`, `stats`, `team`, `scouting`, `simulate`, `getChallenge`, `challenge`, `rankings`, `submitRanking`, `chat`).
- [x] Todas las rutas `fetch` sin diagonal inicial: `'api/...'`.
- [x] Cuando `USE_MOCK=true`, importar y retornar los mocks correspondientes.
- [x] Ninguna función retorna datos directamente hardcodeados; los mocks son importaciones tipadas.

### T-08 Crear mocks tipados en `src/mocks/`

- [x] `simulateMock.ts` — `SimulateResponse` con 3 jugadores en `frames[0].players` y al menos 20 frames.
- [x] `statsMock.ts` — `StatsResponse` con 5 `top_players`, 4 `fun_facts`.
- [x] `scoutingMock.ts` — `ScoutingResponse` con `player_profile`, `team_profile` y 3 `critical_alerts` (1 high, 1 medium, 1 low).
- [x] `challengeMock.ts` — `ChallengeScenariosResponse` (5 escenarios iniciales) + `ChallengeResponse` con 3 `options_reference` y veredicto completo.
- [x] `rankingsMock.ts` — `RankingsResponse` con 5 entradas en `individual` y 5 en `fan_leagues`.
- [x] `teamMock.ts` — `TeamResponse` con calendario, jugadores clave y próximo rival.

---

## Grupo 1 — Estructura Principal y Navegación

### T-10 `src/App.tsx`

- [x] Estado: `mode: Mode` (default `'fan'`), `view: CurrentView` (default `'stats'`).
- [x] Handler `handleNavigate(v: CurrentView)` que actualiza `view`.
- [x] Handler `handleModeChange(m: Mode)` que actualiza `mode` y resetea `view` al default del modo (`'board'` para coach, `'stats'` para fan).
- [x] Estado `suggestedPlayers: PlayerInput[]` que se pasa hacia abajo; actualizable desde `Copilot`.
- [x] Renderiza: `<Navbar>`, condicional `<CoachView>` o `<FanView>`, `<Copilot>`.
- [x] `className` del div raíz: `min-h-screen bg-xo-deep-bg text-xo-text-primary font-sans`.

### T-11 `src/components/shared/Navbar.tsx`

- [x] Props: `mode`, `onModeChange`, `currentView`, `onNavigate`.
- [x] Logotipo izquierdo: texto «X&O Engine» con «X&O» en `text-xo-electric` y «Engine» en `text-xo-text-primary`, `text-lg font-bold`.
- [x] Interruptor central: contenedor `bg-xo-surface rounded-pill p-1 flex relative`.
  - Píldora deslizante absoluta: `bg-xo-electric` (coach) / `bg-xo-fan-accent` (fan), transición `transform 240ms ease-apple`.
  - Dos botones `role="tab"` con `aria-selected`.
  - Icono SVG `IconBriefcase` (coach) e `IconTrophy` (fan) con texto.
- [x] Zona derecha: `IconBell` + avatar círculo 32 px con iniciales «JR».
- [x] `role="tablist"` en el contenedor del interruptor.
- [x] Clases: `h-14 bg-xo-surface border-b border-xo-border flex items-center justify-between px-6`.

### T-12 Sidebar compartido (`src/components/shared/Sidebar.tsx`)

- [x] Props: `mode`, `currentView`, `onNavigate`.
- [x] Modo Coach: ítems Sala Táctica (→`board`), Scouting (→`scouting`).
- [x] Modo Fan: ítems Estadísticas (→`stats`), Mi Equipo, Juega a ser el Entrenador (→`challenge`), Rankings (→`rankings`), Academia NFL (→`academy`).
- [x] Ítem activo: `bg-xo-electric/15 border-l-2 border-xo-electric text-xo-text-primary` (coach) / misma lógica con `fan-accent` (fan).
- [x] Ítem inactivo: `text-xo-text-secondary hover:text-xo-text-primary hover:bg-xo-elevated/50 press-tactile`.
- [x] Logo NFL en la parte inferior: círculo 48 px con texto «NFL» en gris.
- [x] Clases del contenedor: `w-56 bg-xo-surface border-r border-xo-border flex flex-col py-4`.

### T-13 Layout principal (`src/components/shared/MainLayout.tsx`)

- [x] Envuelve `Sidebar` + slot de contenido (`children`).
- [x] `flex h-[calc(100vh-56px)]` (altura total menos navbar).
- [x] Área de contenido: `flex-1 overflow-y-auto bg-xo-deep-bg p-6`.

---

## Grupo 2 — Componentes de la Pizarra

### T-20 `src/hooks/useAnimation.ts`

- [x] Implementar exactamente como define `04-dashboard-guidelines.md`.
- [x] Funciones exportadas: `play`, `pause`, `reset`, `goToFrame(n)`.
- [x] Limpiar `setInterval` en cleanup del `useEffect`.
- [x] Exportar también `totalFrames` para el scrubber.

### T-21 `src/hooks/useInterpolation.ts`

- [x] Hook que recibe `frames: SimFrame[]`, `currentFrame: number`, `fps: number`.
- [x] Calcula la posición interpolada de cada jugador entre `frames[currentFrame]` y `frames[currentFrame+1]` usando `requestAnimationFrame`.
- [x] Retorna `interpolatedPlayers: PlayerFrame[]` actualizados a 60 fps.
- [x] Se desactiva (devuelve players del frame exacto) si `frames.length <= 1`.

### T-22 `src/components/board/PlayerToken.tsx`

- [x] Props: `player: PlayerFrame & { role: string; team: 'offense' | 'defense' }`, `isDragging: boolean`, `isSelected: boolean`, `svgScale: number`.
- [x] `<circle>` con `fill` según equipo: `#6038F5` (offense) / `#D50A0A` (defense).
- [x] Stroke de selección: `<circle r="20">` exterior con `stroke="#8B6CFF"` y opacity animada.
- [x] `transform="scale(1.14)"` cuando `isDragging`, con transición `140ms ease-apple`.
- [x] Texto del rol: `<text>` centrado, `fontSize="8"`, `fontWeight="700"`, `fill="white"`.
- [x] `aria-label={player.role}`.

### T-23 `src/components/board/RouteDrawer.tsx`

- [x] Props: `trajectories: Array<{ playerId: number; points: [number, number][] }>`, `progress: number` (0–1).
- [x] Por cada trayectoria, calcula `totalLength` y `drawnLength = totalLength * progress`.
- [x] `<path stroke="#8B6CFF" strokeWidth="1.5" fill="none" opacity="0.5" strokeDasharray={totalLength} strokeDashoffset={totalLength - drawnLength}/>`.
- [x] Color de ruta defensiva: `stroke="#FF6B6B"`.

### T-24 `src/components/board/AnimationPlayer.tsx`

- [x] Props: `currentFrame`, `totalFrames`, `isPlaying`, `fps`, `onPlay`, `onPause`, `onReset`, `onSeek(frame)`.
- [x] Scrubber: `<input type="range">` estilizado con Tailwind, `accent-color: #6038F5`.
- [x] Tiempo formateado: `${(currentFrame / fps).toFixed(1)}s / ${(totalFrames / fps).toFixed(1)}s`.
- [x] Botones play/pause/reset con SVG inline y clase `press-tactile`.
- [x] Botón de pantalla completa con `IconExpand`.

### T-25 `src/components/board/TacticalBoard.tsx`

- [x] Props: `players: PlayerInput[]`, `frames: SimFrame[]`, `currentFrame: number`, `isPlaying: boolean`, `readOnly?: boolean`, `onPlayerMove?: (id, x, y) => void`.
- [x] `<svg viewBox="0 0 1200 533" className="w-full h-full select-none">`.
- [x] Cancha: `<rect>` verde `#2D5A27`, end zones `#1E3D1A`, líneas de yarda cada 100 px (`10px/yd * 10yd`).
- [x] Números de yarda: `<text>` SVG a `y=20` y `y=513`, `fill="rgba(255,255,255,0.4)"`, `fontSize="14"`.
- [x] Línea de scrimmage: `stroke="#FFD700" strokeWidth="2" strokeDasharray="8 4"`.
- [x] Línea de primer down: `stroke="#00BFFF" strokeWidth="2" strokeDasharray="8 4"`.
- [x] Integra `useInterpolation` para posiciones a 60 fps.
- [x] Integra `RouteDrawer` con `progress = currentFrame / Math.max(1, frames.length - 1)`.
- [x] Drag nativo: `onMouseDown` en ficha → `onMouseMove` en SVG → `onMouseUp` en SVG. Calcula coordenadas en yardas con `e.clientX / svgClientWidth * 120`.
- [x] `readOnly=true` desactiva el drag (para Academia y Challenge pre-jugada).
- [x] Uso en Navbar: solo visible si ancho ≥ 768 px; en móvil el board ocupa pantalla completa.

---

## Grupo 3 — Componentes Compartidos

### T-30 `src/components/shared/EffectivenessBar.tsx`

- [x] Props: `effectiveness: Effectiveness | null`, `isLoading: boolean`.
- [x] Arco SVG circular: `r=48`, `strokeWidth=12`, `stroke-dasharray` y `stroke-dashoffset` animados en 500 ms con `--ease-apple`.
- [x] Color del arco: `>0.70` → `#10B981` | `0.40–0.70` → `#F59E0B` | `<0.40` → `#D50A0A`.
- [x] Texto central: `{Math.round(score * 100)}%` en `font-mono text-2xl font-bold`.
- [x] Subtexto: «Probabilidad de éxito» + delta vs. promedio `↑+12% vs. promedio`.
- [x] Barras de factores: lista ordenada por `weight` desc. Cada fila: label + barra + valor.
- [x] Estado `isLoading`: muestra skeleton con `animate-pulse` sobre el arco y barras.

### T-31 `src/components/shared/Copilot.tsx`

- [x] Props: `mode`, `currentView`, `onNavigate`, `onSuggestedPlayers`, `preloadMessage?: string`.
- [x] Estado: `isOpen`, `messages: Array<{role, content}>`, `input`, `isLoading`.
- [x] Botón flotante: `fixed bottom-6 right-6 z-50 w-12 h-12 bg-xo-electric rounded-pill shadow-lg press-tactile`.
- [x] Panel: `fixed right-0 top-0 h-screen w-80 bg-xo-elevated/95 backdrop-blur-sm border-l border-xo-border z-40`.
  - Apertura: clase `.animate-slide-in-right`.
  - Cierre: clase `.animate-slide-out-right` → `onAnimationEnd` → `isOpen = false`.
- [x] Historial de mensajes: scroll al fondo en cada nuevo mensaje (`useEffect` + `scrollIntoView`).
- [x] Al recibir respuesta: procesar `navigate_to` → `onNavigate`, `suggested_players` → `onSuggestedPlayers`.
- [x] Badge «Modo heurístico»: `text-xo-warning text-xs` si `ai_available === false`.
- [x] `useEffect` que observe `preloadMessage`: si cambia y es no vacío, pre-rellena `input` y abre el panel.

---

## Grupo 4 — Modo Entrenador

### T-40 `src/components/coach/CoachView.tsx`

- [x] Props: `currentView: 'board' | 'scouting'`, `onNavigate`, `suggestedPlayers`.
- [x] Layout: `<MainLayout>` con renderizado condicional por `currentView`.
- [x] Vista `board`: panel dividido 65% / 32% con gap.
- [x] Vista `scouting`: ancho completo con `ScoutingPanel`.
- [x] Estado local: `players: PlayerInput[]`, `gameContext`, `simResult: SimulateResponse | null`, `isSimulating`.
- [x] `useEffect` que observe `suggestedPlayers` del copiloto: si tiene elementos, mergea con `players` actualizando `x`, `y` y `route` de las fichas coincidentes por `player_id`.

### T-41 `src/components/coach/ControlBar.tsx`

- [x] Props: `offenseTeam`, `defenseTeam`, `down`, `yardsToGo`, `fieldZone`, `isLoading`, `onChange*`, `onSimulate`.
- [x] Dos dropdowns de equipo (32 equipos NFL hardcodeados en constante).
- [x] Dropdown de down (`1st`–`4th`).
- [x] Dropdown de yardas (`1`–`25+`).
- [x] Dropdown de zona (`Own 1`–`Own 49`, `Midfield`, `Opp 49`–`Opp 1`).
- [x] Botón «Simular ▶»: `bg-xo-electric rounded-chip press-tactile` + spinner SVG cuando `isLoading`.

### T-42 `src/components/coach/RecentPlaysTable.tsx`

- [x] Props: `plays: Array<{name, result, effectiveness, time}>`.
- [x] Tabla con columnas: Jugada, Resultado (badge Éxito/Fracaso), Efectividad (%), Tiempo, Acción (▶ reproducir).
- [x] Badge Éxito: `bg-xo-success/15 text-xo-success`. Badge Fracaso: `bg-xo-danger/15 text-xo-danger`.
- [x] Fila del hover: `bg-xo-elevated/50 press-tactile` sin animar layout.

### T-43 `src/components/coach/ScoutingPanel.tsx`

- [x] Props: `team: string`, `opponent: string | null`.
- [x] Selector de equipo rival en la parte superior.
- [x] `useEffect` que llame `api.scouting({ team, opponent })` al cambiar equipo.
- [x] Sección de perfil de equipo: stats clave en 3 cards + `RadarChart` de Recharts con distribución de coberturas.
- [x] Lista de alertas críticas: cards con `animate-panel-enter` y stagger 35 ms.
  - Cada alerta: `IconAlert` + badge de severidad + mensaje + barra de percentil animada.
- [x] Estado vacío: texto «Selecciona un rival para ver su scouting» centrado.

---

## Grupo 5 — Modo Aficionado

### T-50 `src/components/fan/FanView.tsx`

- [x] Props: `currentView`, `onNavigate`, `suggestedPlayers`.
- [x] Layout: `<MainLayout>` con renderizado condicional por `currentView`.
- [x] Vista `stats` renderiza `StatsExplorer`.
- [x] Vista `challenge` renderiza `Challenge`.
- [x] Vista `rankings` renderiza `Rankings`.
- [x] Vista `academy` renderiza `NflAcademy`.
- [x] Vista `team` renderiza `MyTeam`.

### T-51 `src/components/fan/StatsExplorer.tsx`

- [x] `useEffect` inicial: `api.stats()` → poblado de estado.
- [x] Selector de equipo: dropdown 32 equipos → `api.stats({ team })`.
- [x] Tres cards superiores (grid 3 col): velocidad promedio, separación promedio, efectividad 3&7+. Cada card: valor en `font-mono text-3xl` + label + delta.
- [x] Sección «Top Velocistas»: `BarChart` Recharts con `max_speed` de `top_players`.
- [x] Sección «¿Sabías qué?»: grid de cards de `fun_facts`. Cada card `.animate-panel-enter` con clases `.stagger-1` a `.stagger-4`.
- [x] Búsqueda de jugador: `<input>` con filtrado sobre `top_players` por nombre.

### T-52 `src/components/fan/MyTeam.tsx`

- [x] `useState` para `selectedTeam` inicializado desde `localStorage('xo_fan_team')`.
- [x] Selector de franquicia (dropdown 32 equipos). Al cambiar: persiste en `localStorage` y llama `api.team(abbr)`.
- [x] Panel principal: logo placeholder (SVG con colores del equipo), nombre, record, índice de forma.
- [x] Tabla de próximos partidos: semana, rival, local/visitante.
- [x] Lista de jugadores clave: nombre, posición, `form_index` como arco SVG circular animado.
- [x] Card de próximo rival con tendencias como badges (`blitz_heavy` → rojo, `cover_2` → azul, etc.).

### T-53 `src/components/fan/Challenge.tsx`

- [x] Estado: `step` (0–4), `scores: number[]`, `selectedOption: string | null`, `freeText`, `simResult: ChallengeResponse | null`, `phase: 'select' | 'animating' | 'verdict' | 'summary'`.
- [x] Indicador de progreso: 5 círculos. Activo: `bg-xo-fan-accent`. Completado: `bg-xo-success`. Pendiente: `bg-xo-border`.
- [x] Pizarra: `TacticalBoard` en `readOnly=true` con la situación del escenario.
- [x] Tres cards de opción: borde `border-xo-border`, al seleccionar `border-xo-fan-accent bg-xo-fan-accent/10 press-tactile`.
- [x] Textarea: `<textarea rows={3}>` con placeholder «Describe tu jugada en texto libre…». Mínimo 10 caracteres para activar «Confirmar».
- [x] Al confirmar: `api.challenge()` → `phase = 'animating'` → reproduce animación → `phase = 'verdict'`.
- [x] Veredicto: `.animate-panel-enter` con `EffectivenessBar` + texto de `verdict`.
- [x] Paso 5 completo: `phase = 'summary'` con resumen total y botón «Enviar al ranking».
- [x] Modal de nombre de usuario si `localStorage('xo_username')` está vacío.
- [x] `api.submitRanking()` → muestra nuevo ranking del usuario.

### T-54 `src/components/fan/Rankings.tsx`

- [x] `useEffect` inicial: `api.rankings({ limit: 20 })`.
- [x] Tabs «Liga de Aficiones» / «Top Jugadores» con estilo chip (mismo componente reutilizable de Navbar interno).
- [x] Tab «Liga de Aficiones»: `BarChart` horizontal + tabla con columnas definidas en RF-04.4.3.
- [x] Tab «Top Jugadores»: tabla con columnas definidas en RF-04.4.4.
- [x] Fila del usuario actual resaltada con `border border-xo-electric`.
- [x] Botón «Ver más» que incrementa `limit` y vuelve a llamar la API.

### T-55 `src/components/fan/NflAcademy.tsx`

- [x] Tabs internos: «Anatomía del Juego», «Jugadas Básicas», «Diccionario».
- [x] **Anatomía del Juego:**
  - 4 cards en grid 2×2 con icono SVG inline, título y descripción:
    1. Los Cuartos — 4 períodos de 15 min.
    2. El Reloj — se detiene en incompletos y fuera de banda.
    3. Las 4 Oportunidades — debes avanzar 10 yardas o ceder el balón.
    4. Las Zonas del Campo — cancha, zona roja, end zone.
  - Sin llamada a API.
- [x] **Jugadas Básicas:**
  - Selector de jugada (3 opciones: «Slant Route», «Run Up the Middle», «Screen Pass»).
  - `TacticalBoard` en `readOnly=true` con frames hardcodeados del `BASIC_PLAYS` dict.
  - Al hacer hover o clic en la card de selección, la animación arranca automáticamente (`play()` del `useAnimation`).
  - `EffectivenessBar` en modo lectura con `effectiveness` del mock.
- [x] **Diccionario:**
  - Lista de al menos 10 términos. Cada ítem: nombre en `font-semibold` + definición en `text-xo-text-secondary`.
  - Al hacer clic en un término: llama `onDictionaryClick(term)` → prop que sube hasta `App.tsx` → se pasa como `preloadMessage` al `Copilot`.

---

## Grupo 6 — Integración y Pulido

### T-60 Conectar `suggestedPlayers` del Copilot con `TacticalBoard`

- [x] En `App.tsx`: estado `suggestedPlayers: PlayerInput[]` inicializado como `[]`.
- [x] `Copilot.onSuggestedPlayers` actualiza ese estado.
- [x] `CoachView` recibe `suggestedPlayers` y lo aplica en su `useEffect` de merge.
- [x] Solo aplica si `currentView === 'board'`; en otras vistas lo ignora silenciosamente.

### T-61 Conectar `preloadMessage` del Diccionario con el Copilot

- [x] En `App.tsx`: estado `copilotPreload: string` inicializado como `''`.
- [x] `NflAcademy.onDictionaryClick(term)` → prop `onDictionaryTerm` → `App.tsx` actualiza `copilotPreload`.
- [x] `Copilot` recibe `preloadMessage={copilotPreload}`. Su `useEffect` lo consume y lo resetea a `''` tras abrirse.

### T-62 Manejo de errores y estados de carga

- [x] Componente `LoadingSkeleton.tsx`: placeholder de card con `animate-pulse bg-xo-elevated rounded-card`.
- [x] Componente `ErrorBanner.tsx`: banner `bg-xo-danger/15 border border-xo-danger/40 text-xo-danger` con mensaje y botón «Reintentar».
- [x] Todos los `useEffect` de llamadas API tienen `try/catch` que muestran `ErrorBanner` con el `detail` del error.
- [x] Los estados de carga muestran `LoadingSkeleton` en lugar de contenido vacío.

### T-63 Verificar rutas relativas

- [x] Buscar en todo `dashboard/src/` el patrón `fetch('/'` o `fetch("/"` o `localhost` o `127.0.0.1`.
- [x] Buscar en JSX el patrón `src="/"` o `href="/"` para assets.
- [x] Corregir cualquier instancia encontrada antes del commit.

### T-64 Responsividad mínima

- [x] Navbar: en `sm` (< 768 px) oculta el sidebar y muestra botón de menú hamburguesa SVG inline.
- [x] `TacticalBoard`: en `sm` ocupa 100% del ancho con aspect-ratio preservado (`aspect-[120/53.3]`).
- [x] Panel de efectividad: en `sm` se apila debajo de la pizarra (flex-col).
- [x] Tablas de rankings: en `sm` se convierten en lista de cards.

### T-65 Build final y verificación TypeScript

- [x] `npm run build` dentro de `dashboard/` sin errores TypeScript (`strict: true` en `tsconfig.json`).
- [x] `tsconfig.json` tiene `"strict": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`.
- [x] El directorio `dashboard/dist/` generado contiene `index.html` y assets con rutas relativas.
- [x] Verificar que `dashboard/dist/index.html` carga los scripts con `src="assets/..."` (sin `/`).

---

## Dependencias entre grupos

```
Grupo 0 (T-00 a T-08)
  └─► Grupo 1 (T-10 a T-13)  — necesita tipos y servicios
        └─► Grupo 2 (T-20 a T-25)  — necesita layout y hooks
        └─► Grupo 3 (T-30 a T-31)  — necesita layout y tipos
              └─► Grupo 4 (T-40 a T-43)  — necesita board y shared
              └─► Grupo 5 (T-50 a T-55)  — necesita board y shared
                    └─► Grupo 6 (T-60 a T-65)  — integración final
```

Dentro de cada grupo, las tareas son independientes entre sí y pueden trabajarse en paralelo.

---

## Checklist de Cierre

Antes de hacer merge a `main`, verificar:

- [ ] `vite build` sin errores en modo `--mode production`.
- [ ] `VITE_USE_MOCK=true vite build` también compila sin errores (modo mock).
- [ ] No existe ningún `console.log` ni `console.error` sin condición en el código de producción.
- [ ] Ningún componente llama `fetch` directamente; todo pasa por `services/api.ts`.
- [ ] Ninguna ruta en `fetch` empieza con `/` o contiene `localhost`.
- [ ] `tailwind.config.js` tiene `content` cubriendo todos los archivos `.ts` y `.tsx`.
- [ ] `src/index.css` empieza con `@tailwind base; @tailwind components; @tailwind utilities;`.
- [ ] Todas las animaciones respetan `prefers-reduced-motion`.
- [ ] Todos los botones tienen `aria-label` o texto visible.
- [ ] El interruptor de modo tiene `role="tablist"` y `role="tab"`.
- [ ] `NflAcademy.tsx` está en `components/fan/NflAcademy.tsx`.
- [ ] Los mocks cubren los 5 endpoints con datos realistas.
- [ ] `dashboard/dist/` está en `.gitignore`.
