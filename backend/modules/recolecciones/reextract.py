"""
Re-procesa mensajes históricos: extrae materiales con IA y vincula empresas.
Se ejecuta desde el endpoint POST /admin/reextract.
"""
from datetime import date, datetime, timezone
from shared import database as db
from modules.extraccion import extractor as ai
from shared.models import ExtractionResult


CONFIDENCE_MAP = {"alta": 0.90, "media": 0.70, "baja": 0.40}


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
    """Borra detalles previos de una recolección para poder re-insertar."""
    try:
        db.delete("detalle_recoleccion", "recoleccion_id", recoleccion_id)
    except Exception as e:
        print(f"[reextract] No se pudo borrar detalles de {recoleccion_id}: {e}")


def _save_detalles(recoleccion_id: str, extraction: ExtractionResult) -> float:
    """Guarda los materiales extraídos. Retorna kg total."""
    kg_total = 0.0
    if not extraction.materiales:
        return kg_total
    for item in extraction.materiales:
        if not item.material or item.cantidad is None:
            continue
        material_id = _find_material_id(item.material)
        notas       = item.unidad or ""
        if not material_id:
            notas = f"[Material no mapeado: '{item.material}'] {notas}".strip()
        db.insert("detalle_recoleccion", {
            "recoleccion_id": recoleccion_id,
            "material_id":    material_id,
            "cantidad":       item.cantidad,
            "notas":          notas or None,
        })
        kg_total += item.cantidad
    return kg_total


def reextract_all() -> dict:
    """
    Itera TODAS las recolecciones con mensaje_raw y:
    1. Re-extrae materiales con IA.
    2. Vincula empresa si empresa_id es null.
    3. Borra detalles antiguos y reinserta los nuevos.
    Devuelve un resumen del proceso.
    """
    # Traer todas las recolecciones con texto
    rows = db.get(
        "recolecciones",
        "mensaje_raw=not.is.null&select=id,empresa_id,empresa_nombre_raw,mensaje_raw,imagen_url"
        "&limit=500"
    )

    procesados  = 0
    actualizados = 0
    errores     = []

    for r in rows:
        rec_id    = r["id"]
        msg       = r.get("mensaje_raw", "")
        img_url   = r.get("imagen_url")
        emp_id    = r.get("empresa_id")
        emp_raw   = r.get("empresa_nombre_raw")

        try:
            # ── Extraer con IA ────────────────────────────────
            if msg and img_url:
                extraction = ai.extract_from_text_and_image(msg, img_url)
            elif img_url:
                extraction = ai.extract_from_image(img_url)
            elif msg:
                extraction = ai.extract_from_text(msg)
            else:
                continue

            # ── Buscar empresa si no está vinculada ───────────
            nuevo_emp_id = emp_id
            nombre_ia    = extraction.empresa or emp_raw
            if not nuevo_emp_id and nombre_ia:
                nuevo_emp_id = _find_empresa_id(nombre_ia)

            # ── Actualizar recoleccion si hay datos nuevos ────
            update_data: dict = {
                "ia_confidence": CONFIDENCE_MAP.get(extraction.confianza or "", 0.50),
                "empresa_nombre_raw": nombre_ia or emp_raw,
            }
            if nuevo_emp_id and not emp_id:
                update_data["empresa_id"] = nuevo_emp_id
                actualizados += 1

            db.update("recolecciones", "id", rec_id, update_data)

            # ── Re-insertar detalles de materiales ────────────
            _delete_detalles(rec_id)
            _save_detalles(rec_id, extraction)

            procesados += 1
            print(f"[reextract] OK {rec_id[:8]} empresa={nombre_ia} mats={len(extraction.materiales or [])}")

        except Exception as e:
            errores.append({"id": rec_id[:8], "error": str(e)})
            print(f"[reextract] ERROR {rec_id[:8]}: {e}")

    return {
        "procesados":   procesados,
        "actualizados": actualizados,
        "errores":      errores,
        "total":        len(rows),
    }
