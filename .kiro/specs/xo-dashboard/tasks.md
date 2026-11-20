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

- [ ] Reemplazar el contenido con la extensión de colores `xo.*` definida en `design.md` §1.
- [ ] Añadir `fontFamily.sans: ['Inter', ...]` y `fontFamily.mono: ['JetBrains Mono', ...]`.
- [ ] Añadir `borderRadius.card`, `borderRadius.chip`, `borderRadius.pill`.
- [ ] `content` cubre `./index.html` y `./src/**/*.{ts,tsx}`.

### T-03 Configurar `vite.config.ts`

- [ ] `base: './'` — obligatorio para AWS.
- [ ] Proxy `'/api': 'http://localhost:8000'`.
- [ ] Plugin `@vitejs/plugin-react`.

### T-04 Configurar `src/index.css`

- [ ] Primeras tres líneas: `@tailwind base; @tailwind components; @tailwind utilities;`.
- [ ] Variables CSS: `--ease-apple` y `--ease-snappy` en `:root`.
- [ ] Clases base: `.ease-apple`, `.press-tactile` con `:active`.
- [ ] Keyframes y clases: `@keyframes panelEnter` → `.animate-panel-enter`.
- [ ] `@keyframes slideInRight` → `.animate-slide-in-right`.
- [ ] `@keyframes slideOutRight` → `.animate-slide-out-right`.
- [ ] Clases `.stagger-1` a `.stagger-4` con `animation-delay`.
- [ ] Bloque `@media (prefers-reduced-motion: reduce)`.
- [ ] Focus visible global en capa `@layer base`.

### T-05 Cargar fuentes en `index.html`

- [ ] `<link rel="preconnect" href="https://fonts.googleapis.com">`.
- [ ] `<link>` de Google Fonts: `Inter` pesos 400, 500, 600, 700 + `JetBrains+Mono` peso 700, con `display=swap`.
- [ ] `<title>X&O Engine</title>`.
- [ ] `<meta name="description" content="Plataforma de analítica táctica NFL">`.

### T-06 Crear tipos TypeScript en `src/types/api.ts`

- [ ] Copiar y completar exactamente los tipos definidos en `02-api-contract.md`:
  - `Mode`, `CurrentView` (incluyendo `'team'`: `'board' | 'scouting' | 'stats' | 'team' | 'challenge' | 'rankings' | 'academy'`), `DecisionType`, `ImpactType`
  - `PlayerInput`, `PlayerFrame`, `SimFrame`
  - `EffectivenessFactor`, `Effectiveness`
  - `SimulateRequest`, `SimulateResponse`
  - `ChatContext`, `ChatRequest`, `ChatResponse`
  - `ChallengeScenario`, `ChallengeScenariosResponse` (para `GET /api/challenge`), `ChallengeRequest`, `ChallengeResponse` (para `POST /api/challenge`)
  - `StatsResponse`, `TeamResponse`, `ScoutingResponse`, `RankingsResponse` (para los endpoints `GET` y `mocks/`)
  - `RankingsSubmitRequest`, `RankingsSubmitResponse`
- [ ] Mantener en este archivo únicamente los tipos del contrato de API; los tipos internos de UI van en sus propios componentes.

### T-07 Crear capa de servicios `src/services/api.ts`

- [ ] Flag `const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'`.
- [ ] Implementar todas las funciones de `api.*` del contrato (`health`, `stats`, `team`, `scouting`, `simulate`, `getChallenge`, `challenge`, `rankings`, `submitRanking`, `chat`).
- [ ] Todas las rutas `fetch` sin diagonal inicial: `'api/...'`.
- [ ] Cuando `USE_MOCK=true`, importar y retornar los mocks correspondientes.
- [ ] Ninguna función retorna datos directamente hardcodeados; los mocks son importaciones tipadas.

### T-08 Crear mocks tipados en `src/mocks/`

- [ ] `simulateMock.ts` — `SimulateResponse` con 3 jugadores en `frames[0].players` y al menos 20 frames.
- [ ] `statsMock.ts` — `StatsResponse` con 5 `top_players`, 4 `fun_facts`.
- [ ] `scoutingMock.ts` — `ScoutingResponse` con `player_profile`, `team_profile` y 3 `critical_alerts` (1 high, 1 medium, 1 low).
- [ ] `challengeMock.ts` — `ChallengeScenariosResponse` (5 escenarios iniciales) + `ChallengeResponse` con 3 `options_reference` y veredicto completo.
- [ ] `rankingsMock.ts` — `RankingsResponse` con 5 entradas en `individual` y 5 en `fan_leagues`.
- [ ] `teamMock.ts` — `TeamResponse` con calendario, jugadores clave y próximo rival.

---

## Grupo 1 — Estructura Principal y Navegación

### T-10 `src/App.tsx`

- [ ] Estado: `mode: Mode` (default `'fan'`), `view: CurrentView` (default `'stats'`).
- [ ] Handler `handleNavigate(v: CurrentView)` que actualiza `view`.
- [ ] Handler `handleModeChange(m: Mode)` que actualiza `mode` y resetea `view` al default del modo (`'board'` para coach, `'stats'` para fan).
- [ ] Estado `suggestedPlayers: PlayerInput[]` que se pasa hacia abajo; actualizable desde `Copilot`.
- [ ] Renderiza: `<Navbar>`, condicional `<CoachView>` o `<FanView>`, `<Copilot>`.
- [ ] `className` del div raíz: `min-h-screen bg-xo-deep-bg text-xo-text-primary font-sans`.

### T-11 `src/components/shared/Navbar.tsx`

- [ ] Props: `mode`, `onModeChange`, `currentView`, `onNavigate`.
- [ ] Logotipo izquierdo: texto «X&O Engine» con «X&O» en `text-xo-electric` y «Engine» en `text-xo-text-primary`, `text-lg font-bold`.
- [ ] Interruptor central: contenedor `bg-xo-surface rounded-pill p-1 flex relative`.
  - Píldora deslizante absoluta: `bg-xo-electric` (coach) / `bg-xo-fan-accent` (fan), transición `transform 240ms ease-apple`.
  - Dos botones `role="tab"` con `aria-selected`.
  - Icono SVG `IconBriefcase` (coach) e `IconTrophy` (fan) con texto.
- [ ] Zona derecha: `IconBell` + avatar círculo 32 px con iniciales «JR».
- [ ] `role="tablist"` en el contenedor del interruptor.
- [ ] Clases: `h-14 bg-xo-surface border-b border-xo-border flex items-center justify-between px-6`.

### T-12 Sidebar compartido (`src/components/shared/Sidebar.tsx`)

- [ ] Props: `mode`, `currentView`, `onNavigate`.
- [ ] Modo Coach: ítems Sala Táctica (→`board`), Scouting (→`scouting`).
- [ ] Modo Fan: ítems Estadísticas (→`stats`), Mi Equipo, Juega a ser el Entrenador (→`challenge`), Rankings (→`rankings`), Academia NFL (→`academy`).
- [ ] Ítem activo: `bg-xo-electric/15 border-l-2 border-xo-electric text-xo-text-primary` (coach) / misma lógica con `fan-accent` (fan).
- [ ] Ítem inactivo: `text-xo-text-secondary hover:text-xo-text-primary hover:bg-xo-elevated/50 press-tactile`.
- [ ] Logo NFL en la parte inferior: círculo 48 px con texto «NFL» en gris.
- [ ] Clases del contenedor: `w-56 bg-xo-surface border-r border-xo-border flex flex-col py-4`.

### T-13 Layout principal (`src/components/shared/MainLayout.tsx`)

- [ ] Envuelve `Sidebar` + slot de contenido (`children`).
- [ ] `flex h-[calc(100vh-56px)]` (altura total menos navbar).
- [ ] Área de contenido: `flex-1 overflow-y-auto bg-xo-deep-bg p-6`.

---

## Grupo 2 — Componentes de la Pizarra

### T-20 `src/hooks/useAnimation.ts`

- [ ] Implementar exactamente como define `04-dashboard-guidelines.md`.
- [ ] Funciones exportadas: `play`, `pause`, `reset`, `goToFrame(n)`.
- [ ] Limpiar `setInterval` en cleanup del `useEffect`.
- [ ] Exportar también `totalFrames` para el scrubber.

### T-21 `src/hooks/useInterpolation.ts`

- [ ] Hook que recibe `frames: SimFrame[]`, `currentFrame: number`, `fps: number`.
- [ ] Calcula la posición interpolada de cada jugador entre `frames[currentFrame]` y `frames[currentFrame+1]` usando `requestAnimationFrame`.
- [ ] Retorna `interpolatedPlayers: PlayerFrame[]` actualizados a 60 fps.
- [ ] Se desactiva (devuelve players del frame exacto) si `frames.length <= 1`.

### T-22 `src/components/board/PlayerToken.tsx`

- [ ] Props: `player: PlayerFrame & { role: string; team: 'offense' | 'defense' }`, `isDragging: boolean`, `isSelected: boolean`, `svgScale: number`.
- [ ] `<circle>` con `fill` según equipo: `#6038F5` (offense) / `#D50A0A` (defense).
- [ ] Stroke de selección: `<circle r="20">` exterior con `stroke="#8B6CFF"` y opacity animada.
- [ ] `transform="scale(1.14)"` cuando `isDragging`, con transición `140ms ease-apple`.
- [ ] Texto del rol: `<text>` centrado, `fontSize="8"`, `fontWeight="700"`, `fill="white"`.
- [ ] `aria-label={player.role}`.

### T-23 `src/components/board/RouteDrawer.tsx`

- [ ] Props: `trajectories: Array<{ playerId: number; points: [number, number][] }>`, `progress: number` (0–1).
- [ ] Por cada trayectoria, calcula `totalLength` y `drawnLength = totalLength * progress`.
- [ ] `<path stroke="#8B6CFF" strokeWidth="1.5" fill="none" opacity="0.5" strokeDasharray={totalLength} strokeDashoffset={totalLength - drawnLength}/>`.
- [ ] Color de ruta defensiva: `stroke="#FF6B6B"`.

### T-24 `src/components/board/AnimationPlayer.tsx`

- [ ] Props: `currentFrame`, `totalFrames`, `isPlaying`, `fps`, `onPlay`, `onPause`, `onReset`, `onSeek(frame)`.
- [ ] Scrubber: `<input type="range">` estilizado con Tailwind, `accent-color: #6038F5`.
- [ ] Tiempo formateado: `${(currentFrame / fps).toFixed(1)}s / ${(totalFrames / fps).toFixed(1)}s`.
- [ ] Botones play/pause/reset con SVG inline y clase `press-tactile`.
- [ ] Botón de pantalla completa con `IconExpand`.

### T-25 `src/components/board/TacticalBoard.tsx`

- [ ] Props: `players: PlayerInput[]`, `frames: SimFrame[]`, `currentFrame: number`, `isPlaying: boolean`, `readOnly?: boolean`, `onPlayerMove?: (id, x, y) => void`.
- [ ] `<svg viewBox="0 0 1200 533" className="w-full h-full select-none">`.
- [ ] Cancha: `<rect>` verde `#2D5A27`, end zones `#1E3D1A`, líneas de yarda cada 100 px (`10px/yd * 10yd`).
- [ ] Números de yarda: `<text>` SVG a `y=20` y `y=513`, `fill="rgba(255,255,255,0.4)"`, `fontSize="14"`.
- [ ] Línea de scrimmage: `stroke="#FFD700" strokeWidth="2" strokeDasharray="8 4"`.
- [ ] Línea de primer down: `stroke="#00BFFF" strokeWidth="2" strokeDasharray="8 4"`.
- [ ] Integra `useInterpolation` para posiciones a 60 fps.
- [ ] Integra `RouteDrawer` con `progress = currentFrame / Math.max(1, frames.length - 1)`.
- [ ] Drag nativo: `onMouseDown` en ficha → `onMouseMove` en SVG → `onMouseUp` en SVG. Calcula coordenadas en yardas con `e.clientX / svgClientWidth * 120`.
- [ ] `readOnly=true` desactiva el drag (para Academia y Challenge pre-jugada).
- [ ] Uso en Navbar: solo visible si ancho ≥ 768 px; en móvil el board ocupa pantalla completa.

---

## Grupo 3 — Componentes Compartidos

### T-30 `src/components/shared/EffectivenessBar.tsx`

- [ ] Props: `effectiveness: Effectiveness | null`, `isLoading: boolean`.
- [ ] Arco SVG circular: `r=48`, `strokeWidth=12`, `stroke-dasharray` y `stroke-dashoffset` animados en 500 ms con `--ease-apple`.
- [ ] Color del arco: `>0.70` → `#10B981` | `0.40–0.70` → `#F59E0B` | `<0.40` → `#D50A0A`.
- [ ] Texto central: `{Math.round(score * 100)}%` en `font-mono text-2xl font-bold`.
- [ ] Subtexto: «Probabilidad de éxito» + delta vs. promedio `↑+12% vs. promedio`.
- [ ] Barras de factores: lista ordenada por `weight` desc. Cada fila: label + barra + valor.
- [ ] Estado `isLoading`: muestra skeleton con `animate-pulse` sobre el arco y barras.

### T-31 `src/components/shared/Copilot.tsx`

- [ ] Props: `mode`, `currentView`, `onNavigate`, `onSuggestedPlayers`, `preloadMessage?: string`.
- [ ] Estado: `isOpen`, `messages: Array<{role, content}>`, `input`, `isLoading`.
- [ ] Botón flotante: `fixed bottom-6 right-6 z-50 w-12 h-12 bg-xo-electric rounded-pill shadow-lg press-tactile`.
- [ ] Panel: `fixed right-0 top-0 h-screen w-80 bg-xo-elevated/95 backdrop-blur-sm border-l border-xo-border z-40`.
  - Apertura: clase `.animate-slide-in-right`.
  - Cierre: clase `.animate-slide-out-right` → `onAnimationEnd` → `isOpen = false`.
- [ ] Historial de mensajes: scroll al fondo en cada nuevo mensaje (`useEffect` + `scrollIntoView`).
- [ ] Al recibir respuesta: procesar `navigate_to` → `onNavigate`, `suggested_players` → `onSuggestedPlayers`.
- [ ] Badge «Modo heurístico»: `text-xo-warning text-xs` si `ai_available === false`.
- [ ] `useEffect` que observe `preloadMessage`: si cambia y es no vacío, pre-rellena `input` y abre el panel.

---

## Grupo 4 — Modo Entrenador

### T-40 `src/components/coach/CoachView.tsx`

- [ ] Props: `currentView: 'board' | 'scouting'`, `onNavigate`, `suggestedPlayers`.
- [ ] Layout: `<MainLayout>` con renderizado condicional por `currentView`.
- [ ] Vista `board`: panel dividido 65% / 32% con gap.
- [ ] Vista `scouting`: ancho completo con `ScoutingPanel`.
- [ ] Estado local: `players: PlayerInput[]`, `gameContext`, `simResult: SimulateResponse | null`, `isSimulating`.
- [ ] `useEffect` que observe `suggestedPlayers` del copiloto: si tiene elementos, mergea con `players` actualizando `x`, `y` y `route` de las fichas coincidentes por `player_id`.

### T-41 `src/components/coach/ControlBar.tsx`

- [ ] Props: `offenseTeam`, `defenseTeam`, `down`, `yardsToGo`, `fieldZone`, `isLoading`, `onChange*`, `onSimulate`.
- [ ] Dos dropdowns de equipo (32 equipos NFL hardcodeados en constante).
- [ ] Dropdown de down (`1st`–`4th`).
- [ ] Dropdown de yardas (`1`–`25+`).
- [ ] Dropdown de zona (`Own 1`–`Own 49`, `Midfield`, `Opp 49`–`Opp 1`).
- [ ] Botón «Simular ▶»: `bg-xo-electric rounded-chip press-tactile` + spinner SVG cuando `isLoading`.

### T-42 `src/components/coach/RecentPlaysTable.tsx`

- [ ] Props: `plays: Array<{name, result, effectiveness, time}>`.
- [ ] Tabla con columnas: Jugada, Resultado (badge Éxito/Fracaso), Efectividad (%), Tiempo, Acción (▶ reproducir).
- [ ] Badge Éxito: `bg-xo-success/15 text-xo-success`. Badge Fracaso: `bg-xo-danger/15 text-xo-danger`.
- [ ] Fila del hover: `bg-xo-elevated/50 press-tactile` sin animar layout.

### T-43 `src/components/coach/ScoutingPanel.tsx`

- [ ] Props: `team: string`, `opponent: string | null`.
- [ ] Selector de equipo rival en la parte superior.
- [ ] `useEffect` que llame `api.scouting({ team, opponent })` al cambiar equipo.
- [ ] Sección de perfil de equipo: stats clave en 3 cards + `RadarChart` de Recharts con distribución de coberturas.
- [ ] Lista de alertas críticas: cards con `animate-panel-enter` y stagger 35 ms.
  - Cada alerta: `IconAlert` + badge de severidad + mensaje + barra de percentil animada.
- [ ] Estado vacío: texto «Selecciona un rival para ver su scouting» centrado.

---

## Grupo 5 — Modo Aficionado

### T-50 `src/components/fan/FanView.tsx`

- [ ] Props: `currentView`, `onNavigate`, `suggestedPlayers`.
- [ ] Layout: `<MainLayout>` con renderizado condicional por `currentView`.
- [ ] Vista `stats` renderiza `StatsExplorer`.
- [ ] Vista `challenge` renderiza `Challenge`.
- [ ] Vista `rankings` renderiza `Rankings`.
- [ ] Vista `academy` renderiza `NflAcademy`.
- [ ] Vista `team` renderiza `MyTeam`.

### T-51 `src/components/fan/StatsExplorer.tsx`

- [ ] `useEffect` inicial: `api.stats()` → poblado de estado.
- [ ] Selector de equipo: dropdown 32 equipos → `api.stats({ team })`.
- [ ] Tres cards superiores (grid 3 col): velocidad promedio, separación promedio, efectividad 3&7+. Cada card: valor en `font-mono text-3xl` + label + delta.
- [ ] Sección «Top Velocistas»: `BarChart` Recharts con `max_speed` de `top_players`.
- [ ] Sección «¿Sabías qué?»: grid de cards de `fun_facts`. Cada card `.animate-panel-enter` con clases `.stagger-1` a `.stagger-4`.
- [ ] Búsqueda de jugador: `<input>` con filtrado sobre `top_players` por nombre.

### T-52 `src/components/fan/MyTeam.tsx`

- [ ] `useState` para `selectedTeam` inicializado desde `localStorage('xo_fan_team')`.
- [ ] Selector de franquicia (dropdown 32 equipos). Al cambiar: persiste en `localStorage` y llama `api.team(abbr)`.
- [ ] Panel principal: logo placeholder (SVG con colores del equipo), nombre, record, índice de forma.
- [ ] Tabla de próximos partidos: semana, rival, local/visitante.
- [ ] Lista de jugadores clave: nombre, posición, `form_index` como arco SVG circular animado.
- [ ] Card de próximo rival con tendencias como badges (`blitz_heavy` → rojo, `cover_2` → azul, etc.).

### T-53 `src/components/fan/Challenge.tsx`

- [ ] Estado: `step` (0–4), `scores: number[]`, `selectedOption: string | null`, `freeText`, `simResult: ChallengeResponse | null`, `phase: 'select' | 'animating' | 'verdict' | 'summary'`.
- [ ] Indicador de progreso: 5 círculos. Activo: `bg-xo-fan-accent`. Completado: `bg-xo-success`. Pendiente: `bg-xo-border`.
- [ ] Pizarra: `TacticalBoard` en `readOnly=true` con la situación del escenario.
- [ ] Tres cards de opción: borde `border-xo-border`, al seleccionar `border-xo-fan-accent bg-xo-fan-accent/10 press-tactile`.
- [ ] Textarea: `<textarea rows={3}>` con placeholder «Describe tu jugada en texto libre…». Mínimo 10 caracteres para activar «Confirmar».
- [ ] Al confirmar: `api.challenge()` → `phase = 'animating'` → reproduce animación → `phase = 'verdict'`.
- [ ] Veredicto: `.animate-panel-enter` con `EffectivenessBar` + texto de `verdict`.
- [ ] Paso 5 completo: `phase = 'summary'` con resumen total y botón «Enviar al ranking».
- [ ] Modal de nombre de usuario si `localStorage('xo_username')` está vacío.
- [ ] `api.submitRanking()` → muestra nuevo ranking del usuario.

### T-54 `src/components/fan/Rankings.tsx`

- [ ] `useEffect` inicial: `api.rankings({ limit: 20 })`.
- [ ] Tabs «Liga de Aficiones» / «Top Jugadores» con estilo chip (mismo componente reutilizable de Navbar interno).
- [ ] Tab «Liga de Aficiones»: `BarChart` horizontal + tabla con columnas definidas en RF-04.4.3.
- [ ] Tab «Top Jugadores»: tabla con columnas definidas en RF-04.4.4.
- [ ] Fila del usuario actual resaltada con `border border-xo-electric`.
- [ ] Botón «Ver más» que incrementa `limit` y vuelve a llamar la API.

### T-55 `src/components/fan/NflAcademy.tsx`

- [ ] Tabs internos: «Anatomía del Juego», «Jugadas Básicas», «Diccionario».
- [ ] **Anatomía del Juego:**
  - 4 cards en grid 2×2 con icono SVG inline, título y descripción:
    1. Los Cuartos — 4 períodos de 15 min.
    2. El Reloj — se detiene en incompletos y fuera de banda.
    3. Las 4 Oportunidades — debes avanzar 10 yardas o ceder el balón.
    4. Las Zonas del Campo — cancha, zona roja, end zone.
  - Sin llamada a API.
- [ ] **Jugadas Básicas:**
  - Selector de jugada (3 opciones: «Slant Route», «Run Up the Middle», «Screen Pass»).
  - `TacticalBoard` en `readOnly=true` con frames hardcodeados del `BASIC_PLAYS` dict.
  - Al hacer hover o clic en la card de selección, la animación arranca automáticamente (`play()` del `useAnimation`).
  - `EffectivenessBar` en modo lectura con `effectiveness` del mock.
- [ ] **Diccionario:**
  - Lista de al menos 10 términos. Cada ítem: nombre en `font-semibold` + definición en `text-xo-text-secondary`.
  - Al hacer clic en un término: llama `onDictionaryClick(term)` → prop que sube hasta `App.tsx` → se pasa como `preloadMessage` al `Copilot`.

---

## Grupo 6 — Integración y Pulido

### T-60 Conectar `suggestedPlayers` del Copilot con `TacticalBoard`

- [ ] En `App.tsx`: estado `suggestedPlayers: PlayerInput[]` inicializado como `[]`.
- [ ] `Copilot.onSuggestedPlayers` actualiza ese estado.
- [ ] `CoachView` recibe `suggestedPlayers` y lo aplica en su `useEffect` de merge.
- [ ] Solo aplica si `currentView === 'board'`; en otras vistas lo ignora silenciosamente.

### T-61 Conectar `preloadMessage` del Diccionario con el Copilot

- [ ] En `App.tsx`: estado `copilotPreload: string` inicializado como `''`.
- [ ] `NflAcademy.onDictionaryClick(term)` → prop `onDictionaryTerm` → `App.tsx` actualiza `copilotPreload`.
- [ ] `Copilot` recibe `preloadMessage={copilotPreload}`. Su `useEffect` lo consume y lo resetea a `''` tras abrirse.

### T-62 Manejo de errores y estados de carga

- [ ] Componente `LoadingSkeleton.tsx`: placeholder de card con `animate-pulse bg-xo-elevated rounded-card`.
- [ ] Componente `ErrorBanner.tsx`: banner `bg-xo-danger/15 border border-xo-danger/40 text-xo-danger` con mensaje y botón «Reintentar».
- [ ] Todos los `useEffect` de llamadas API tienen `try/catch` que muestran `ErrorBanner` con el `detail` del error.
- [ ] Los estados de carga muestran `LoadingSkeleton` en lugar de contenido vacío.

### T-63 Verificar rutas relativas

- [ ] Buscar en todo `dashboard/src/` el patrón `fetch('/'` o `fetch("/"` o `localhost` o `127.0.0.1`.
- [ ] Buscar en JSX el patrón `src="/"` o `href="/"` para assets.
- [ ] Corregir cualquier instancia encontrada antes del commit.

### T-64 Responsividad mínima

- [ ] Navbar: en `sm` (< 768 px) oculta el sidebar y muestra botón de menú hamburguesa SVG inline.
- [ ] `TacticalBoard`: en `sm` ocupa 100% del ancho con aspect-ratio preservado (`aspect-[120/53.3]`).
- [ ] Panel de efectividad: en `sm` se apila debajo de la pizarra (flex-col).
- [ ] Tablas de rankings: en `sm` se convierten en lista de cards.

### T-65 Build final y verificación TypeScript

- [ ] `npm run build` dentro de `dashboard/` sin errores TypeScript (`strict: true` en `tsconfig.json`).
- [ ] `tsconfig.json` tiene `"strict": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`.
- [ ] El directorio `dashboard/dist/` generado contiene `index.html` y assets con rutas relativas.
- [ ] Verificar que `dashboard/dist/index.html` carga los scripts con `src="assets/..."` (sin `/`).

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
