"""
Re-procesa mensajes históricos usando expresiones regulares.
Sin costo de API — extrae empresa, materiales y cantidades del texto del mensaje.
"""
from __future__ import annotations
import re
from shared import database as db

# Mapeo de variantes de nombre a nombre canónico en la BD
MATERIAL_MAP = {
    "carton":        "Cartón",
    "cartón":        "Cartón",
    "papel":         "Papel",
    "pet":           "Plástico PET",
    "plastico pet":  "Plástico PET",
    "plástico pet":  "Plástico PET",
    "plastico":      "Plástico mixto",
    "plástico":      "Plástico mixto",
    "vidrio":        "Vidrio",
    "metal":         "Aluminio",
    "aluminio":      "Aluminio",
    "hdpe":          "Plástico HDPE",
    "electronico":   "Electrónico",
    "electrónico":   "Electrónico",
}

# Palabras que no son materiales (evitar falsos positivos)
STOP_WORDS = {"kg", "de", "y", "el", "la", "los", "las", "en", "con", "un", "una"}


def _normalizar(texto: str) -> str:
    return texto.lower().strip()


def _buscar_material(nombre: str) -> str | None:
    """Normaliza el nombre del material al canónico."""
    n = _normalizar(nombre)
    if n in MATERIAL_MAP:
        return MATERIAL_MAP[n]
    # Búsqueda parcial
    for key, val in MATERIAL_MAP.items():
        if key in n or n in key:
            return val
    return nombre.capitalize() if n not in STOP_WORDS else None


def _extraer_empresa(texto: str) -> str | None:
    """Extrae el nombre de empresa del texto del mensaje."""
    # Patrón 1: "EmpresaNombre, ..."
    m = re.match(r'^([A-Za-záéíóúÁÉÍÓÚñÑ][A-Za-záéíóúÁÉÍÓÚñÑ\s\.]+?)\s*,', texto)
    if m:
        cand = m.group(1).strip()
        if len(cand) > 3 and not cand.lower().startswith(("hoy", "ayer", "recogi", "recogí")):
            return cand

    # Patrón 2: "... en EmpresaNombre" al final
    m = re.search(
        r'\ben\s+([A-ZÁÉÍÓÚ][A-Za-záéíóúÁÉÍÓÚñÑ\s]+?)(?:\s+(?:hoy|ayer|el|la|los|,|\.)|\s*$)',
        texto
    )
    if m:
        return m.group(1).strip()

    return None


def _extraer_materiales(texto: str) -> list[dict]:
    """
    Extrae pares (cantidad_kg, material) del texto.
    Maneja formatos como:
      - "15kg de papel"
      - "68 kg PET"
      - "45kg carton"
      - "15kg de papel y 68kg de PET"
    """
    materiales = []
    # Busca: número (opcional decimal) + kg + (de) + material
    patron = re.compile(
        r'(\d+(?:[.,]\d+)?)\s*kg\s+(?:de\s+)?([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+?)(?=\s+y\s+\d|\s*,|\s*\.|$)',
        re.IGNORECASE
    )
    for m in patron.finditer(texto):
        kg_str  = m.group(1).replace(",", ".")
        mat_str = m.group(2).strip()
        nombre  = _buscar_material(mat_str)
        if nombre and float(kg_str) > 0:
            materiales.append({"material": nombre, "cantidad": float(kg_str), "unidad": "kg"})

    return materiales


def _find_empresa_id(nombre: str | None) -> str | None:
    if not nombre:
        return None
    row = db.ilike_one("empresas", "nombre", nombre, select="id")
    return row["id"] if row else None


def _find_material_id(nombre: str | None) -> str | None:
    if not nombre:
        return None
    row = db.ilike_one("materiales", "nombre", nombre, select="id")
    if row:
        return row["id"]
    row = db.ilike_one("materiales", "codigo", nombre, select="id")
    return row["id"] if row else None


def _delete_detalles(recoleccion_id: str):
    try:
        db.delete("detalle_recoleccion", "recoleccion_id", recoleccion_id)
    except Exception as e:
        print(f"[reextract] No se pudo limpiar {recoleccion_id}: {e}")


def reextract_all() -> dict:
    """
    Para cada recolección con mensaje_raw:
    1. Extrae empresa y materiales con regex (sin costo de API).
    2. Vincula empresa_id si estaba vacío.
    3. Elimina detalles anteriores y guarda los nuevos.
    """
    rows = db.get(
        "recolecciones",
        "mensaje_raw=not.is.null"
        "&select=id,empresa_id,empresa_nombre_raw,mensaje_raw"
        "&limit=500"
    )

    procesados   = 0
    vinculados   = 0
    sin_material = 0
    errores      = []

    for r in rows:
        rec_id  = r["id"]
        msg     = r.get("mensaje_raw") or ""
        emp_id  = r.get("empresa_id")
        emp_raw = r.get("empresa_nombre_raw")

        try:
            # ── Extraer empresa y materiales ──────────────────
            empresa_nombre = _extraer_empresa(msg) or emp_raw
            materiales     = _extraer_materiales(msg)

            # ── Buscar / vincular empresa ─────────────────────
            nuevo_emp_id = emp_id
            if not nuevo_emp_id and empresa_nombre:
                nuevo_emp_id = _find_empresa_id(empresa_nombre)

            update: dict = {}
            if empresa_nombre and not emp_raw:
                update["empresa_nombre_raw"] = empresa_nombre
            if nuevo_emp_id and not emp_id:
                update["empresa_id"] = nuevo_emp_id
                vinculados += 1

            if update:
                db.update("recolecciones", "id", rec_id, update)

            # ── Guardar detalles de materiales ────────────────
            if materiales:
                _delete_detalles(rec_id)
                for item in materiales:
                    mat_id  = _find_material_id(item["material"])
                    notas   = item["unidad"]
                    if not mat_id:
                        notas = f"[Material: '{item['material']}'] {notas}".strip()
                    db.insert("detalle_recoleccion", {
                        "recoleccion_id": rec_id,
                        "material_id":    mat_id,
                        "cantidad":       item["cantidad"],
                        "notas":          notas or None,
                    })
                resumen = ", ".join(f'{m["cantidad"]}kg {m["material"]}' for m in materiales)
                print(f"[reextract] OK {rec_id[:8]} | emp={empresa_nombre} | {resumen}")
            else:
                sin_material += 1
                print(f"[reextract] Sin materiales: {rec_id[:8]} | msg={msg[:60]}")

            procesados += 1

        except Exception as e:
            errores.append({"id": rec_id[:8], "error": str(e)})
            print(f"[reextract] ERROR {rec_id[:8]}: {e}")

    return {
        "procesados":    procesados,
        "vinculados":    vinculados,
        "sin_material":  sin_material,
        "errores":       errores,
        "total":         len(rows),
    }
