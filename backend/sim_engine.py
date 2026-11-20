"""Simulador cinemático + scoring logístico. Solo usa numpy y pandas (vía data_engine).

Algoritmo (ver .kiro/steering/03-backend-guidelines.md):
1. Busca las jugadas históricas más parecidas al contexto (data_engine.buscar_jugadas_similares).
2. Trayectorias: cada jugador sigue la trayectoria media de su grupo (QB, OL, WR, CB, ...) en esas
   jugadas. Si un receptor trae `route`, recorre la geometría de esa ruta acelerando con su
   aceleración real hasta su velocidad máxima real, y frena antes de cada quiebre.
3. Defensa: en cada frame cada defensor calcula el punto de intercepción con su objetivo
   (receptor en man, receptor que entra a su zona, QB si es rusher libre) y gira hacia él con
   aceleración y velocidad limitadas.
4. Frames a 10 Hz hasta que la jugada concluye según la mediana de las jugadas similares (30 a 50).
5. Efectividad: modelo logístico ponderado sobre 5 factores normalizados en [-3, 3].
"""
from __future__ import annotations

import itertools
import math
import re

import numpy as np

from backend import data_engine

FPS = 10
DT = 1.0 / FPS
MAX_FRAMES = 50
MIN_FRAMES = 30
TOP_N = 20
RADIO_SIMILITUD = 1.0   # distancia máxima (espacio normalizado) para contar una jugada como similar
MIN_SIMILARES = 5
K_LANZAMIENTO = (12, 45)  # límites del frame del pase (1.2 s a 4.5 s)
LARGO, ANCHO = data_engine.CAMPO_LARGO, data_engine.CAMPO_ANCHO

RECEPTORES = {"WR", "SLOT", "TE", "RB"}
RUSHERS = {"DL", "EDGE"}
COBERTURAS = {"man", "zone", "press"}
RETRASO_REACCION = {"press": 1, "man": 3, "zone": 4}  # frames que tarda el defensor en leer al receptor
RADIO_ZONA = 5.0       # yd: un receptor a esta distancia activa la persecución del defensor de zona
DIST_CONTACTO = 1.0    # yd: a esta distancia el defensor iguala la velocidad del objetivo
FRENO_PRESS = 0.65     # fracción de velocidad del receptor durante el jam de press
FRAMES_PRESS = 8
T_ANTICIPACION = 0.7   # s: anticipación cuando el defensor no puede interceptar
ACCEL_MIN, ACCEL_MAX = 5.0, 8.0  # yd/s²: rango de aceleración pico permitido
COLCHON_ZONA = 2.0     # yd que el defensor de zona intenta mantener por delante del receptor

# Rutas: puntos (avance, hacia la banda) en yardas desde la posición inicial del receptor.
RUTAS = {
    "fly": [(0, 0), (45, 0)],
    "post": [(0, 0), (12, 0), (32, -14)],
    "curl": [(0, 0), (12, 0), (10.5, -1.0)],
    "slant": [(0, 0), (3, 0), (20, -16)],
    "out": [(0, 0), (10, 0), (11, 12)],
    "cross": [(0, 0), (5, 0), (10, -35)],
    "screen": [(0, 0), (-2, 3), (-1.5, 5), (12, 6)],
}
RUTAS_TERMINALES = {"curl"}  # el receptor se detiene al final; las demás siguen en la última dirección

_ROL_A_GRUPO = {
    "QB": "QB", "WR": "WR", "X": "WR", "Z": "WR", "SLOT": "SLOT", "SWR": "SLOT",
    "RB": "RB", "HB": "RB", "FB": "RB", "TE": "TE",
    "OL": "OL", "LT": "OL", "LG": "OL", "C": "OL", "RG": "OL", "RT": "OL", "T": "OL", "G": "OL",
    "OT": "OL", "OG": "OL",
    "DE": "EDGE", "EDGE": "EDGE", "OLB": "EDGE", "DT": "DL", "NT": "DL", "DL": "DL",
    "LB": "LB", "ILB": "LB", "MLB": "LB", "WLB": "LB", "SLB": "LB",
    "CB": "CB", "NB": "CB", "NCB": "CB", "S": "S", "FS": "S", "SS": "S",
}
_GRUPOS_OFENSIVOS = {"QB", "OL", "RB", "TE", "WR", "SLOT"}

_contador = itertools.count(1)

# ============================================================ scoring logístico (03-backend-guidelines)
FEATURE_WEIGHTS = np.array([0.31, 0.24, 0.19, 0.15, 0.11])
FEATURE_NAMES = [
    "Separación del receptor",
    "Presión al QB",
    "Velocidad de cierre defensivo",
    "Contexto de down",
    "Emparejamiento en ruta",
]


def _logistic(x: float) -> float:
    return 1.0 / (1.0 + np.exp(-x))


def calcular_efectividad(features: np.ndarray) -> tuple[float, list[dict]]:
    """
    features: array shape (5,) con valores normalizados [−3, 3].
    Devuelve (score 0–1, lista de factores con weight/value/impact).
    """
    raw_score = float(np.dot(FEATURE_WEIGHTS, features))
    score = _logistic(raw_score)
    factors = []
    for name, w, v in zip(FEATURE_NAMES, FEATURE_WEIGHTS, features):
        impact = "positive" if v > 0 else ("negative" if v < 0 else "neutral")
        factors.append({"name": name, "weight": round(float(w), 2),
                        "value": round(float(v), 2), "impact": impact})
    return round(score, 4), factors


# ============================================================ utilidades
def _grupo_de_rol(role: str, lado: str) -> str:
    g = _ROL_A_GRUPO.get(re.sub(r"\d+", "", role.upper()).strip())
    if lado == "offense":
        return g if g in _GRUPOS_OFENSIVOS else "WR"
    return g if g and g not in _GRUPOS_OFENSIVOS else "LB"


def _personal(grupos_of: list[str]) -> str:
    return f"{grupos_of.count('RB')}{grupos_of.count('TE')} personnel"


def _clip(v: float, lo: float = -3.0, hi: float = 3.0) -> float:
    return float(np.clip(v, lo, hi)) if np.isfinite(v) else 0.0


def _completar(tray: np.ndarray, n: int) -> np.ndarray:
    """Trayectoria (K, 2) sin NaN y con n frames: si los datos se acaban, sigue con la última
    velocidad y la va frenando (×0.85 por frame)."""
    out = np.zeros((n, 2))
    validos = ~np.isnan(tray[:, 0])
    if not validos.any():
        return out
    ultimo = int(np.flatnonzero(validos)[-1])
    m = min(ultimo + 1, n)
    out[:m] = tray[:m]
    vel = tray[ultimo] - tray[ultimo - 1] if ultimo > 0 else np.zeros(2)
    for k in range(m, n):
        vel = vel * 0.85
        out[k] = out[k - 1] + vel
    return out


def _intercepcion(p: np.ndarray, obj: np.ndarray, v_obj: np.ndarray, vmax: float) -> np.ndarray:
    """Punto donde un perseguidor a velocidad vmax alcanza a un objetivo con velocidad v_obj.
    Resuelve |obj + v_obj·t − p| = vmax·t; si no hay solución, persecución pura."""
    r = obj - p
    a = float(v_obj @ v_obj) - vmax * vmax
    b = 2.0 * float(r @ v_obj)
    c = float(r @ r)
    t = None
    if abs(a) < 1e-6:
        if b < 0:
            t = -c / b
    else:
        disc = b * b - 4 * a * c
        if disc >= 0:
            raiz = math.sqrt(disc)
            positivos = [x for x in ((-b - raiz) / (2 * a), (-b + raiz) / (2 * a)) if x > 0]
            if positivos:
                t = min(positivos)
    if t is None:
        # Más lento que el objetivo: corre hacia donde estará, no hacia donde está
        # (perseguir la posición actual lo haría correr de frente y luego girar).
        return obj + v_obj * T_ANTICIPACION
    return obj + v_obj * min(t, 2.0)


def _destino_cobertura(p: np.ndarray, obj: np.ndarray, v_obj: np.ndarray, vmax: float,
                       dir_x: float, colchon: float) -> np.ndarray:
    """Si el defensor va detrás del receptor (en el sentido del ataque), lo intercepta.
    Si va delante, retrocede para quedar `colchon` yardas por delante de donde estará."""
    if (p[0] - obj[0]) * dir_x <= colchon * 0.5:
        return _intercepcion(p, obj, v_obj, vmax)
    return obj + v_obj * T_ANTICIPACION + np.array([dir_x * colchon, 0.0])


def _mover(p: np.ndarray, v: np.ndarray, destino: np.ndarray, vmax: float, amax: float,
           v_igualar: np.ndarray | None = None) -> tuple[np.ndarray, np.ndarray]:
    """Un paso de DT hacia `destino` con velocidad ≤ vmax y cambio de velocidad ≤ amax·DT."""
    if v_igualar is not None:
        v_des = v_igualar
    else:
        r = destino - p
        d = float(np.hypot(*r))
        v_des = np.zeros(2) if d < 1e-6 else r / d * min(vmax, d / DT)
    dv = v_des - v
    n = float(np.hypot(*dv))
    if n > amax * DT:
        dv = dv * (amax * DT / n)
    v2 = v + dv
    s = float(np.hypot(*v2))
    if s > vmax:
        v2 = v2 * (vmax / s)
    p2 = p + v2 * DT
    p2[0] = min(max(p2[0], 0.0), LARGO)
    p2[1] = min(max(p2[1], 0.0), ANCHO)
    return p2, v2


class _Ruta:
    """Recorrido de una ruta: avanza por la polilínea acelerando y frena antes de cada quiebre."""

    def __init__(self, puntos: np.ndarray, vmax: float, amax: float, terminal: bool):
        if not terminal:
            u = puntos[-1] - puntos[-2]
            puntos = np.vstack([puntos, puntos[-1] + u / max(np.hypot(*u), 1e-6) * 40.0])
        self.p = puntos
        seg = np.diff(puntos, axis=0)
        self.largo = np.hypot(seg[:, 0], seg[:, 1])
        self.acum = np.concatenate([[0.0], np.cumsum(self.largo)])
        self.vmax, self.amax = vmax, amax
        # Velocidad máxima en cada quiebre según el ángulo de giro; 0 al final de una ruta terminal.
        caps = []
        for i in range(1, len(puntos) - 1):
            u, w = seg[i - 1], seg[i]
            cos = float(u @ w) / max(self.largo[i - 1] * self.largo[i], 1e-9)
            giro = math.acos(max(-1.0, min(1.0, cos)))
            caps.append((self.acum[i], vmax * (1.0 - 0.6 * giro / math.pi)))
        if terminal:
            caps.append((self.acum[-1], 0.0))
        self.caps = caps
        self.s, self.v = 0.0, 0.0

    def paso(self, tope: float) -> np.ndarray:
        permitido = min(self.vmax, tope)
        for pos, cap in self.caps:
            if pos > self.s:
                permitido = min(permitido, math.sqrt(cap * cap + 2 * 1.5 * self.amax * (pos - self.s)))
        self.v = min(self.v + self.amax * DT, permitido)
        self.s = min(self.s + self.v * DT, self.acum[-1])
        i = min(int(np.searchsorted(self.acum, self.s, side="right")) - 1, len(self.largo) - 1)
        f = (self.s - self.acum[i]) / max(self.largo[i], 1e-9)
        return self.p[i] + (self.p[i + 1] - self.p[i]) * f


# ============================================================ validación
def _validar(req) -> None:
    ctx = req.game_context
    if not 1 <= ctx.down <= 4:
        raise ValueError("down debe estar entre 1 y 4.")
    if not 1 <= ctx.yards_to_go <= 99:
        raise ValueError("yards_to_go debe estar entre 1 y 99.")
    if not 1 <= ctx.quarter <= 5:
        raise ValueError("quarter debe estar entre 1 y 5.")
    if ctx.field_zone not in data_engine.FIELD_ZONE_CODES:
        raise ValueError(f"field_zone debe ser uno de: {', '.join(sorted(data_engine.FIELD_ZONE_CODES))}.")
    of = [p for p in req.players if p.team == "offense"]
    de = [p for p in req.players if p.team == "defense"]
    if not of or not de:
        raise ValueError("Se necesita al menos un jugador ofensivo y uno defensivo.")
    if len(of) > 11 or len(de) > 11:
        raise ValueError("Máximo 11 jugadores por equipo.")
    if len({p.player_id for p in req.players}) != len(req.players):
        raise ValueError("player_id repetido.")
    for p in req.players:
        if not (0 <= p.x <= LARGO and 0 <= p.y <= ANCHO):
            raise ValueError(f"Jugador {p.player_id} fuera de la cancha (x 0–120, y 0–53.3).")
        if p.route is not None and p.route not in RUTAS:
            raise ValueError(f"route debe ser uno de: {', '.join(RUTAS)}.")
        if p.coverage is not None and p.coverage not in COBERTURAS:
            raise ValueError(f"coverage debe ser uno de: {', '.join(sorted(COBERTURAS))}.")
    for t in (req.offense_team, req.defense_team):
        if not data_engine.equipo_existe(t):
            raise KeyError(f"Equipo {t} no encontrado")


# ============================================================ simulación
def simular_completo(request) -> dict:
    """Ejecuta la simulación y devuelve todos los campos de SimulateResponse."""
    _validar(request)
    ctx = request.game_context
    players = request.players
    n = len(players)
    lados = [p.team for p in players]
    grupos = [_grupo_de_rol(p.role, p.team) for p in players]
    of_idx = [i for i in range(n) if lados[i] == "offense"]
    de_idx = [i for i in range(n) if lados[i] == "defense"]

    # 1. Jugadas similares
    similares = data_engine.buscar_jugadas_similares({
        "down": ctx.down, "yards_to_go": ctx.yards_to_go, "field_zone": ctx.field_zone,
        "score_diff": ctx.score_diff, "offense_team": request.offense_team,
        "formation": _personal([grupos[i] for i in of_idx]),
    }, top_n=TOP_N)
    usadas = similares[similares["distancia"] <= RADIO_SIMILITUD]
    if len(usadas) < MIN_SIMILARES:
        usadas = similares.head(MIN_SIMILARES)
    liga = data_engine.referencias_liga()

    t_lanz = usadas["t_lanzamiento"].median()
    k_lanz = int(np.clip(t_lanz if np.isfinite(t_lanz) else liga["t_lanzamiento"], *K_LANZAMIENTO))
    fin = usadas["frames_post_snap"].median()
    n_frames = int(np.clip(max(fin if np.isfinite(fin) else 0, k_lanz + 10), MIN_FRAMES, MAX_FRAMES))
    medias = data_engine.trayectorias_medias(usadas["row_id"].to_numpy())

    # Orientación: la ofensiva ataca hacia donde está la defensa.
    pos0 = np.array([[p.x, p.y] for p in players], dtype=float)
    dir_x = 1.0 if pos0[de_idx, 0].mean() >= pos0[of_idx, 0].mean() else -1.0
    qb = next((i for i in of_idx if grupos[i] == "QB"), None)
    y_centro = pos0[qb, 1] if qb is not None else float(np.mean(pos0[of_idx, 1]))
    lado_y = np.where(pos0[:, 1] >= y_centro, 1.0, -1.0)

    def _a_campo(i: int, rel: np.ndarray) -> np.ndarray:
        return pos0[i] + np.column_stack([dir_x * rel[:, 0], lado_y[i] * rel[:, 1]])

    kin = [data_engine.cinematica(p.player_id, grupos[i]) for i, p in enumerate(players)]
    vmax = np.array([k[0] for k in kin])
    # La aceleración media del primer segundo incluye el tiempo de reacción: el pico es ≈ 2×.
    amax = np.clip(np.array([k[1] for k in kin]) * 2.0, ACCEL_MIN, ACCEL_MAX)

    def _plantilla(i: int, grupo: str) -> np.ndarray:
        return _a_campo(i, _completar(medias[data_engine.GRUPO_IDX[grupo]], n_frames))

    # 2. Ofensiva: rutas o trayectoria media del grupo
    rutas: dict[int, _Ruta] = {}
    plan: dict[int, np.ndarray] = {}
    for i in of_idx:
        r = players[i].route
        if r:
            rel = np.array(RUTAS[r], dtype=float)
            rutas[i] = _Ruta(_a_campo(i, rel), vmax[i], amax[i], r in RUTAS_TERMINALES)
        else:
            plan[i] = _plantilla(i, grupos[i])
    # Receptores: todo el que corre ruta, más WR/SLOT sin ruta (siguen la trayectoria media de su grupo).
    receptores = [i for i in of_idx if i in rutas or grupos[i] in {"WR", "SLOT"}]
    bloqueadores = [i for i in of_idx if i not in rutas and grupos[i] in {"OL", "TE", "RB"}]

    # 3. Defensa: asignación de tareas
    tendencia = data_engine.tendencias_defensa(request.defense_team)
    cob_defecto = "man" if tendencia["man_rate"] > liga["man_rate"] else "zone"
    tarea: dict[int, str] = {}
    for i in de_idx:
        c = players[i].coverage
        tarea[i] = c if c else ("rush" if grupos[i] in RUSHERS else cob_defecto)
    hombre: dict[int, int] = {}
    pares = sorted(((float(np.hypot(*(pos0[i] - pos0[j]))), i, j)
                    for i in de_idx if tarea[i] in {"man", "press"} for j in receptores))
    cubiertos: set[int] = set()
    for _, i, j in pares:
        if i not in hombre and j not in cubiertos:
            hombre[i] = j
            cubiertos.add(j)
    for i in de_idx:
        if tarea[i] in {"man", "press"} and i not in hombre:
            tarea[i] = "zone"  # sobran defensores de hombre: pasan a zona
    jam = {j for i, j in hombre.items() if tarea[i] == "press" and np.hypot(*(pos0[i] - pos0[j])) < 2.5}
    colchon0 = {i: max(1.0, (pos0[i, 0] - pos0[j, 0]) * dir_x) for i, j in hombre.items()}
    rushers = [i for i in de_idx if tarea[i] == "rush"]
    # Rushers que superan a los bloqueadores quedan libres y persiguen al QB a velocidad completa.
    libres = set(sorted(rushers, key=lambda i: abs(pos0[i, 1] - y_centro))[len(bloqueadores):]) \
        if qb is not None else set()
    landmark = {i: _plantilla(i, "LB" if grupos[i] in RUSHERS else grupos[i])
                for i in de_idx if tarea[i] == "zone"}
    rush_plan = {i: _plantilla(i, grupos[i]) for i in rushers}

    # 4. Integración frame a frame
    pos = np.zeros((n_frames, n, 2))
    pos[0] = pos0
    vel = np.zeros((n, 2))
    rapidez = np.zeros((n_frames, n))  # rapidez real de cada jugador en cada frame
    objetivo_final: int | None = None
    for k in range(1, n_frames):
        for i in of_idx:
            if i in rutas:
                tope = vmax[i] * FRENO_PRESS if (i in jam and k <= FRAMES_PRESS) else vmax[i]
                pos[k, i] = rutas[i].paso(tope)
                rapidez[k, i] = rutas[i].v  # sobre la ruta, no la cuerda entre frames
            else:
                pos[k, i] = np.clip(plan[i][k], [0, 0], [LARGO, ANCHO])
                rapidez[k, i] = np.hypot(*(pos[k, i] - pos[k - 1, i])) / DT

        def _estado(j: int, atraso: int) -> tuple[np.ndarray, np.ndarray]:
            kk = max(k - atraso, 0)
            v = (pos[kk, j] - pos[kk - 1, j]) / DT if kk >= 1 else np.zeros(2)
            return pos[kk, j], v

        for i in de_idx:
            p, v = pos[k - 1, i], vel[i]
            t = tarea[i]
            destino, igualar, vm = None, None, vmax[i]
            if t == "rush":
                if i in libres:
                    obj, v_obj = _estado(qb, 0)
                    destino = _intercepcion(p, obj, v_obj, vm)
                    if np.hypot(*(obj - p)) < DIST_CONTACTO:
                        igualar = v_obj
                else:
                    destino = rush_plan[i][k]  # trayectoria media real del rusher (ya incluye bloqueos)
            else:
                j = hombre.get(i)
                if objetivo_final is not None:
                    j = objetivo_final  # balón en el aire: todos convergen al receptor objetivo
                elif t == "zone":
                    cerca = [(np.hypot(*(pos[k, r] - p)), r) for r in receptores]
                    cerca = [c for c in cerca if c[0] <= RADIO_ZONA]
                    j = min(cerca)[1] if cerca else None
                if j is None:
                    destino = landmark[i][k]
                elif objetivo_final is not None:
                    obj, v_obj = _estado(j, 1)
                    destino = _intercepcion(p, obj, v_obj, vm)  # balón en el aire: ir al punto de recepción
                else:
                    obj, v_obj = _estado(j, RETRASO_REACCION.get(t, 3))
                    # Man: mantiene el colchón inicial 1.5 s y lo cierra a 1 yd en el siguiente segundo.
                    # Zona: 2 yd fijas.
                    c0 = colchon0.get(i, 1.0)
                    colchon = COLCHON_ZONA if t == "zone" else max(1.0, c0 * min(1.0, 1 - (k - 15) / 10))
                    destino = _destino_cobertura(p, obj, v_obj, vm, dir_x, colchon)
                    if np.hypot(*(pos[k, j] - p)) < DIST_CONTACTO:
                        igualar = v_obj
            pos[k, i], vel[i] = _mover(p, v, destino, vm, amax[i], igualar)
            rapidez[k, i] = np.hypot(*vel[i])

        if k == k_lanz and receptores:
            sep = [min(np.hypot(*(pos[k, r] - pos[k, d])) for d in de_idx) for r in receptores]
            objetivo_final = receptores[int(np.argmax(sep))]

    # 5. Efectividad
    kt = min(k_lanz, n_frames - 1)
    features = np.zeros(5)
    if receptores:
        sep = np.array([[np.hypot(*(pos[kt, r] - pos[kt, d])) for d in de_idx] for r in receptores])
        mejor = int(np.argmax(sep.min(axis=1)))
        r_obj = receptores[mejor]
        d_cerca = de_idx[int(np.argmin(sep[mejor]))]
        features[0] = _clip((sep[mejor].min() - liga["best_separation_mean"]) / liga["best_separation_std"])
        d_antes = np.hypot(*(pos[kt - 5, r_obj] - pos[kt - 5, d_cerca]))
        cierre = (d_antes - sep[mejor].min()) / 0.5  # yd/s que el defensor recortó en el último medio segundo
        features[2] = _clip(-cierre / 2.0)
        features[4] = _clip((vmax[r_obj] - vmax[d_cerca]) / 0.5)
    p_sim = 0.0
    if qb is not None and rushers:
        d_qb = min(np.hypot(*(pos[kt, qb] - pos[kt, i])) for i in rushers)
        p_sim = float(np.clip((4.0 - d_qb) / 4.0, 0.0, 1.0))
    p_hist = float(usadas["pressure"].mean())
    presion = 0.5 * p_sim + 0.5 * (p_hist if np.isfinite(p_hist) else liga["pressure_rate"])
    features[1] = _clip(-(presion - liga["pressure_rate"]) / 0.15)
    exito = float(usadas["success"].mean())
    features[3] = _clip((exito - liga["success_rate"]) / 0.1) if np.isfinite(exito) else 0.0

    score, factors = calcular_efectividad(features)

    # 6. Frames
    frames = []
    dir_inicial = np.where(np.array(lados) == "offense", 90.0 if dir_x > 0 else 270.0,
                           270.0 if dir_x > 0 else 90.0)
    direccion = dir_inicial.copy()
    for k in range(n_frames):
        vel_k = (pos[k] - pos[k - 1]) / DT if k > 0 else np.zeros((n, 2))
        mov = np.hypot(vel_k[:, 0], vel_k[:, 1]) > 0.05
        # Convención NGS: 0° = +y, 90° = +x, sentido horario.
        direccion[mov] = np.degrees(np.arctan2(vel_k[mov, 0], vel_k[mov, 1])) % 360.0
        frames.append({
            "frame": k,
            "t_ms": k * 100,
            "players": [{"player_id": players[i].player_id, "x": round(float(pos[k, i, 0]), 2),
                         "y": round(float(pos[k, i, 1]), 2), "speed": round(float(rapidez[k, i]), 2),
                         "dir": round(float(direccion[i]), 1)} for i in range(n)],
        })

    ordinal = {1: "1st", 2: "2nd", 3: "3rd", 4: "4th"}[ctx.down]
    return {
        "play_id_ref": f"sim_{request.offense_team.lower()}_{request.defense_team.lower()}_"
                       f"{ordinal}{ctx.yards_to_go}_{next(_contador):03d}",
        "frames": frames,
        "total_frames": len(frames),
        "fps": FPS,
        "effectiveness": {"score": score, "label": f"{round(score * 100)}%", "factors": factors},
        "similar_plays_found": int(len(usadas)),
    }


def simular(request) -> tuple[list[dict], dict]:
    """
    Recibe un SimulateRequest, ejecuta la simulación y devuelve
    (frames_list, effectiveness_dict) listos para construir SimulateResponse.
    """
    r = simular_completo(request)
    return r["frames"], r["effectiveness"]
