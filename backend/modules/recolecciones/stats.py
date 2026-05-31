"""
Módulo de estadísticas y datos para gráficos.
Agrega datos de detalle_recoleccion + materiales + recolecciones.
"""
from __future__ import annotations
from collections import defaultdict
from datetime import date, timedelta
from shared import database as db


MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]


def _fetch_detalles(empresa_id: str | None = None) -> list[dict]:
    """Trae todos los detalles de recolecciones aprobadas, con material y empresa."""
    params = (
        "select=cantidad,material_id,"
        "materiales(nombre,color_hex),"
        "recolecciones(empresa_id,fecha_recoleccion,estado,empresas(nombre))"
        "&recolecciones.estado=eq.APROBADO"
        "&limit=2000"
    )
    if empresa_id:
        params += f"&recolecciones.empresa_id=eq.{empresa_id}"
    rows = db.get("detalle_recoleccion", params)
    # Filtrar solo los que tienen recoleccion APROBADA (la API REST puede no filtrar nested)
    return [
        r for r in rows
        if r.get("recolecciones") and r["recolecciones"].get("estado") == "APROBADO"
        and (not empresa_id or r["recolecciones"].get("empresa_id") == empresa_id)
    ]


def _monthly_key(fecha: str) -> str:
    """YYYY-MM a nombre legible."""
    try:
        y, m, *_ = fecha.split("-")
        return f"{MESES[int(m)-1]} {y}"
    except Exception:
        return fecha


def _months_range(desde: date | None = None, meses: int = 12) -> list[str]:
    """Genera lista de meses desde `desde` (o hace N meses) hasta hoy."""
    today = date.today()
    if desde:
        # Incluir desde la fecha más antigua en los datos
        start = date(desde.year, desde.month, 1)
    else:
        # Últimos N meses
        month = today.month - meses + 1
        year  = today.year
        while month <= 0:
            month += 12
            year  -= 1
        start = date(year, month, 1)

    result = []
    cur = start
    while cur <= date(today.year, today.month, 1):
        result.append(f"{MESES[cur.month-1]} {cur.year}")
        # Avanzar un mes
        m, y = cur.month + 1, cur.year
        if m > 12:
            m, y = 1, y + 1
        cur = date(y, m, 1)
    return result


def get_empresa_stats(empresa_id: str) -> dict:
    """Estadísticas para una empresa: monthly + por material."""
    rows = _fetch_detalles(empresa_id)

    # Acumular por mes y por material
    monthly: dict[str, float] = defaultdict(float)
    por_material: dict[str, dict] = {}  # nombre -> {kg, color}

    for r in rows:
        fecha  = r["recolecciones"]["fecha_recoleccion"]
        mat    = r.get("materiales") or {}
        nombre = mat.get("nombre", "Otro")
        color  = mat.get("color_hex", "#9ca3af")
        kg     = float(r.get("cantidad") or 0)

        clave = _monthly_key(fecha)
        monthly[clave] += kg

        if nombre not in por_material:
            por_material[nombre] = {"kg": 0, "color": color}
        por_material[nombre]["kg"] += kg

    # Detectar mes más antiguo con datos para ajustar rango
    todas_fechas = [
        r["recolecciones"]["fecha_recoleccion"]
        for r in rows if r.get("recolecciones") and r["recolecciones"].get("fecha_recoleccion")
    ]
    desde = None
    if todas_fechas:
        min_fecha_str = min(todas_fechas)
        try:
            desde = date.fromisoformat(min_fecha_str)
        except Exception:
            pass
    meses = _months_range(desde=desde)
    monthly_series = [{"mes": m, "kg": round(monthly.get(m, 0), 2)} for m in meses]

    materiales = [
        {"nombre": k, "kg": round(v["kg"], 2), "color": v["color"]}
        for k, v in sorted(por_material.items(), key=lambda x: -x[1]["kg"])
    ]

    total_kg = round(sum(r["kg"] for r in materiales), 2)

    return {
        "monthly": monthly_series,
        "materiales": materiales,
        "total_kg": total_kg,
    }


def get_admin_stats() -> dict:
    """Estadísticas globales: todas las empresas, desglose por empresa y por material."""
    rows = _fetch_detalles()

    # Por mes + total
    monthly: dict[str, float] = defaultdict(float)
    # Por mes + empresa
    monthly_empresa: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    # Por material (global)
    por_material: dict[str, dict] = {}
    # Por empresa (total)
    por_empresa: dict[str, float] = defaultdict(float)

    empresas_colores: dict[str, str] = {}
    COLORES = ["#1e9070","#43b349","#0284c7","#d97706","#7c3aed","#dc2626","#0891b2","#ea580c"]

    for r in rows:
        rec    = r["recolecciones"]
        fecha  = rec["fecha_recoleccion"]
        emp    = (rec.get("empresas") or {})
        emp_nombre = emp.get("nombre") or rec.get("empresa_id") or "Sin empresa"
        mat    = r.get("materiales") or {}
        mat_nombre = mat.get("nombre", "Otro")
        color  = mat.get("color_hex", "#9ca3af")
        kg     = float(r.get("cantidad") or 0)
        clave  = _monthly_key(fecha)

        monthly[clave] += kg
        monthly_empresa[clave][emp_nombre] += kg
        por_empresa[emp_nombre] += kg

        if mat_nombre not in por_material:
            por_material[mat_nombre] = {"kg": 0, "color": color}
        por_material[mat_nombre]["kg"] += kg

        if emp_nombre not in empresas_colores:
            idx = len(empresas_colores) % len(COLORES)
            empresas_colores[emp_nombre] = COLORES[idx]

    # Rango real de datos
    todas_fechas = [
        r["recolecciones"]["fecha_recoleccion"]
        for r in rows if r.get("recolecciones") and r["recolecciones"].get("fecha_recoleccion")
    ]
    desde = None
    if todas_fechas:
        try:
            desde = date.fromisoformat(min(todas_fechas))
        except Exception:
            pass
    meses = _months_range(desde=desde)

    # Series mensuales globales
    monthly_series = [{"mes": m, "kg": round(monthly.get(m, 0), 2)} for m in meses]

    # Series mensuales por empresa (para gráfico apilado)
    monthly_por_empresa = []
    for m in meses:
        entry: dict = {"mes": m, "total": round(monthly.get(m, 0), 2)}
        for emp in empresas_colores:
            entry[emp] = round(monthly_empresa[m].get(emp, 0), 2)
        monthly_por_empresa.append(entry)

    materiales = [
        {"nombre": k, "kg": round(v["kg"], 2), "color": v["color"]}
        for k, v in sorted(por_material.items(), key=lambda x: -x[1]["kg"])
    ]

    empresas_ranking = [
        {"nombre": k, "kg": round(v, 2), "color": empresas_colores.get(k, "#9ca3af")}
        for k, v in sorted(por_empresa.items(), key=lambda x: -x[1])
    ]

    total_kg = round(sum(r["kg"] for r in materiales), 2)

    return {
        "monthly": monthly_series,
        "monthly_por_empresa": monthly_por_empresa,
        "materiales": materiales,
        "empresas": empresas_ranking,
        "empresas_keys": list(empresas_colores.keys()),
        "empresas_colores": empresas_colores,
        "total_kg": total_kg,
    }
