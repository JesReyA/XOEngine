# Análisis de datos (carpeta `data/`)

Perfilado hecho con pandas sobre los CSV reales. Temporada 2021, semanas 1-8, 122 juegos. Solo jugadas de pase (dropbacks).
Úsalo como referencia al escribir código de carga, joins, features o endpoints.

## Archivos y llaves
| Archivo | Filas | Llave | Tamaño |
|---|---|---|---|
| games.csv | 122 | gameId | 7 KB |
| players.csv | 1,679 | nflId | 100 KB |
| plays.csv | 8,557 | (gameId, playId) | 2.3 MB |
| pffScoutingData.csv | 188,254 | (gameId, playId, nflId) | 13 MB |
| tracking/tracking_{gameId}.csv (122 archivos) | ~8.3 M en total | (gameId, playId, nflId, frameId) | ~800 MB |

- `playId` no es único entre juegos. Siempre une con `gameId` + `playId`.
- plays.csv no tiene duplicados por (gameId, playId). Hay 3,762 playId distintos.
- pffScoutingData tiene 22 filas por jugada en promedio, una por jugador (coincide con plays 8,557 × ~22).
- Los gameId de games.csv coinciden con los nombres de los archivos de tracking. Los gameId de plays/pff coinciden con games (122).
- Compatible con nflverse: gameId = `old_game_id`, playId = `play_id`.

## games.csv
- `gameId`: id del juego (2021090900 = AAAAMMDDNN).
- `season`: siempre 2021.
- `week`: 1 a 8 (16 juegos en las semanas 1-5, y 14, 13 y 15 en las semanas 6, 7 y 8).
- `gameDate`: texto `mm/dd/yyyy`. Convertir a fecha.
- `gameTimeEastern`: hora de inicio `HH:MM:SS` hora del Este (13:00 domina, 09:30 son los juegos de Londres).
- `homeTeamAbbr`, `visitorTeamAbbr`: abreviatura de 32 equipos. Sin nulos.

## players.csv
- `nflId`: id único de jugador.
- `height`: texto `pies-pulgadas` (ej. `6-4`), de `5-6` a `6-9`. Convertir a pulgadas.
- `weight`: libras, 158 a 380, media 246.
- `birthDate`: `YYYY-MM-DD`. 232 nulos.
- `collegeName`: universidad, 236 valores distintos. 224 nulos.
- `officialPosition`: 19 posiciones (WR, CB, DE, OLB, RB, T, TE, DT, G, ILB, FS, SS, QB, C, NT, MLB, FB, LB, DB). Es la posición oficial, no la alineada en la jugada.
- `displayName`: nombre. 1,671 únicos para 1,679 ids, hay nombres repetidos. No uses el nombre como llave.

## plays.csv
Contexto de la jugada:
- `playDescription`: texto libre de la jugada (nflverse).
- `quarter`: 1-4, y 5 (tiempo extra, 98 jugadas).
- `down`: 1-4. Hay 35 jugadas con `down = 0` (probablemente conversiones o casos especiales). Tratar como dato dudoso.
- `yardsToGo`: 0 a 39, media 8.7.
- `possessionTeam`, `defensiveTeam`: equipos ofensivo y defensivo.
- `yardlineSide`: equipo cuyo lado de campo contiene la línea de golpeo. 125 nulos (jugadas en la yarda 50).
- `yardlineNumber`: 1 a 50, yarda desde la propia meta del lado indicado.
- `absoluteYardlineNumber`: distancia a la zona de anotación, 11 a 109. 1 nulo. Está en el mismo sistema de coordenadas que `x` del tracking.
- `gameClock`: texto `MM:SS` del reloj del cuarto.
- `preSnapHomeScore`, `preSnapVisitorScore`: marcador antes del snap.

Resultado:
- `passResult`: C completo (4,620), I incompleto (2,755), S sack (543), R scramble (449), IN intercepción (190). No hay carreras: solo dropbacks.
- `prePenaltyPlayResult`: yardas netas antes de penalización. `playResult`: yardas netas incluyendo penalización. Rango -34 a 91, media 6.6.
- `penaltyYards`: yardas por penalización. 7,801 nulos (91% de jugadas sin falta). Puede ser negativo (falta ofensiva).
- `foulName1..3`, `foulNFLId1..3`: nombre y jugador de hasta 3 faltas. Mayoría nulos. Faltas comunes: Defensive Pass Interference (145), Offensive Holding (144), Defensive Holding (76), Roughing the Passer (61). `foulName3` solo tiene 1 registro.

Formaciones y esquemas:
- `offenseFormation`: SHOTGUN 5,481, EMPTY 1,396, SINGLEBACK 1,189, I_FORM 298, PISTOL 154, JUMBO 30, WILDCAT 2. 7 nulos.
- `personnelO`: texto tipo `1 RB, 1 TE, 3 WR` (30 variantes). 1 nulo. Parsear con regex. Algunas incluyen `6 OL` o `2 QB`.
- `personnelD`: texto tipo `4 DL, 2 LB, 5 DB` (29 variantes). 1 nulo.
- `defendersInBox`: 1 a 11, moda 6. 7 nulos.
- `dropBackType`: TRADITIONAL 6,542, SCRAMBLE 899, DESIGNED_ROLLOUT_RIGHT/LEFT, SCRAMBLE_ROLLOUT_RIGHT/LEFT, DESIGNED_RUN (5), UNKNOWN (1). 528 nulos.
- `pff_playAction`: 0/1. 2,038 jugadas con play action (24%).
- `pff_passCoverage`: Cover-3 2,665, Cover-1 2,011, Cover-2 1,085, Quarters 1,033, Cover-6 805, Red Zone 376, Cover-0 270, 2-Man 200, Bracket 47, Prevent 32, Goal Line 25, Miscellaneous 8. Sin nulos.
- `pff_passCoverageType`: Zone 5,588, Man 2,481, Other 488. Sin nulos.

## pffScoutingData.csv
Una fila por jugador por jugada.
- `pff_role`: Coverage 57,765, Pass Block 46,057, Pass Route 39,513, Pass Rush 36,362, Pass 8,557 (un QB por jugada). El README escribe `Pass block`, `Pass route`, `Pass rush`, pero los datos usan mayúscula en la segunda palabra: `Pass Block`, etc.
- `pff_positionLinedUp`: 56 posiciones alineadas al snap (QB, LWR, TE-L, HB-R, etc.).
- Métricas defensivas (`pff_hit`, `pff_hurry`, `pff_sack`): solo definidas para Pass Rush y Coverage (94,127 nulos). Hits 843, hurries 2,877, sacks 602.
- Métricas de bloqueo (`pff_beatenByDefender`, `pff_hitAllowed`, `pff_hurryAllowed`, `pff_sackAllowed`, `pff_blockType`, `pff_backFieldBlock`): solo para Pass Block (~47.9 k filas, ~140 k nulos). Vencido: 1,944. Hurry permitido: 2,083. Hit permitido: 544. Sack permitido: 370.
- `pff_nflIdBlockedPlayer`: nflId del primer defensor bloqueado. 141,728 nulos. Une con `players`.
- `pff_blockType`: PP 24,697, PA 6,331, PT 5,906, SW 3,025, CL 2,595, CH 1,565, NB 1,352, PU 886, SR 501, BH 443, UP 308, PR 295.
- Los nulos son "no aplica", no datos faltantes. No rellenar con 0 sin distinguir el rol.

## tracking/tracking_{gameId}.csv
Datos de Next Gen Stats a 10 frames por segundo. Una fila por jugador (y balón) por frame.
- `gameId`, `playId`, `nflId`: llaves. `nflId` es NA en las filas del balón (`team = football`), ~4% de las filas.
- `frameId`: empieza en 1. Una jugada dura entre 21 y 177 frames, mediana 38 (≈ 3.8 s).
- `time`: timestamp UTC ISO (`2021-09-10T00:26:31Z`). Solo con resolución de segundo en la muestra vista, usa `frameId` para el orden.
- `jerseyNumber`: número de camiseta, NA en el balón.
- `team`: abreviatura del equipo del jugador o `football`.
- `playDirection`: `left` o `right`, dirección del ataque. Las coordenadas NO están normalizadas: hay que reflejar x e y cuando `left` para comparar jugadas.
- `x`: 0 a 120 yardas (incluye zonas de anotación de 10 yd). Observado 2.1 a 119.6.
- `y`: 0 a 53.3 yardas. Observado -0.67 a 55.71, hay valores fuera del campo.
- `s`: velocidad en yd/s, 0 a 27.7 (valores > 12 son sospechosos). Media 2.5.
- `a`: aceleración en yd/s², 0 a 31.6 (valores altos son ruido).
- `dis`: distancia recorrida desde el frame anterior, 0 a 8.5.
- `o`: orientación del cuerpo en grados 0-360. NA en el balón.
- `dir`: ángulo de movimiento en grados 0-360. NA en el balón.
- `event`: etiqueta del evento del frame. ~92% son nulos (en el CSV aparece como cadena `None`, que pandas lee como NaN). Eventos: ball_snap, autoevent_ballsnap, pass_forward, autoevent_passforward, play_action, qb_sack, pass_arrived, pass_outcome_caught, pass_outcome_incomplete, pass_tipped, line_set, man_in_motion, shift, run, first_contact, fumble, qb_strip_sack, autoevent_passinterrupted y otros. El snap y el pase pueden venir como `ball_snap` o `autoevent_ballsnap`: tratar ambos como equivalentes.

## Reglas prácticas para el código
1. El tracking pesa ~826 MB: no cargarlo completo en memoria. Leer por juego con `usecols` y agregar en memoria al arrancar. No escribir archivos intermedios (el servidor es efímero y `data/` es solo lectura). No usar parquet: requiere pyarrow, que no está en el stack.
2. Al backend desplegado le sirven datos agregados, no el tracking crudo.
3. Normalizar dirección de juego antes de calcular distancias o ángulos.
4. Recortar frames relevantes con `event` (snap hasta pase o sack) para features de pocket, presión y separación.
5. En los CSV, `NA` (plays, pff) y `None` (event del tracking) son nulos que pandas ya convierte a NaN por defecto.
6. Entorno: usar siempre `.venv/bin/python` (pandas 2.2.3, numpy 2.1.3, según `rules.md`). No usar el Python de Anaconda ni el del sistema, y no instalar paquetes.
7. Cobertura: solo semanas 1-8 de 2021, solo pases. Conclusiones no generalizan a carreras ni a toda la temporada.
8. Cuando un campo PFF tenga nulos, filtra primero por `pff_role` antes de agregar.
