"""Carga y agregación del dataset NFL en memoria. Solo lectura: nunca escribe en disco.

Flujo de `cargar_datos()`:
1. Recorre `data/` (CSV y Parquet, incluidas subcarpetas) y clasifica cada archivo por sus columnas.
2. Normaliza nombres de columnas con `COLUMN_MAP`.
3. Agrega el tracking archivo por archivo (no se guarda crudo en memoria):
   velocidad/aceleración por jugador y distancia al rival más cercano en el frame del pase.
4. Construye tablas derivadas por jugada, jugador y equipo que usan los endpoints.
Si `data/` no tiene datos utilizables, genera un dataset sintético con el mismo esquema.
"""
from __future__ import annotations

import logging
import re
import time
from pathlib import Path

import numpy as np
import pandas as pd

log = logging.getLogger("xo.data_engine")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

COLUMN_MAP = {
    "nflId": ["player_id", "nfl_id", "playerId"],
    "playId": ["play_id", "play_Id"],
    "gameId": ["game_id", "game_Id"],
    "frameId": ["frame_id", "frame_Id"],
    "x": ["X", "pos_x"],
    "y": ["Y", "pos_y"],
    "s": ["speed", "vel"],
    "a": ["accel", "acceleration"],
    "o": ["orientation", "orient"],
    "dir": ["direction"],
    "team": ["club", "teamAbbr", "team_abbr"],
}
_SINONIMOS = {alias: canon for canon, aliases in COLUMN_MAP.items() for alias in aliases}

TRACKING_COLS = ["gameId", "playId", "nflId", "frameId", "team", "x", "y", "s", "a", "o", "dir", "event"]
TRACKING_OPCIONALES = ["s", "a", "o", "dir"]

# Umbrales de limpieza: arriba de esto son lecturas erróneas del sensor.
MAX_SPEED_VALIDA = 12.5  # yd/s (~25.6 mph)
MAX_ACCEL_VALIDA = 15.0  # yd/s²
EVENTOS_PASE = {"pass_forward", "autoevent_passforward"}
ROLES_OFENSIVOS = {"Pass", "Pass Block", "Pass Route"}
POSICIONES_OL = {"C", "G", "T"}
MIN_JUGADAS = 30  # mínimo de jugadas para entrar en rankings y percentiles
YD_S_A_MPH = 3600 / 1760

TEAM_NAMES = {
    "ARI": "Arizona Cardinals", "ATL": "Atlanta Falcons", "BAL": "Baltimore Ravens",
    "BUF": "Buffalo Bills", "CAR": "Carolina Panthers", "CHI": "Chicago Bears",
    "CIN": "Cincinnati Bengals", "CLE": "Cleveland Browns", "DAL": "Dallas Cowboys",
    "DEN": "Denver Broncos", "DET": "Detroit Lions", "GB": "Green Bay Packers",
    "HOU": "Houston Texans", "IND": "Indianapolis Colts", "JAX": "Jacksonville Jaguars",
    "KC": "Kansas City Chiefs", "LA": "Los Angeles Rams", "LAC": "Los Angeles Chargers",
    "LV": "Las Vegas Raiders", "MIA": "Miami Dolphins", "MIN": "Minnesota Vikings",
    "NE": "New England Patriots", "NO": "New Orleans Saints", "NYG": "New York Giants",
    "NYJ": "New York Jets", "PHI": "Philadelphia Eagles", "PIT": "Pittsburgh Steelers",
    "SEA": "Seattle Seahawks", "SF": "San Francisco 49ers", "TB": "Tampa Bay Buccaneers",
    "TEN": "Tennessee Titans", "WAS": "Washington Football Team",
}

FIELD_ZONE_CODES = {
    "own_territory": 0, "midfield": 1, "opponent_territory": 2, "red_zone": 3, "goal_line": 3,
}

COBERTURA_CLAVE = {
    "Cover-0": "cover_0", "Cover-1": "cover_1", "Cover-2": "cover_2", "2-Man": "2_man",
    "Cover-3": "cover_3", "Quarters": "cover_4", "Cover-6": "cover_6", "Bracket": "bracket",
    "Goal Line": "goal_line", "Red Zone": "red_zone", "Prevent": "prevent",
    "Miscellaneous": "misc",
}

# Estado en memoria. Lo llena cargar_datos().
_DB: dict = {}


# ============================================================ utilidades
def _f(x, nd: int = 2) -> float:
    """float nativo redondeado; NaN/None -> 0.0 (JSON no admite NaN)."""
    try:
        v = float(x)
    except (TypeError, ValueError):
        return 0.0
    return 0.0 if np.isnan(v) else round(v, nd)


def _percentil_de(valor: float, distribucion: np.ndarray) -> int:
    """Percentil (0-100) que ocupa `valor` dentro de `distribucion`."""
    d = np.asarray(distribucion, dtype=float)
    d = d[~np.isnan(d)]
    if d.size == 0 or np.isnan(valor):
        return 0
    return int(round(float(np.mean(d <= valor)) * 100))


def _normalizar_columnas(df: pd.DataFrame) -> pd.DataFrame:
    renombres = {c: _SINONIMOS[c] for c in df.columns if c in _SINONIMOS and _SINONIMOS[c] not in df.columns}
    return df.rename(columns=renombres) if renombres else df


def _listar_archivos() -> list[Path]:
    if not DATA_DIR.is_dir():
        return []
    return sorted(DATA_DIR.rglob("*.csv")) + sorted(DATA_DIR.rglob("*.parquet"))


def _leer(path: Path, **kw) -> pd.DataFrame | None:
    try:
        if path.suffix == ".parquet":
            df = pd.read_parquet(path)
            if "usecols" in kw:
                df = df[[c for c in df.columns if kw["usecols"](c)]]
            return df
        return pd.read_csv(path, **kw)
    except ImportError:
        log.warning("Se omite %s: leer Parquet requiere pyarrow, que no está en el stack.", path.name)
    except Exception as exc:  # archivo corrupto o ilegible: se omite sin tumbar el arranque
        log.warning("Se omite %s: %s", path.name, exc)
    return None


def _columnas(path: Path) -> list[str]:
    df = _leer(path, nrows=0) if path.suffix == ".csv" else _leer(path)
    return [] if df is None else list(_normalizar_columnas(df).columns)


def _tipo_archivo(cols: list[str]) -> str | None:
    c = set(cols)
    if {"frameId", "x", "y"} <= c:
        return "tracking"
    if "pff_role" in c:
        return "pff"
    if "homeTeamAbbr" in c:
        return "games"
    if {"playId", "down"} <= c:
        return "plays"
    if "nflId" in c and "displayName" in c and "playId" not in c:
        return "players"
    return None


def _modo(serie: pd.Series):
    m = serie.dropna().mode()
    return m.iloc[0] if not m.empty else None


def _etiqueta_personal(texto) -> str | None:
    """'1 RB, 1 TE, 3 WR' -> '11 personnel'."""
    if not isinstance(texto, str):
        return None
    rb = re.search(r"(\d)\s*RB", texto)
    te = re.search(r"(\d)\s*TE", texto)
    if not rb or not te:
        return None
    return f"{rb.group(1)}{te.group(1)} personnel"


def _zona_alineacion(pos) -> str | None:
    """Agrupa pff_positionLinedUp en zonas legibles."""
    if not isinstance(pos, str):
        return None
    if pos == "QB":
        return "pocket"
    if pos in {"C", "LG", "RG", "LT", "RT"}:
        return "offensive_line"
    if "WR" in pos:
        if pos.startswith("S"):
            return "slot"
        return "wide_left" if pos.startswith("L") else "wide_right"
    if pos.startswith("TE"):
        return "inline_te"
    if pos.startswith(("HB", "FB")):
        return "backfield"
    if pos.startswith("SCB"):
        return "slot_corner"
    if pos in {"LCB", "RCB"}:
        return "outside_corner"
    if pos.startswith(("FS", "SS")):
        return "deep_safety"
    if pos in {"LOLB", "ROLB"}:
        return "edge_linebacker"
    if pos.endswith("LB"):
        return "box_linebacker"
    if pos in {"LE", "RE", "LEO", "REO"}:
        return "edge_rusher"
    return "interior_line"


# ============================================================ tracking
def _agregar_tracking(df: pd.DataFrame, plays: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Resume un bloque de tracking.

    Devuelve:
    - parcial por (nflId, team): sumas y conteos de s y a, y s máxima.
    - separación por (gameId, playId, nflId): distancia al rival más cercano en el frame del pase.
    """
    df = _normalizar_columnas(df)
    for c in TRACKING_OPCIONALES:
        if c not in df.columns:
            df[c] = 0.0
    if "event" not in df.columns:
        df["event"] = np.nan

    jug = df[df["nflId"].notna()]
    s = jug["s"].where(jug["s"] <= MAX_SPEED_VALIDA)
    a = jug["a"].where(jug["a"] <= MAX_ACCEL_VALIDA)
    parcial = (
        pd.DataFrame({"nflId": jug["nflId"].astype("int64"), "team": jug["team"], "s": s, "a": a})
        .groupby(["nflId", "team"])
        .agg(s_sum=("s", "sum"), s_n=("s", "count"), s_max=("s", "max"), a_sum=("a", "sum"), a_n=("a", "count"))
        .reset_index()
    )

    frame_pase = (
        df[df["event"].isin(EVENTOS_PASE)].groupby(["gameId", "playId"])["frameId"].min().rename("frame_pase")
    )
    if frame_pase.empty:
        return parcial, pd.DataFrame(columns=["gameId", "playId", "nflId", "separacion"])

    en_pase = jug.merge(frame_pase.reset_index(), on=["gameId", "playId"])
    en_pase = en_pase[en_pase["frameId"] == en_pase["frame_pase"]]
    en_pase = en_pase.merge(plays[["gameId", "playId", "possessionTeam"]], on=["gameId", "playId"])
    en_pase = en_pase.assign(ofensiva=en_pase["team"] == en_pase["possessionTeam"])[
        ["gameId", "playId", "nflId", "x", "y", "ofensiva"]
    ]
    pares = en_pase.merge(en_pase, on=["gameId", "playId"], suffixes=("", "_r"))
    pares = pares[pares["ofensiva"] != pares["ofensiva_r"]]
    pares = pares.assign(dist=np.hypot(pares["x"] - pares["x_r"], pares["y"] - pares["y_r"]))
    separacion = (
        pares.groupby(["gameId", "playId", "nflId"])["dist"].min().rename("separacion").reset_index()
    )
    separacion["nflId"] = separacion["nflId"].astype("int64")
    return parcial, separacion


# ============================================================ dataset sintético
def _datos_sinteticos(seed: int = 7) -> dict[str, pd.DataFrame]:
    """Dataset pequeño con el mismo esquema que el real, para arrancar sin data/."""
    rng = np.random.default_rng(seed)
    equipos = list(TEAM_NAMES)
    of_pos = ["QB", "WR", "WR", "WR", "TE", "RB", "T", "G", "C", "G", "T"]
    of_roles = ["Pass", "Pass Route", "Pass Route", "Pass Route", "Pass Route", "Pass Route"] + ["Pass Block"] * 5
    of_lined = ["QB", "LWR", "RWR", "SLWR", "TE-R", "HB-R", "LT", "LG", "C", "RG", "RT"]
    de_pos = ["DE", "DT", "DT", "DE", "OLB", "ILB", "OLB", "CB", "CB", "FS", "SS"]
    de_roles = ["Pass Rush"] * 4 + ["Coverage"] * 7
    de_lined = ["LEO", "DLT", "DRT", "REO", "LOLB", "MLB", "ROLB", "LCB", "RCB", "FSL", "SSR"]

    players, plantilla = [], {}
    nid = 10000
    for eq in equipos:
        plantilla[eq] = {"of": [], "de": []}
        for pos in of_pos + de_pos:
            nid += 1
            lado = "of" if len(plantilla[eq]["of"]) < len(of_pos) else "de"
            plantilla[eq][lado].append(nid)
            players.append({"nflId": nid, "height": "6-2", "weight": int(rng.integers(180, 330)),
                            "birthDate": "1996-01-01", "collegeName": "Sintética",
                            "officialPosition": pos, "displayName": f"Jugador {eq} {nid}"})

    games, plays, pff, tracking = [], [], [], []
    rng_eq = rng.permutation(equipos)
    gid_base = 2021090900
    coberturas = list(COBERTURA_CLAVE)[:7]
    for semana in (1, 2):
        orden = rng.permutation(rng_eq)
        for i in range(0, len(orden), 2):
            gid = gid_base + semana * 100 + i // 2
            local, visita = str(orden[i]), str(orden[i + 1])
            games.append({"gameId": gid, "season": 2021, "week": semana, "gameDate": f"09/{8 + 7 * semana}/2021",
                          "gameTimeEastern": "13:00:00", "homeTeamAbbr": local, "visitorTeamAbbr": visita})
            for k in range(12):
                pid = 50 + k * 25
                ofe, defe = (local, visita) if k % 2 == 0 else (visita, local)
                down = int(rng.integers(1, 5))
                ytg = int(rng.integers(1, 15))
                res = int(rng.normal(6, 9))
                lado = ofe if rng.random() < 0.5 else defe
                n_rush = int(rng.choice([4, 4, 4, 5, 6]))
                plays.append({
                    "gameId": gid, "playId": pid, "playDescription": "Jugada sintética", "quarter": int(rng.integers(1, 5)),
                    "down": down, "yardsToGo": ytg, "possessionTeam": ofe, "defensiveTeam": defe,
                    "yardlineSide": lado, "yardlineNumber": int(rng.integers(1, 51)), "gameClock": "10:00",
                    "preSnapHomeScore": int(rng.integers(0, 30)), "preSnapVisitorScore": int(rng.integers(0, 30)),
                    "passResult": str(rng.choice(["C", "I", "S", "IN", "R"], p=[.55, .3, .07, .03, .05])),
                    "penaltyYards": np.nan, "prePenaltyPlayResult": res, "playResult": res,
                    "absoluteYardlineNumber": float(rng.integers(11, 110)),
                    "offenseFormation": str(rng.choice(["SHOTGUN", "EMPTY", "SINGLEBACK"])),
                    "personnelO": str(rng.choice(["1 RB, 1 TE, 3 WR", "1 RB, 2 TE, 2 WR"])),
                    "defendersInBox": float(rng.integers(5, 8)), "personnelD": "4 DL, 2 LB, 5 DB",
                    "dropBackType": "TRADITIONAL", "pff_playAction": int(rng.random() < 0.25),
                    "pff_passCoverage": str(rng.choice(coberturas)),
                    "pff_passCoverageType": str(rng.choice(["Zone", "Man"])),
                })
                presion = rng.random() < 0.3
                for j, nfl in enumerate(plantilla[ofe]["of"]):
                    bloquea = of_roles[j] == "Pass Block"
                    pff.append({"gameId": gid, "playId": pid, "nflId": nfl, "pff_role": of_roles[j],
                                "pff_positionLinedUp": of_lined[j],
                                "pff_hurryAllowed": float(bloquea and presion and j == 6) if bloquea else np.nan,
                                "pff_sackAllowed": 0.0 if bloquea else np.nan})
                for j, nfl in enumerate(plantilla[defe]["de"]):
                    rol = "Pass Rush" if j < n_rush else "Coverage"
                    pff.append({"gameId": gid, "playId": pid, "nflId": nfl, "pff_role": rol,
                                "pff_positionLinedUp": de_lined[j], "pff_hit": 0.0,
                                "pff_hurry": float(presion and j == 0), "pff_sack": 0.0})
                los = float(rng.uniform(20, 90))
                for lado_eq, ids, signo in ((ofe, plantilla[ofe]["of"], -1), (defe, plantilla[defe]["de"], 1)):
                    for nfl in ids:
                        x0, y0 = los + signo * rng.uniform(0.5, 8), rng.uniform(5, 48)
                        vel = rng.uniform(1, 9)
                        for fr in range(1, 21):
                            tracking.append({"gameId": gid, "playId": pid, "nflId": nfl, "frameId": fr,
                                             "team": lado_eq, "x": x0 + fr * 0.08 * vel, "y": y0,
                                             "s": vel * min(1.0, fr / 8), "a": rng.uniform(0, 4),
                                             "o": 90.0, "dir": 90.0,
                                             "event": "ball_snap" if fr == 1 else ("pass_forward" if fr == 18 else np.nan)})
    return {"games": pd.DataFrame(games), "plays": pd.DataFrame(plays), "players": pd.DataFrame(players),
            "pff": pd.DataFrame(pff), "tracking": pd.DataFrame(tracking)}


# ============================================================ carga
def cargar_datos() -> None:
    """Carga todos los CSV/Parquet en data/ y normaliza columnas. Llamada en startup."""
    t0 = time.perf_counter()
    tablas: dict[str, list[pd.DataFrame]] = {}
    tracking_paths: list[Path] = []

    for path in _listar_archivos():
        tipo = _tipo_archivo(_columnas(path))
        if tipo == "tracking":
            tracking_paths.append(path)
        elif tipo:
            df = _leer(path)
            if df is not None:
                tablas.setdefault(tipo, []).append(_normalizar_columnas(df))
        else:
            log.info("Archivo sin esquema reconocido, se omite: %s", path.name)

    base = {k: pd.concat(v, ignore_index=True) for k, v in tablas.items()}
    origen = "data"
    if not {"plays", "players", "pff"} <= base.keys():
        log.warning("data/ no tiene plays, players y pff utilizables: se usa un dataset sintético.")
        base = _datos_sinteticos()
        tracking_paths = []
        origen = "sintetico"
    base.setdefault("games", pd.DataFrame(columns=["gameId", "season", "week", "gameDate", "gameTimeEastern",
                                                    "homeTeamAbbr", "visitorTeamAbbr"]))

    plays = _preparar_plays(base["plays"], base["games"], base["pff"])

    parciales, separaciones = [], []
    bloques = [base["tracking"]] if "tracking" in base else []
    for bloque in bloques:
        p, s = _agregar_tracking(bloque, plays)
        parciales.append(p)
        separaciones.append(s)
    for path in tracking_paths:
        df = _leer(path, usecols=lambda c: _SINONIMOS.get(c, c) in TRACKING_COLS)
        if df is not None:
            p, s = _agregar_tracking(df, plays)
            parciales.append(p)
            separaciones.append(s)

    _DB.clear()
    _DB.update(origen=origen, games=base["games"], plays=plays, pff=base["pff"])
    _construir_tablas(base["players"], base["pff"], plays, parciales, separaciones)
    _preparar_similitud()
    log.info("Datos cargados (%s): %d juegos, %d jugadas, %d jugadores, %d archivos de tracking en %.1f s",
             origen, plays["gameId"].nunique(), len(plays), len(_DB["jugadores"]), len(tracking_paths),
             time.perf_counter() - t0)


def _preparar_plays(plays: pd.DataFrame, games: pd.DataFrame, pff: pd.DataFrame) -> pd.DataFrame:
    p = plays.copy()
    if not games.empty:
        p = p.merge(games[["gameId", "week", "homeTeamAbbr", "visitorTeamAbbr"]], on="gameId", how="left")
    else:
        p["week"] = np.nan
        p["homeTeamAbbr"] = p["visitorTeamAbbr"] = None

    es_local = p["possessionTeam"] == p["homeTeamAbbr"]
    p["score_diff"] = np.where(es_local, p["preSnapHomeScore"] - p["preSnapVisitorScore"],
                               p["preSnapVisitorScore"] - p["preSnapHomeScore"])

    propio = p["yardlineSide"] == p["possessionTeam"]
    p["yards_to_goal"] = np.where(p["yardlineSide"].isna(), 50,
                                  np.where(propio, 100 - p["yardlineNumber"], p["yardlineNumber"]))
    p["field_zone"] = pd.cut(p["yards_to_goal"], bins=[-1, 20, 40, 60, 101],
                             labels=["red_zone", "opponent_territory", "midfield", "own_territory"]).astype(str)
    p["field_zone_code"] = p["field_zone"].map(FIELD_ZONE_CODES).astype(float)

    # Jugada exitosa (definición estándar): 40% de lo que falta en 1ra, 60% en 2da, 100% en 3ra/4ta.
    umbral = np.select([p["down"] == 1, p["down"] == 2, p["down"].isin([3, 4])],
                       [0.4 * p["yardsToGo"], 0.6 * p["yardsToGo"], p["yardsToGo"]], default=np.nan)
    p["success"] = np.where(np.isnan(umbral), np.nan, (p["playResult"] >= umbral).astype(float))
    p["personnel"] = p["personnelO"].map(_etiqueta_personal)

    defensa = pff[pff["pff_role"].isin(["Pass Rush", "Coverage"])]
    cols_presion = [c for c in ("pff_hit", "pff_hurry", "pff_sack") if c in defensa.columns]
    por_jugada = defensa.assign(
        rush=(defensa["pff_role"] == "Pass Rush").astype(int),
        presion=defensa[cols_presion].fillna(0).max(axis=1) if cols_presion else 0,
    ).groupby(["gameId", "playId"]).agg(rushers=("rush", "sum"), pressure=("presion", "max")).reset_index()
    p = p.merge(por_jugada, on=["gameId", "playId"], how="left")
    p["rushers"] = p["rushers"].fillna(0)
    p["pressure"] = p["pressure"].fillna(0)
    p["blitz"] = (p["rushers"] >= 5).astype(float)
    return p


def _construir_tablas(players, pff, plays, parciales, separaciones) -> None:
    # --- tracking por jugador
    if parciales:
        par = pd.concat(parciales, ignore_index=True)
        trk = par.groupby("nflId").agg(s_sum=("s_sum", "sum"), s_n=("s_n", "sum"), s_max=("s_max", "max"),
                                       a_sum=("a_sum", "sum"), a_n=("a_n", "sum"))
        trk["avg_speed"] = trk["s_sum"] / trk["s_n"].replace(0, np.nan)
        trk["avg_accel"] = trk["a_sum"] / trk["a_n"].replace(0, np.nan)
        trk = trk.rename(columns={"s_max": "max_speed"})[["max_speed", "avg_speed", "avg_accel"]]
        eq = par.groupby("team").agg(s_sum=("s_sum", "sum"), s_n=("s_n", "sum"), a_sum=("a_sum", "sum"),
                                     a_n=("a_n", "sum"))
        velocidad_equipo = (eq["s_sum"] / eq["s_n"].replace(0, np.nan)).to_dict()
        liga_s = par["s_sum"].sum() / max(par["s_n"].sum(), 1)
        liga_a = par["a_sum"].sum() / max(par["a_n"].sum(), 1)
    else:
        trk = pd.DataFrame(columns=["max_speed", "avg_speed", "avg_accel"])
        velocidad_equipo, liga_s, liga_a = {}, np.nan, np.nan

    sep = pd.concat(separaciones, ignore_index=True) if separaciones else \
        pd.DataFrame(columns=["gameId", "playId", "nflId", "separacion"])

    # --- participación por jugador (pff + contexto de jugada)
    part = pff[["gameId", "playId", "nflId", "pff_role", "pff_positionLinedUp"]].merge(
        plays[["gameId", "playId", "possessionTeam", "defensiveTeam", "success", "personnel"]],
        on=["gameId", "playId"])
    part["team"] = np.where(part["pff_role"].isin(ROLES_OFENSIVOS), part["possessionTeam"], part["defensiveTeam"])
    part["zona"] = part["pff_positionLinedUp"].map(_zona_alineacion)
    part = part.merge(sep, on=["gameId", "playId", "nflId"], how="left")
    # Separación = distancia del receptor al defensor más cercano al salir el pase. Solo aplica a rutas.
    part.loc[part["pff_role"] != "Pass Route", "separacion"] = np.nan
    _DB["participacion"] = part

    resumen = part.groupby("nflId").agg(
        plays=("playId", "size"),
        team=("team", _modo),
        role=("pff_role", _modo),
        avg_separation=("separacion", "mean"),
    )
    defensivas = pff.groupby("nflId")[[c for c in ("pff_sack", "pff_hurry", "pff_hit") if c in pff.columns]].sum()

    jug = players.set_index("nflId")[["displayName", "officialPosition"]].join(resumen, how="inner")
    jug = jug.join(trk.astype(float), how="left").join(defensivas, how="left")
    for c in ("pff_sack", "pff_hurry", "pff_hit"):
        jug[c] = jug[c].fillna(0) if c in jug.columns else 0.0
    # El dataset sintético es pequeño: ahí basta con haber jugado.
    jug["elegible"] = jug["plays"] >= (MIN_JUGADAS if _DB.get("origen") == "data" else 1)

    # form_index: media de percentiles de velocidad máxima y separación (si corre rutas) dentro de la posición.
    eleg = jug[jug["elegible"]]
    pct_vel = eleg.groupby("officialPosition")["max_speed"].rank(pct=True)
    pct_sep = eleg.groupby("officialPosition")["avg_separation"].rank(pct=True)
    jug["form_index"] = (pd.concat([pct_vel, pct_sep], axis=1).mean(axis=1) * 100).round()
    _DB["jugadores"] = jug

    # --- liga
    rutas = part[part["pff_role"] == "Pass Route"]["separacion"]
    _DB["liga"] = {"avg_speed": liga_s, "avg_acceleration": liga_a, "avg_separation": rutas.mean()}

    # --- equipos
    filas = []
    for eq in sorted(set(plays["possessionTeam"]) | set(plays["defensiveTeam"])):
        of = plays[plays["possessionTeam"] == eq]
        de = plays[plays["defensiveTeam"] == eq]
        de3 = de[de["down"] == 3]
        rz = of[of["field_zone"] == "red_zone"]
        cobertura = de["pff_passCoverage"].map(COBERTURA_CLAVE).value_counts(normalize=True)
        filas.append({
            "team": eq,
            "avg_play_speed": velocidad_equipo.get(eq, np.nan),
            "offensive_efficiency": of["success"].mean(),
            "red_zone_efficiency": rz["success"].mean(),
            "favorite_formation": _modo(of["personnel"]) or _modo(of["offenseFormation"]) or "N/D",
            "pressure_allowed_rate": of["pressure"].mean(),
            "blitz_rate": de["blitz"].mean(),
            "third_down_blitz_rate": de3["blitz"].mean(),
            "man_rate": (de["pff_passCoverageType"] == "Man").mean(),
            "pressure_rate": de["pressure"].mean(),
            "coverage_distribution": {k: round(float(v), 3) for k, v in cobertura.items()},
            "top_coverage": cobertura.index[0] if not cobertura.empty else None,
        })
    _DB["equipos"] = pd.DataFrame(filas).set_index("team")


def _preparar_similitud() -> None:
    p = _DB["plays"]
    validas = p[p["down"].between(1, 4)].reset_index(drop=True)
    X = validas[["down", "yardsToGo", "field_zone_code", "score_diff"]].to_numpy(dtype=float)
    X = np.nan_to_num(X, nan=0.0)
    media, desv = X.mean(axis=0), X.std(axis=0)
    desv[desv == 0] = 1.0
    _DB["sim"] = {"plays": validas, "Z": (X - media) / desv, "media": media, "desv": desv}


def _requiere_datos() -> None:
    if not _DB:
        cargar_datos()


# ============================================================ consultas
def _jugador(player_id: int) -> pd.Series:
    jug = _DB["jugadores"]
    if player_id not in jug.index:
        raise KeyError(f"Jugador {player_id} no encontrado")
    return jug.loc[player_id]


def _equipo_valido(team: str) -> str:
    t = team.upper()
    if t not in _DB["equipos"].index:
        raise KeyError(f"Equipo {team} no encontrado")
    return t


def _top_player(nfl_id: int, r: pd.Series) -> dict:
    return {
        "player_id": int(nfl_id), "display_name": str(r["displayName"]), "team": str(r["team"]),
        "position": str(r["officialPosition"]), "max_speed": _f(r["max_speed"]),
        "avg_separation": _f(r["avg_separation"]),
        # El dataset (solo dropbacks, tracking hasta el pase) no registra yardas después del contacto.
        "avg_yards_after_contact": 0.0,
    }


def _fun_facts(team: str | None) -> list[dict]:
    jug = _DB["jugadores"]
    plays = _DB["plays"]
    eleg = jug[jug["elegible"]]
    if team:
        eleg = eleg[eleg["team"] == team]
        of, de = plays[plays["possessionTeam"] == team], plays[plays["defensiveTeam"] == team]
    else:
        of = de = plays
    donde = f" de {team}" if team else ""
    facts: list[tuple[str, str]] = []

    if eleg["max_speed"].notna().any():
        r = eleg.loc[eleg["max_speed"].idxmax()]
        facts.append(("speed", f"El jugador más rápido{donde} es {r['displayName']} ({r['officialPosition']}, "
                               f"{r['team']}): {r['max_speed']:.2f} yd/s, unas {r['max_speed'] * YD_S_A_MPH:.1f} mph."))
    if eleg["pff_sack"].max() > 0:
        r = eleg.loc[eleg["pff_sack"].idxmax()]
        facts.append(("pass_rush", f"{r['displayName']} ({r['team']}) es el líder{donde} en capturas al QB con "
                                   f"{int(r['pff_sack'])} sacks y {int(r['pff_hurry'])} presiones apuradas."))
    receptores = eleg[eleg["officialPosition"].isin(["WR", "TE"]) & eleg["avg_separation"].notna()]
    if not receptores.empty:
        r = receptores.loc[receptores["avg_separation"].idxmax()]
        facts.append(("separation", f"{r['displayName']} ({r['team']}) es el receptor{donde} que más espacio "
                                    f"consigue: {r['avg_separation']:.2f} yd en promedio cuando sale el pase."))
    if not of.empty:
        r = of.loc[of["playResult"].idxmax()]
        facts.append(("big_play", f"La jugada de pase más larga{donde} ganó {int(r['playResult'])} yardas "
                                  f"({r['possessionTeam']} vs {r['defensiveTeam']}, semana {int(r['week']) if pd.notna(r['week']) else '?'})."))
        con, sin = of[of["pff_playAction"] == 1]["success"].mean(), of[of["pff_playAction"] == 0]["success"].mean()
        if pd.notna(con) and pd.notna(sin):
            facts.append(("play_action", f"Con play action, la ofensiva{donde} tiene éxito en el {con:.0%} de las jugadas; "
                                         f"sin play action, en el {sin:.0%}."))
    if not de.empty:
        dist = de["pff_passCoverage"].value_counts(normalize=True)
        facts.append(("coverage", f"La cobertura más usada{' por ' + team if team else ''} es {dist.index[0]}, "
                                  f"en el {dist.iloc[0]:.0%} de los pases."))
    return [{"id": f"ff_{i:03d}", "text": t, "category": c} for i, (c, t) in enumerate(facts, start=1)]


def get_stats(team: str | None, player_id: int | None) -> dict:
    """Agrega métricas de liga, top players y fun facts."""
    _requiere_datos()
    jug, plays, liga = _DB["jugadores"], _DB["plays"], _DB["liga"]
    t = _equipo_valido(team) if team else None

    if player_id is not None:
        r = _jugador(player_id)
        top = [_top_player(player_id, r)]
        part = _DB["participacion"]
        mias = part[part["nflId"] == player_id]
        total_plays, total_games = len(mias), mias["gameId"].nunique()
    else:
        cand = jug[jug["elegible"] & jug["max_speed"].notna()]
        if t:
            cand = cand[cand["team"] == t]
        top = [_top_player(i, r) for i, r in cand.sort_values("max_speed", ascending=False).head(10).iterrows()]
        sub = plays[(plays["possessionTeam"] == t) | (plays["defensiveTeam"] == t)] if t else plays
        total_plays, total_games = len(sub), sub["gameId"].nunique()

    return {
        "league_averages": {"avg_speed": _f(liga["avg_speed"]), "avg_separation": _f(liga["avg_separation"]),
                            "avg_acceleration": _f(liga["avg_acceleration"])},
        "top_players": top,
        "fun_facts": _fun_facts(t),
        "total_plays": int(total_plays),
        "total_games": int(total_games),
    }


def _tendencias(opp: str) -> list[str]:
    eqs = _DB["equipos"]
    r = eqs.loc[opp]
    out = []
    for col, alto, bajo in (("blitz_rate", "blitz_heavy", "blitz_light"),
                            ("man_rate", "man_heavy", "zone_heavy"),
                            ("pressure_rate", "high_pressure", None)):
        p25, p75 = np.nanpercentile(eqs[col].to_numpy(dtype=float), [25, 75])
        if r[col] >= p75:
            out.append(alto)
        elif bajo and r[col] <= p25:
            out.append(bajo)
    if r["top_coverage"]:
        out.append(r["top_coverage"])
    return out


def get_team_profile(team_abbr: str) -> dict:
    """Devuelve perfil de franquicia con calendario, jugadores clave y estadísticas."""
    _requiere_datos()
    t = _equipo_valido(team_abbr)
    games = _DB["games"]
    juegos = games[(games["homeTeamAbbr"] == t) | (games["visitorTeamAbbr"] == t)].sort_values("week")
    schedule = [{
        "game_id": str(g["gameId"]), "week": int(g["week"]),
        "opponent": g["visitorTeamAbbr"] if g["homeTeamAbbr"] == t else g["homeTeamAbbr"],
        "home": bool(g["homeTeamAbbr"] == t),
        # games.csv no trae el marcador final y plays.csv solo tiene pases, así que no se puede calcular.
        "result": "N/D",
    } for _, g in juegos.iterrows()]

    jug = _DB["jugadores"]
    # Los linieros ofensivos quedan fuera: velocidad y separación no reflejan su rendimiento.
    clave = jug[(jug["team"] == t) & jug["elegible"] & jug["form_index"].notna()
                & ~jug["officialPosition"].isin(POSICIONES_OL)]
    key_players = [{
        "player_id": int(i), "display_name": str(r["displayName"]), "position": str(r["officialPosition"]),
        "max_speed": _f(r["max_speed"]), "avg_separation": _f(r["avg_separation"]),
        "form_index": int(r["form_index"]),
    } for i, r in clave.sort_values("form_index", ascending=False).head(6).iterrows()]

    e = _DB["equipos"].loc[t]
    next_opp = None
    if schedule:
        ultimo = schedule[-1]  # el dataset termina en la semana 8: se usa el último rival registrado
        next_opp = {"team_abbr": ultimo["opponent"], "week": ultimo["week"],
                    "tendencies": _tendencias(ultimo["opponent"])}

    return {
        "team_abbr": t,
        "team_name": TEAM_NAMES.get(t, t),
        "schedule": schedule,
        "key_players": key_players,
        "team_stats": {
            "avg_play_speed": _f(e["avg_play_speed"]),
            "offensive_efficiency": _f(e["offensive_efficiency"], 3),
            "red_zone_efficiency": _f(e["red_zone_efficiency"], 3),
            "favorite_formation": str(e["favorite_formation"]),
        },
        "next_opponent": next_opp,
    }


def _perfil_jugador(player_id: int) -> dict:
    r = _jugador(player_id)
    jug = _DB["jugadores"]
    pares = jug[jug["elegible"] & (jug["role"] == r["role"])]["avg_separation"].to_numpy(dtype=float)
    mias = _DB["participacion"][_DB["participacion"]["nflId"] == player_id]
    zonas = mias["zona"].value_counts().head(2).index.tolist()
    exito = mias.groupby("personnel")["success"].agg(["mean", "size"])
    exito = exito[exito["size"] >= 5]["mean"]
    if r["role"] not in ROLES_OFENSIVOS:
        exito = 1 - exito  # para un defensor, efectividad = jugadas que la ofensiva no convirtió
    return {
        "player_id": int(player_id), "display_name": str(r["displayName"]), "team": str(r["team"]),
        "position": str(r["officialPosition"]),
        "stats": {
            "max_speed": _f(r["max_speed"]), "avg_speed": _f(r["avg_speed"]),
            "avg_separation": _f(r["avg_separation"]),
            "separation_percentile": _percentil_de(r["avg_separation"], pares),
            "favorite_zones": zonas,
            "effectiveness_by_formation": {k: _f(v, 3) for k, v in exito.sort_values(ascending=False).items()},
        },
    }


def _perfil_equipo(t: str) -> dict:
    e = _DB["equipos"].loc[t]
    return {"team": t, "avg_play_speed": _f(e["avg_play_speed"]), "blitz_rate": _f(e["blitz_rate"], 3),
            "third_down_blitz_rate": _f(e["third_down_blitz_rate"], 3),
            "coverage_distribution": e["coverage_distribution"]}


# (stat_key, tipo, plantilla del mensaje). {eq}=equipo, {v}=valor, {p}=percentil.
_METRICAS_DEF = [
    ("blitz_rate", "blitz_tendency", "{eq} manda blitz (5+ rushers) en el {v:.0%} de los pases — percentil {p} de la liga."),
    ("third_down_blitz_rate", "blitz_tendency", "{eq} manda blitz en el {v:.0%} de los pases en 3ra oportunidad — percentil {p} de la liga."),
    ("man_rate", "coverage_tendency", "{eq} juega cobertura de hombre en el {v:.0%} de los pases — percentil {p} de la liga."),
    ("pressure_rate", "pressure_tendency", "La defensiva de {eq} genera presión al QB en el {v:.0%} de los pases — percentil {p} de la liga."),
]


def _alertas_metricas(eq: str, metricas, invertir: bool = False) -> list[dict]:
    """Alerta si el equipo queda en la cola alta (≥p75) de la liga; `invertir` evalúa la cola baja."""
    eqs = _DB["equipos"]
    out = []
    for key, tipo, plantilla in metricas:
        dist = eqs[key].to_numpy(dtype=float)
        v = float(eqs.loc[eq, key])
        if np.isnan(v):
            continue
        p10, p25, p75, p90 = np.nanpercentile(dist, [10, 25, 75, 90])
        pct = _percentil_de(v, dist)
        if invertir:
            sev = "high" if v <= p10 else ("medium" if v <= p25 else None)
        else:
            sev = "high" if v >= p90 else ("medium" if v >= p75 else None)
        if sev:
            out.append({"severity": sev, "type": tipo, "message": plantilla.format(eq=eq, v=v, p=pct),
                        "stat_key": key, "value": _f(v, 3), "percentile": pct})
    return out


def get_scouting(player_id: int | None, team: str | None, opponent: str | None) -> dict:
    """Devuelve perfil de jugador/equipo con alertas por percentil."""
    _requiere_datos()
    t = _equipo_valido(team) if team else None
    opp = _equipo_valido(opponent) if opponent else None
    perfil_j = _perfil_jugador(player_id) if player_id is not None else None
    if t is None and perfil_j and perfil_j["team"] in _DB["equipos"].index:
        t = perfil_j["team"]

    alertas: list[dict] = []
    if opp:
        alertas += _alertas_metricas(opp, _METRICAS_DEF)
        if t:
            alertas += _alertas_metricas(t, [(
                "pressure_allowed_rate", "pressure_allowed",
                "La línea de {eq} permite presión en el {v:.0%} de sus pases — percentil {p} de la liga.")])
    elif t:
        alertas += _alertas_metricas(t, _METRICAS_DEF)
        alertas += _alertas_metricas(t, [(
            "offensive_efficiency", "low_efficiency",
            "La ofensiva de {eq} solo tiene éxito en el {v:.0%} de sus pases — percentil {p} de la liga.")],
            invertir=True)

    if perfil_j:
        jug = _DB["jugadores"]
        r = jug.loc[player_id]
        st = perfil_j["stats"]
        if st["separation_percentile"] >= 75 and r["role"] == "Pass Route":
            alertas.append({"severity": "high" if st["separation_percentile"] >= 90 else "medium",
                            "type": "separation_threat",
                            "message": f"{r['displayName']} genera {st['avg_separation']:.2f} yd de separación "
                                       f"al salir el pase — percentil {st['separation_percentile']} entre receptores.",
                            "stat_key": "avg_separation", "value": st["avg_separation"],
                            "percentile": st["separation_percentile"]})
        if opp and r["role"] in ROLES_OFENSIVOS and pd.notna(r["max_speed"]):
            cbs = jug[(jug["team"] == opp) & jug["elegible"] & (jug["officialPosition"] == "CB")]["max_speed"]
            if cbs.notna().any():
                diff = float(r["max_speed"] - cbs.mean())
                misma_pos = jug[jug["elegible"] & (jug["officialPosition"] == r["officialPosition"])]["max_speed"]
                pct = _percentil_de(r["max_speed"], misma_pos.to_numpy(dtype=float))
                if diff > 0.5:
                    alertas.append({"severity": "high" if diff > 1.0 else "medium", "type": "speed_advantage",
                                    "message": f"{r['displayName']} es {diff:.2f} yd/s más rápido que el promedio "
                                               f"de los esquineros de {opp} (velocidad máxima).",
                                    "stat_key": "speed_mismatch", "value": _f(diff), "percentile": pct})

    orden = {"high": 0, "medium": 1, "low": 2}
    alertas.sort(key=lambda a: (orden[a["severity"]], -a["percentile"]))
    for i, a in enumerate(alertas, start=1):
        a["id"] = f"alert_{i:03d}"

    return {"player_profile": perfil_j, "team_profile": _perfil_equipo(t) if t else None,
            "critical_alerts": alertas}


def buscar_jugadas_similares(contexto: dict, top_n: int = 20) -> pd.DataFrame:
    """Busca las jugadas históricas más cercanas por distancia euclidiana en el espacio
    (down, yards_to_go, field_zone codificado, score_diff), con penalización si cambia
    el equipo ofensivo o la formación pedida."""
    _requiere_datos()
    sim = _DB["sim"]
    zona = contexto.get("field_zone")
    q = np.array([
        float(contexto.get("down", 1)),
        float(contexto.get("yards_to_go", 10)),
        float(FIELD_ZONE_CODES.get(zona, 1)) if isinstance(zona, str) else float(zona if zona is not None else 1),
        float(contexto.get("score_diff", 0)),
    ])
    zq = (q - sim["media"]) / sim["desv"]
    d2 = np.sum((sim["Z"] - zq) ** 2, axis=1)

    plays = sim["plays"]
    equipo = contexto.get("offense_team")
    if equipo:
        d2 = d2 + (plays["possessionTeam"].to_numpy() != str(equipo).upper()).astype(float)
    formacion = contexto.get("formation")
    if formacion:
        f = str(formacion)
        coincide = (plays["personnel"].to_numpy() == f) | (plays["offenseFormation"].to_numpy() == f.upper())
        d2 = d2 + (~coincide).astype(float)

    n = int(min(max(top_n, 1), len(plays)))
    idx = np.argsort(d2, kind="stable")[:n]
    return plays.iloc[idx].assign(distancia=np.sqrt(d2[idx])).reset_index(drop=True)
