"""Copiloto IA: agente Strands sobre Amazon Bedrock (Nova) con respaldo heurístico local.

- Modo "coach": diagnostica la jugada de la pizarra y propone ajustes (`suggested_players`).
- Modo "fan": explica en lenguaje sencillo y puede llevar al usuario a otra vista (`navigate_to`).
Si Bedrock falla, no tiene credenciales o tarda demasiado, `_fallback_heuristico` responde con
reglas locales y datos reales del dataset (`ai_available: false`). La app nunca depende de la IA.
"""
from __future__ import annotations

import contextvars
import logging
import os
import re
import threading
from concurrent.futures import ThreadPoolExecutor

import boto3
from strands import Agent, tool
from strands.models.bedrock import BedrockModel

from backend import data_engine, sim_engine

log = logging.getLogger("xo.ai_agent")

MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "us.amazon.nova-pro-v1:0")
REGION = os.environ.get("AWS_REGION", "us-east-1")
TIEMPO_MAX_IA_S = 25  # pasado este tiempo se responde con el respaldo local

VISTAS = ("board", "scouting", "stats", "team", "challenge", "rankings", "academy")
EQUIPOS_DEFECTO = ("KC", "SF")  # si la jugada de la pizarra no trae equipos

# Estado de la petición en curso: las herramientas lo modifican (contextvars se copia a los hilos de Strands).
_estado: contextvars.ContextVar[dict | None] = contextvars.ContextVar("xo_chat_estado", default=None)
_ejecutor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="xo-ia")
_lock_modelo = threading.Lock()
_modelo_cache: BedrockModel | None = None


def _crear_cliente_bedrock():
    return boto3.client("bedrock-runtime", region_name=REGION)
    # Sin llaves explícitas. En AWS: rol de tarea. En local: .env cargado por cargar_env().


def _modelo() -> BedrockModel:
    """BedrockModel con el cliente creado solo con la región (BedrockModel no recibe un cliente
    en el constructor, así que se reemplaza el suyo)."""
    global _modelo_cache
    with _lock_modelo:
        if _modelo_cache is None:
            m = BedrockModel(model_id=MODEL_ID, region_name=REGION)
            m.client = _crear_cliente_bedrock()
            _modelo_cache = m
        return _modelo_cache


def _fuente(nombre: str) -> None:
    e = _estado.get()
    if e is not None:
        e["fuentes"].add(nombre)


# ============================================================ herramientas del agente
@tool
def consultar_estadisticas(team: str | None = None, player_id: int | None = None) -> dict:
    """Consulta métricas agregadas del dataset NFL (temporada 2021, semanas 1-8, solo jugadas de pase)
    para toda la liga, un equipo (abreviatura, ej. "KC") o un jugador (nflId). Devuelve promedios de
    liga, los jugadores más rápidos y datos curiosos."""
    _fuente("player_tracking")
    try:
        s = data_engine.get_stats(team=team.upper() if team else None, player_id=player_id)
    except KeyError as exc:
        return {"error": str(exc.args[0])}
    top = [{k: v for k, v in p.items() if k != "avg_yards_after_contact"} for p in s["top_players"][:5]]
    return {"league_averages": s["league_averages"], "top_players": top,
            "fun_facts": [f["text"] for f in s["fun_facts"]],
            "total_plays": s["total_plays"], "total_games": s["total_games"],
            "unidades": "velocidades en yardas/segundo, separación en yardas"}


@tool
def obtener_alertas_scouting(team: str, opponent: str | None = None) -> dict:
    """Devuelve el perfil de un equipo y sus alertas críticas basadas en percentiles.
    Si se indica opponent, las alertas describen las tendencias de ese rival (blitz, coberturas, presión)."""
    _fuente("coverage_analysis")
    try:
        r = data_engine.get_scouting(player_id=None, team=team.upper(), opponent=opponent.upper() if opponent else None)
    except KeyError as exc:
        return {"error": str(exc.args[0])}
    return {"team_profile": r["team_profile"], "critical_alerts": [a["message"] for a in r["critical_alerts"]]}


@tool
def simular_jugada(players: list[dict], game_context: dict) -> dict:
    """Ejecuta una simulación cinemática y devuelve efectividad + factores.
    players: lista con player_id, role (QB, WR1, TE, CB1, ...), team ("offense" o "defense"),
    x (0-120), y (0-53.3), route opcional (post, curl, slant, fly, out, cross, screen) y coverage
    opcional (man, zone, press). game_context: down, yards_to_go, field_zone (own_territory,
    midfield, opponent_territory, red_zone), quarter y score_diff."""
    _fuente("simulation")
    e = _estado.get() or {}
    of, de = e.get("equipos") or EQUIPOS_DEFECTO
    body = {"game_context": game_context, "offense_team": of, "defense_team": de, "players": players}
    try:
        r = sim_engine.simular_completo(sim_engine.como_request(body), registrar=False)
    except (ValueError, KeyError) as exc:
        return {"error": str(exc.args[0]) if exc.args else "Jugada inválida"}
    eff = r["effectiveness"]
    if e.get("modo") == "coach" and e.get("actuales"):
        _registrar_mejora(e, eff["score"], players)
    return {"effectiveness": eff["score"], "label": eff["label"], "factors": eff["factors"],
            "similar_plays_found": r["similar_plays_found"]}


@tool
def navegar_a(vista: str) -> dict:
    """Indica al frontend que navegue a una vista específica.
    Valores: board (pizarra), scouting, stats (estadísticas), team (mi equipo), challenge (reto),
    rankings, academy (academia para aprender desde cero)."""
    v = vista.strip().lower()
    if v not in VISTAS:
        return {"error": f"Vista no válida. Usa una de: {', '.join(VISTAS)}"}
    e = _estado.get()
    if e is not None:
        e["navigate_to"] = v
    return {"navigate_to": v}


def _registrar_mejora(e: dict, score: float, players: list[dict]) -> None:
    """Guarda como sugerencia los jugadores que cambian respecto a la pizarra si la efectividad mejora."""
    if score <= max(e.get("mejor_score") or 0.0, (e.get("efectividad_actual") or 0.0) + 0.01):
        return
    cambios = []
    for p in players:
        a = e["actuales"].get(p.get("player_id"))
        if a is None:
            continue
        if (abs(float(p.get("x", a["x"])) - a["x"]) > 0.05 or abs(float(p.get("y", a["y"])) - a["y"]) > 0.05
                or (p.get("route") or None) != (a.get("route") or None)):
            s = {"player_id": int(p["player_id"]), "x": round(float(p["x"]), 2), "y": round(float(p["y"]), 2)}
            if p.get("route"):
                s["route"] = p["route"]
            cambios.append(s)
    if cambios:
        e["mejor_score"], e["sugeridos"] = score, cambios


# ============================================================ prompts
SYSTEM_COACH = """Eres un analista táctico de élite de la NFL con acceso a datos reales de tracking.
Responde de forma técnica y precisa. Cuando propongas cambios en la pizarra, incluye coordenadas
exactas (x, y) y el tipo de ruta en el campo `suggested_players`. Usa las herramientas disponibles
antes de responder para basar tu análisis en datos reales del dataset.

Reglas adicionales:
- Responde en español, en 3 a 6 oraciones.
- Los datos cubren la temporada 2021, semanas 1 a 8, y solo jugadas de pase. No inventes cifras.
- El contexto incluye el diagnóstico de la jugada de la pizarra y, si existe, la mejora que encontró el
  optimizador. El sistema envía esas coordenadas a la pizarra: explícalas en lenguaje de entrenador.
- Para probar otra idea usa simular_jugada con los jugadores de la pizarra modificados."""

SYSTEM_FAN = """Eres un guía amigable y apasionado del fútbol americano.
Explica las jugadas en lenguaje sencillo, usa analogías cotidianas y fomenta la participación.
Si el usuario pregunta por estadísticas, usa la herramienta correspondiente.
Si menciona querer ver otra sección de la app, usa navegar_a() con el destino correcto.

Reglas adicionales:
- Responde en español, en 2 a 5 oraciones, sin tecnicismos sin explicar.
- Si el usuario dice que no entiende el juego o quiere aprender desde cero, usa navegar_a("academy").
- Los datos cubren la temporada 2021, semanas 1 a 8, y solo jugadas de pase. No inventes cifras."""


# ============================================================ contexto de la petición
_RE_PLAY_REF = re.compile(r"^sim_([a-z]{2,3})_([a-z]{2,3})_([1-4])(?:st|nd|rd|th)(\d+)_")


def _cuerpo_jugada(current_play: dict | None, fan_team: str | None) -> dict | None:
    """Reconstruye la jugada de la pizarra: contexto del historial del simulador (o del play_id_ref)
    y posiciones actuales enviadas por el dashboard."""
    if not isinstance(current_play, dict):
        return None
    jugadores = current_play.get("players") or []
    ref = current_play.get("play_id_ref")
    body = sim_engine.historial(ref)
    if body is None:
        m = _RE_PLAY_REF.match(str(ref or ""))
        of, de = (m.group(1).upper(), m.group(2).upper()) if m else ((fan_team or EQUIPOS_DEFECTO[0]), EQUIPOS_DEFECTO[1])
        body = {"game_context": {"down": int(m.group(3)) if m else 1, "yards_to_go": int(m.group(4)) if m else 10,
                                 "field_zone": "midfield", "quarter": 2, "score_diff": 0},
                "offense_team": of, "defense_team": de, "players": []}
    if jugadores:
        body["players"] = [{k: p.get(k) for k in ("player_id", "role", "team", "x", "y", "route", "coverage")}
                           for p in jugadores if isinstance(p, dict)]
    return body if body["players"] else None


def _preparar(request) -> dict:
    ctx = request.context
    estado = {"modo": request.mode, "navigate_to": None, "sugeridos": [], "mejor_score": None,
              "fuentes": set(), "equipos": None, "efectividad_actual": None, "diagnostico": None,
              "optimizacion": None, "actuales": {}, "fan_team": (ctx.fan_team.upper() if ctx and ctx.fan_team else None),
              "vista": ctx.current_view if ctx else None, "body": None}
    if request.mode != "coach" or not ctx:
        return estado
    body = _cuerpo_jugada(ctx.current_play, estado["fan_team"])
    if body is None:
        return estado
    try:
        r = sim_engine.simular_completo(sim_engine.como_request(body), registrar=False)
        opt = sim_engine.optimizar(body)
    except (ValueError, KeyError) as exc:
        log.info("No se pudo diagnosticar la jugada de la pizarra: %s", exc)
        return estado
    estado.update(body=body, equipos=(body["offense_team"], body["defense_team"]),
                  efectividad_actual=r["effectiveness"]["score"], diagnostico=r["effectiveness"],
                  optimizacion=opt, actuales={p["player_id"]: p for p in body["players"]})
    estado["fuentes"].add("simulation")
    if opt and opt["cambio"]:
        c = opt["cambio"]
        estado["sugeridos"] = [{"player_id": c["player_id"], "x": c["x"], "y": c["y"], "route": c["route"]}]
        estado["mejor_score"] = opt["mejor"]
    return estado


def _texto_contexto(estado: dict) -> str:
    lineas = [f"Modo: {estado['modo']}. Vista actual: {estado['vista'] or 'desconocida'}."]
    if estado["fan_team"]:
        lineas.append(f"Equipo favorito del aficionado: {estado['fan_team']}.")
    if estado["diagnostico"]:
        b = estado["body"]
        g = b["game_context"]
        d = estado["diagnostico"]
        factores = "; ".join(f"{f['name']} {f['value']:+.2f} ({f['impact']})" for f in d["factors"])
        lineas.append(f"Jugada en la pizarra: {b['offense_team']} ataca a {b['defense_team']}, down {g['down']} y "
                      f"{g['yards_to_go']}, zona {g['field_zone']}. Efectividad simulada {d['label']}. "
                      f"Factores normalizados entre -3 y 3: {factores}.")
        jug = "; ".join(f"{p['role']} id {p['player_id']} ({p['team']}) en ({p['x']}, {p['y']})"
                        + (f" ruta {p['route']}" if p.get("route") else "")
                        + (f" cobertura {p['coverage']}" if p.get("coverage") else "") for p in b["players"])
        lineas.append(f"Jugadores: {jug}.")
        lineas.append(f"Contexto para simular_jugada: {g}.")
        o = estado["optimizacion"]
        if o and o["cambio"]:
            c = o["cambio"]
            lineas.append(f"Mejora encontrada por el optimizador: el {c['role']} (id {c['player_id']}) pasa a ruta "
                          f"{c['route']} en ({c['x']}, {c['y']}); la efectividad sube de {o['base']:.0%} a {o['mejor']:.0%}.")
        elif o:
            lineas.append("El optimizador no encontró un cambio de ruta que mejore la jugada.")
    return "\n".join(lineas)


# ============================================================ respuesta principal
def responder(request) -> dict:
    system = SYSTEM_COACH if request.mode == "coach" else SYSTEM_FAN
    estado = _preparar(request)
    token = _estado.set(estado)
    try:
        try:
            prompt = f"{_texto_contexto(estado)}\n\nMensaje del usuario: {request.message}"

            def _ejecutar() -> str:
                agent = Agent(model=_modelo(), system_prompt=system, callback_handler=None, tools=[
                    consultar_estadisticas, obtener_alertas_scouting, simular_jugada, navegar_a,
                ])
                return str(agent(prompt)).strip()

            futuro = _ejecutor.submit(contextvars.copy_context().run, _ejecutar)
            reply = futuro.result(timeout=TIEMPO_MAX_IA_S)
            if not reply:
                raise ValueError("respuesta vacía del modelo")
        except Exception as exc:  # sin credenciales, sin red, límite de tiempo (FuturesTimeout), etc.
            log.warning("Bedrock no disponible (%s): se usa el respaldo heurístico.", type(exc).__name__)
            return _fallback_heuristico(request, estado)
        navigate = estado["navigate_to"] or _detectar_vista(request.message)
        fuentes = sorted(estado["fuentes"]) or ["amazon_bedrock"]
        return {"reply": reply, "suggested_players": estado["sugeridos"] if request.mode == "coach" else [],
                "navigate_to": navigate, "data_sources": fuentes, "ai_available": True}
    finally:
        _estado.reset(token)


# ============================================================ respaldo heurístico
_PALABRAS_VISTA = {
    "board": ("pizarra", "tablero", "board", "simulador"),
    "scouting": ("scouting", "alertas", "rival", "oponente"),
    "stats": ("estadística", "estadistica", "stats", "curiosidades", "sabías qué", "sabias que"),
    "team": ("mi equipo", "equipo favorito", "calendario", "franquicia"),
    "challenge": ("reto", "desafío", "desafio", "challenge"),
    "rankings": ("ranking", "clasificación", "clasificacion", "tabla de líderes", "leaderboard", "posiciones"),
    "academy": ("academia", "tutorial", "glosario", "diccionario"),
}
_INTENCION_IR = ("ir a", "ir al", "llév", "llev", "lleva", "muéstrame", "muestrame", "abre", "abrir", "quiero ver",
                 "ve a", "vamos a", "navega", "enséñame", "enseñame", "pasa a", "cambia a", "abrir la", "ver la", "ver el")
_DESDE_CERO = ("desde cero", "no entiendo", "no sé nada", "no se nada", "soy nuevo", "soy nueva", "principiante",
               "cómo se juega", "como se juega", "reglas básicas", "reglas basicas", "aprender lo básico",
               "aprender lo basico", "explícame el juego", "explicame el juego")


def _detectar_vista(mensaje: str) -> str | None:
    t = mensaje.lower()
    if any(p in t for p in _DESDE_CERO):
        return "academy"
    if not any(p in t for p in _INTENCION_IR):
        return None
    for vista, palabras in _PALABRAS_VISTA.items():
        if any(p in t for p in palabras):
            return vista
    return None


GLOSARIO = [
    (("separación", "separacion", "separation"), "La separación es la distancia entre el receptor y el defensor más cercano cuando sale el pase.",
     "Es como el hueco que te deja el portero: mientras más grande, más fácil meter el balón."),
    (("air yards", "yardas aéreas", "yardas aereas"), "Las yardas aéreas son las que viaja el balón en el aire desde la línea de golpeo hasta el receptor.",
     "Es la parte del viaje que haces en avión; lo que caminas después del aterrizaje ya no cuenta."),
    (("yards after contact", "yardas después del contacto", "yardas despues del contacto"),
     "Las yardas después del contacto son las que gana el jugador tras ser tocado por el primer defensor.",
     "Es como seguir avanzando en el metro en hora pico aunque ya te estén empujando."),
    (("blitz",), "Un blitz es cuando la defensa manda a 5 o más jugadores a presionar al mariscal.",
     "Es como si en una fiesta todos se lanzan por la última rebanada de pizza: llegan rápido, pero dejan la mesa sola."),
    (("cobertura de hombre", "man coverage", "hombre a hombre"), "En cobertura de hombre cada defensor sigue a un receptor específico a donde vaya.",
     "Es como marcar personal en el fútbol: tu sombra te sigue toda la jugada."),
    (("zona roja", "red zone"), "La zona roja son las últimas 20 yardas antes de la zona de anotación.",
     "Es el área chica del fútbol: hay menos espacio y la defensa se cierra."),
    (("cobertura de zona", "zona", "zone"), "En cobertura de zona cada defensor cuida un área del campo y marca a quien entre en ella.",
     "Es como repartir la casa para limpiar: tú cuidas la cocina, yo la sala."),
    (("play action", "play-action", "finta"), "El play action es fingir una carrera para luego lanzar el pase.",
     "Es el clásico 'amague' antes del regate: la defensa muerde y se abre el espacio."),
    (("sack", "captura"), "Un sack ocurre cuando derriban al mariscal con el balón antes de que lance.",
     "Es como si te quitaran el control del videojuego justo antes de disparar."),
    (("presión", "presion", "hurry"), "La presión es cuando un defensor obliga al mariscal a lanzar antes de tiempo o a moverse.",
     "Es como hacer un examen con el maestro parado junto a tu banca."),
    (("down", "downs"), "La ofensiva tiene 4 oportunidades (downs) para avanzar 10 yardas; si lo logra, se reinicia la cuenta.",
     "Es como tener 4 intentos para subir un nivel del videojuego antes de pasarle el control al rival."),
    (("pocket", "bolsillo"), "El pocket es el espacio que la línea ofensiva protege alrededor del mariscal.",
     "Es como el paraguas que te cubre mientras buscas a quién pasarle el balón."),
    (("scramble",), "Un scramble es cuando el mariscal sale corriendo del pocket porque no encuentra a quién lanzar.",
     "Es improvisar: el plan A no salió y toca resolver sobre la marcha."),
    (("slot",), "El slot es la posición del receptor que se alinea entre la línea ofensiva y el receptor abierto.",
     "Es el carril central de la avenida: hay más tráfico, pero llegas más rápido."),
    (("efectividad",), "La efectividad de X&O Engine estima la probabilidad de que la jugada tenga éxito según separación, presión, cierre defensivo, contexto y emparejamiento.",
     "Es como el pronóstico del clima: no garantiza nada, pero te dice si conviene llevar paraguas."),
]


def _equipo_en(mensaje: str) -> str | None:
    validos = set(data_engine.TEAM_NAMES)
    for m in re.findall(r"\b([A-Z]{2,3})\b", mensaje):
        if m in validos and data_engine.equipo_existe(m):
            return m
    t = mensaje.lower()
    for abbr, nombre in data_engine.TEAM_NAMES.items():
        apodo = nombre.split()[-1].lower()
        if apodo == "team":
            apodo = "washington"
        if re.search(rf"\b{re.escape(apodo)}\b", t) and data_engine.equipo_existe(abbr):
            return abbr
    return None


def _respuesta_fan(mensaje: str, estado: dict) -> tuple[str, set[str]]:
    t = mensaje.lower()
    for palabras, definicion, analogia in GLOSARIO:
        if any(re.search(rf"\b{re.escape(p)}\b", t) for p in palabras):
            return f"{definicion} {analogia}", {"glossary"}
    equipo = _equipo_en(mensaje) or (estado["fan_team"] if "mi equipo" in t else None)
    if any(p in t for p in ("rápido", "rapido", "velocidad", "veloz")):
        s = data_engine.get_stats(team=equipo, player_id=None)
        if s["top_players"]:
            p = s["top_players"][0]
            mph = p["max_speed"] * data_engine.YD_S_A_MPH
            donde = f" de {equipo}" if equipo else " de la liga"
            return (f"El jugador más rápido{donde} es {p['display_name']} ({p['position']}, {p['team']}): "
                    f"{p['max_speed']:.2f} yardas por segundo, unas {mph:.1f} mph. Es más rápido que un coche "
                    f"en una calle de colonia."), {"player_tracking"}
    s = data_engine.get_stats(team=equipo, player_id=None)
    hechos = {f["category"]: f["text"] for f in s["fun_facts"]}
    for palabras, cat in ((("sack", "captura", "presión", "presion"), "pass_rush"), (("separ",), "separation"),
                          (("cobertura", "defensa"), "coverage"), (("play action",), "play_action"),
                          (("larga", "más larga", "mas larga"), "big_play")):
        if any(p in t for p in palabras) and cat in hechos:
            return hechos[cat], {"player_tracking"}
    if equipo:
        e = data_engine.get_team_profile(equipo)
        ts = e["team_stats"]
        return (f"{e['team_name']} tiene éxito en el {ts['offensive_efficiency']:.0%} de sus pases y su personal "
                f"favorito es «{ts['favorite_formation']}». {next(iter(hechos.values()), '')}"), {"player_tracking"}
    extra = list(hechos.values())[:2]
    return ("Puedo contarte datos curiosos de la liga o explicarte cualquier término. " + " ".join(extra)
            + " Si quieres empezar desde cero, pídeme ir a la Academia."), {"player_tracking"}


def _respuesta_coach(mensaje: str, estado: dict) -> tuple[str, set[str]]:
    d = estado["diagnostico"]
    if d:
        orden = sim_engine.factores_ordenados(d)
        peor, mejor = orden[0], orden[-1]
        partes = [f"La jugada simulada tiene una efectividad de {d['label']}."]
        if peor["impact"] == "negative":
            partes.append(f"Lo que más resta es «{peor['name']}» ({peor['value']:+.2f} en escala de -3 a 3).")
        if mejor["impact"] == "positive":
            partes.append(f"Lo que más ayuda es «{mejor['name']}» ({mejor['value']:+.2f}).")
        o = estado["optimizacion"]
        if o and o["cambio"]:
            c = o["cambio"]
            antes = f" en lugar de {c['ruta_anterior']}" if c.get("ruta_anterior") else ""
            partes.append(f"Ajuste sugerido: el {c['role']} corre {c['route']}{antes} desde ({c['x']}, {c['y']}); "
                          f"la efectividad sube de {o['base']:.0%} a {o['mejor']:.0%}. Ya lo marqué en la pizarra.")
        elif o:
            partes.append("No encontré un cambio de ruta que mejore la jugada; prueba mover la formación o el contexto.")
        return " ".join(partes), {"simulation"}
    equipo = _equipo_en(mensaje)
    if equipo:
        r = data_engine.get_scouting(player_id=None, team=None, opponent=equipo)
        alertas = [a["message"] for a in r["critical_alerts"][:3]]
        if alertas:
            return "Alertas sobre " + equipo + ": " + " ".join(alertas), {"coverage_analysis"}
        tp = data_engine.get_scouting(player_id=None, team=equipo, opponent=None)["team_profile"]
        return (f"{equipo} manda blitz en el {tp['blitz_rate']:.0%} de los pases y en el "
                f"{tp['third_down_blitz_rate']:.0%} en 3ra oportunidad; no destaca en ningún percentil extremo."), \
            {"coverage_analysis"}
    return ("Coloca a tus jugadores en la pizarra y pulsa Simular; después pregúntame por qué funcionó o falló "
            "la jugada y te propongo un ajuste. También puedo darte alertas de un rival si me dices su abreviatura "
            "(por ejemplo, BUF)."), set()


def _fallback_heuristico(request, estado: dict | None = None) -> dict:
    """Genera una respuesta útil basada en reglas sin usar IA."""
    estado = estado or _preparar(request)
    navigate = _detectar_vista(request.message)
    destinos = {"board": "a la pizarra", "scouting": "a scouting", "stats": "a las estadísticas",
                "team": "a tu equipo", "challenge": "al reto", "rankings": "a los rankings",
                "academy": "a la Academia NFL"}
    if navigate and request.mode == "fan":
        extra = (" Ahí verás cómo se juega paso a paso: cuartos, downs y jugadas básicas animadas."
                 if navigate == "academy" else "")
        return {"reply": f"Te llevo {destinos[navigate]}.{extra}", "suggested_players": [],
                "navigate_to": navigate, "data_sources": ["heuristic"], "ai_available": False}
    try:
        if request.mode == "coach":
            reply, fuentes = _respuesta_coach(request.message, estado)
        else:
            reply, fuentes = _respuesta_fan(request.message, estado)
    except Exception as exc:  # el respaldo nunca debe tumbar el chat
        log.exception("Error en el respaldo heurístico: %s", type(exc).__name__)
        reply, fuentes = "Ahora mismo no puedo consultar los datos; inténtalo de nuevo en unos segundos.", set()
    if navigate:
        reply = f"Te llevo {destinos[navigate]}. " + reply
    return {"reply": reply, "suggested_players": estado["sugeridos"] if request.mode == "coach" else [],
            "navigate_to": navigate, "data_sources": sorted(fuentes) + ["heuristic"], "ai_available": False}
