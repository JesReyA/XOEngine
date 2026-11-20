"""X&O Engine: API FastAPI. Ejecuta desde la raíz: .venv/bin/uvicorn backend.main:app --reload --port 8000"""
import os
from pathlib import Path

def cargar_env():
    f = Path(__file__).resolve().parent.parent / ".env"
    if f.exists():
        for linea in f.read_text(encoding="utf-8-sig").splitlines():
            linea = linea.strip()
            if linea and not linea.startswith("#") and "=" in linea:
                k, v = linea.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

cargar_env()

import logging  # noqa: E402
import random  # noqa: E402
import re  # noqa: E402
import threading  # noqa: E402
import time  # noqa: E402

from fastapi import FastAPI, HTTPException, Path as PathParam, Query  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402

from backend import ai_agent, data_engine, schemas, sim_engine  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

app = FastAPI(title="X&O Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Estado en memoria (nunca en disco).
leaderboard: list[dict] = []          # rankings individuales
# Retos generados. La petición del reto no trae username, así que la llave es "game_id:fan_team".
fan_sessions: dict[str, dict] = {}

_lock_estado = threading.Lock()
MAX_LEADERBOARD = 10_000
MAX_SESIONES = 256
MAX_MENSAJE = 2_000
MAX_TEXTO_LIBRE = 500
PUNTOS_MAX_PASO = 120  # 100 por efectividad + 20 de bono

_TEAM_RE = re.compile(r"^[A-Za-z]{2,3}$")
_USERNAME_RE = re.compile(r"^[\w .\-]{3,24}$")


def _ahora_ms() -> int:
    return int(time.time() * 1000)


def _sembrar_rankings() -> None:
    """Aficionados de ejemplo (deterministas) para que los rankings nunca aparezcan vacíos."""
    rng = random.Random(2021)
    sufijos = ["Nation", "Fan", "Faithful", "Crew", "Army", "Squad", "Mafia", "Zone"]
    ahora = _ahora_ms()
    for abbr, nombre in data_engine.TEAM_NAMES.items():
        apodo = nombre.split()[-1] if nombre.split()[-1] != "Team" else "Washington"
        for _ in range(rng.randint(2, 4)):
            sesiones = rng.randint(1, 6)
            eficacia = round(rng.uniform(0.38, 0.74), 4)
            puntos = sum(round(5 * (eficacia * 100 + rng.choice([0, 0, 20]) * rng.random())) for _ in range(sesiones))
            usuario = f"{apodo}{rng.choice(sufijos)}_{rng.randint(1, 99)}"
            if any(e["username"] == usuario for e in leaderboard):
                continue
            leaderboard.append({
                "username": usuario, "fan_team": abbr,
                "total_score": int(puntos), "avg_effectiveness": eficacia,
                "streak": rng.randint(0, sesiones), "challenges_completed": 5 * sesiones,
                "updated_ms": ahora - rng.randint(1, 14) * 86_400_000,
            })


_sembrar_rankings()


@app.on_event("startup")
def startup() -> None:
    data_engine.cargar_datos()


def _validar_team(team: str | None) -> str | None:
    if team is not None and not _TEAM_RE.match(team):
        raise HTTPException(status_code=400, detail="La abreviatura de equipo debe tener 2 o 3 letras.")
    return team


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/health", response_model=schemas.HealthResponse)
def api_health() -> dict:
    return {"status": "ok"}


@app.get("/api/stats", response_model=schemas.StatsResponse)
def get_stats(team: str | None = None, player_id: int | None = None):
    try:
        return data_engine.get_stats(team=_validar_team(team), player_id=player_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=exc.args[0]) from exc


@app.get("/api/team/{team_abbr}", response_model=schemas.TeamResponse)
def get_team(team_abbr: str = PathParam(..., min_length=2, max_length=3)):
    try:
        return data_engine.get_team_profile(_validar_team(team_abbr))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=exc.args[0]) from exc


@app.get("/api/scouting", response_model=schemas.ScoutingResponse)
def get_scouting(player_id: int | None = None, team: str | None = None, opponent: str | None = None):
    try:
        return data_engine.get_scouting(player_id=player_id, team=_validar_team(team),
                                        opponent=_validar_team(opponent))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=exc.args[0]) from exc


@app.post("/api/simulate", response_model=schemas.SimulateResponse)
def simulate(request: schemas.SimulateRequest):
    _validar_team(request.offense_team)
    _validar_team(request.defense_team)
    try:
        return sim_engine.simular_completo(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=exc.args[0]) from exc


# ------------------------------------------------------------------ reto de 5 jugadas
def _sesion_reto(game_id: str | None, team: str | None) -> dict:
    llave = f"{game_id or ''}:{(team or '').upper()}"
    with _lock_estado:
        if llave in fan_sessions:
            return fan_sessions[llave]
    reto = data_engine.get_escenarios_reto(game_id, team)
    for e in reto["scenarios"]:
        e["options"] = sim_engine.opciones_reto(e)
        e["players"] = e["initial_players"]
    sesion = {"reto": reto, "referencias": {}}
    with _lock_estado:
        for k in (llave, f"{reto['game_id']}:{reto['fan_team']}"):
            fan_sessions[k] = sesion
        while len(fan_sessions) > MAX_SESIONES:
            fan_sessions.pop(next(iter(fan_sessions)))
    return sesion


@app.get("/api/challenge", response_model=schemas.ChallengeScenariosResponse)
def get_challenge(game_id: str | None = None, team: str | None = None, fan_team: str | None = None):
    try:
        return _sesion_reto(game_id, _validar_team(fan_team or team))["reto"]
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=exc.args[0]) from exc


@app.post("/api/challenge", response_model=schemas.ChallengeResponse)
def post_challenge(request: schemas.ChallengeRequest):
    _validar_team(request.fan_team)
    if request.decision_type == "free_text":
        texto = (request.free_text or "").strip()
        if not texto:
            raise HTTPException(status_code=400, detail="free_text es obligatorio cuando decision_type es free_text.")
        if len(texto) > MAX_TEXTO_LIBRE:
            raise HTTPException(status_code=400, detail=f"free_text admite hasta {MAX_TEXTO_LIBRE} caracteres.")
    try:
        sesion = _sesion_reto(request.game_id, request.fan_team)
        reto = sesion["reto"]
        escenarios = reto["scenarios"]
        if not 1 <= request.challenge_step <= len(escenarios):
            raise ValueError(f"challenge_step debe estar entre 1 y {len(escenarios)}.")
        esc = escenarios[request.challenge_step - 1]
        referencia = sesion["referencias"].get(request.challenge_step)
        if referencia is None:
            referencia = sim_engine.efectividad_opciones(esc, reto["fan_team"], reto["opponent"])
            sesion["referencias"][request.challenge_step] = referencia
        return sim_engine.evaluar_reto(esc, reto["fan_team"], reto["opponent"], request.decision_type,
                                       request.free_text, referencia, request.challenge_step == len(escenarios))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=exc.args[0]) from exc


# ------------------------------------------------------------------ rankings (en memoria)
def _ordenados(entradas: list[dict]) -> list[dict]:
    return sorted(entradas, key=lambda e: (-e["total_score"], -e["avg_effectiveness"], e["username"].lower()))


def _ligas() -> list[dict]:
    por_equipo: dict[str, list[dict]] = {}
    for e in leaderboard:
        por_equipo.setdefault(e["fan_team"], []).append(e)
    filas = [{"team_abbr": t, "team_name": data_engine.TEAM_NAMES.get(t, t),
              "avg_score": round(sum(e["total_score"] for e in es) / len(es), 1),
              "avg_effectiveness": round(sum(e["avg_effectiveness"] for e in es) / len(es), 4),
              "participant_count": len(es)} for t, es in por_equipo.items()]
    filas.sort(key=lambda f: (-f["avg_effectiveness"], -f["avg_score"]))
    return [{"rank": i, **f} for i, f in enumerate(filas, start=1)]


@app.get("/api/rankings", response_model=schemas.RankingsResponse)
def get_rankings(limit: int = Query(20, ge=1, le=100), team: str | None = None):
    t = _validar_team(team).upper() if team else None
    if t and t not in data_engine.TEAM_NAMES:
        raise HTTPException(status_code=404, detail=f"Equipo {t} no encontrado")
    with _lock_estado:
        filas = _ordenados([e for e in leaderboard if not t or e["fan_team"] == t])
        individual = [{"rank": i, **{k: e[k] for k in ("username", "fan_team", "total_score", "avg_effectiveness",
                                                         "streak", "challenges_completed")}}
                      for i, e in enumerate(filas[:limit], start=1)]
        return {"individual": individual, "fan_leagues": _ligas(), "total_participants": len(leaderboard),
                "last_updated_ms": max((e["updated_ms"] for e in leaderboard), default=_ahora_ms())}


@app.post("/api/rankings/submit", response_model=schemas.RankingsSubmitResponse)
def submit_ranking(request: schemas.RankingsSubmitRequest):
    username = request.username.strip()
    if not _USERNAME_RE.match(username):
        raise HTTPException(status_code=400, detail="username debe tener de 3 a 24 letras, números, espacios, '.', '_' o '-'.")
    t = _validar_team(request.fan_team).upper()
    if t not in data_engine.TEAM_NAMES:
        raise HTTPException(status_code=404, detail=f"Equipo {t} no encontrado")
    if not 1 <= request.challenges_completed <= 5:
        raise HTTPException(status_code=400, detail="challenges_completed debe estar entre 1 y 5 por sesión.")
    if not 0 <= request.total_score <= PUNTOS_MAX_PASO * request.challenges_completed:
        raise HTTPException(status_code=400, detail="total_score fuera de rango para los retos completados.")
    if not 0.0 <= request.avg_effectiveness <= 1.0:
        raise HTTPException(status_code=400, detail="avg_effectiveness debe estar entre 0 y 1.")

    with _lock_estado:
        e = next((x for x in leaderboard if x["username"].lower() == username.lower()), None)
        if e is None:
            if len(leaderboard) >= MAX_LEADERBOARD:
                raise HTTPException(status_code=503, detail="El ranking está lleno; inténtalo más tarde.")
            e = {"username": username, "fan_team": t, "total_score": 0, "avg_effectiveness": 0.0, "streak": 0,
                 "challenges_completed": 0, "updated_ms": 0}
            leaderboard.append(e)
        previos = e["challenges_completed"]
        total = previos + request.challenges_completed
        e["avg_effectiveness"] = round((e["avg_effectiveness"] * previos
                                        + request.avg_effectiveness * request.challenges_completed) / total, 4)
        e["total_score"] += request.total_score
        e["challenges_completed"] = total
        e["fan_team"] = t
        # Racha: sesiones seguidas con efectividad media de al menos 50%.
        e["streak"] = e["streak"] + 1 if request.avg_effectiveness >= 0.5 else 0
        e["updated_ms"] = _ahora_ms()
        orden = _ordenados(leaderboard)
        rank = orden.index(e) + 1
        rank_equipo = [x for x in orden if x["fan_team"] == t].index(e) + 1

    if rank_equipo == 1:
        mensaje = f"¡Increíble! Eres el aficionado #1 de {t}."
    elif rank_equipo <= 5:
        mensaje = f"¡Buen intento! Estás en el top 5 de aficionados de {t}."
    else:
        mensaje = f"Vas en el lugar {rank_equipo} entre los aficionados de {t}. ¡Sigue jugando para subir!"
    return {"submitted": True, "new_rank": rank, "message": mensaje}


# ------------------------------------------------------------------ copiloto
@app.post("/api/chat", response_model=schemas.ChatResponse)
def chat(request: schemas.ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="message no puede estar vacío.")
    if len(request.message) > MAX_MENSAJE:
        raise HTTPException(status_code=400, detail=f"message admite hasta {MAX_MENSAJE} caracteres.")
    if request.context and request.context.fan_team:
        _validar_team(request.context.fan_team)
    return ai_agent.responder(request)


# Producción: sirve el build del dashboard en la misma URL. Va al final, después de /health y /api/...,
# para que el montaje en "/" no capture esas rutas (si no, un POST a la API respondería 405).
_DIST = Path(__file__).resolve().parent.parent / "dashboard" / "dist"
if _DIST.is_dir():
    app.mount("/", StaticFiles(directory=_DIST, html=True), name="dashboard")
