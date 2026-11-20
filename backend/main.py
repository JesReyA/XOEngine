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
import re  # noqa: E402

from fastapi import FastAPI, HTTPException, Path as PathParam  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402

from backend import data_engine, schemas  # noqa: E402

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
fan_sessions: dict[str, dict] = {}    # sesiones de reto activas por username

_TEAM_RE = re.compile(r"^[A-Za-z]{2,3}$")


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


# Producción: sirve el build del dashboard en la misma URL. Va al final para no tapar /api.
_DIST = Path(__file__).resolve().parent.parent / "dashboard" / "dist"
if _DIST.is_dir():
    app.mount("/", StaticFiles(directory=_DIST, html=True), name="dashboard")
