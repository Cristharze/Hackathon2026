from datetime import date, datetime, timezone
from shared import database as db
from shared.models import WhatsAppMessage, ExtractionResult

CONFIDENCE_MAP = {"alta": 0.90, "media": 0.70, "baja": 0.40}


def _find_empresa_id(nombre: str) -> str | None:
    if not nombre:
        return None
    row = db.ilike_one("empresas", "nombre", nombre, select="id")
    return row["id"] if row else None


def _find_material_id(material: str) -> str | None:
    if not material:
        return None
    row = db.ilike_one("materiales", "nombre", material, select="id")
    if row:
        return row["id"]
    row = db.ilike_one("materiales", "codigo", material, select="id")
    return row["id"] if row else None


def _save_externo(nombre: str, kg_total: float):
    """Registra o actualiza un contribuyente externo."""
    try:
        rows = db.get("contribuyentes_externos", f"nombre=ilike.%{nombre}%&limit=1")
        if rows:
            existente = rows[0]
            nuevo_total = float(existente.get("total_kg", 0)) + kg_total
            db.update("contribuyentes_externos", "id", existente["id"], {
                "ultima_vez": date.today().isoformat(),
                "total_kg": nuevo_total,
            })
        else:
            db.insert("contribuyentes_externos", {
                "nombre": nombre,
                "primera_vez": date.today().isoformat(),
                "ultima_vez": date.today().isoformat(),
                "total_kg": kg_total,
            })
    except Exception as e:
        print(f"[externo] Error registrando contribuyente externo: {e}")


def save(message: WhatsAppMessage, extraction: ExtractionResult, imagen_url: str | None) -> dict:
    empresa_id = _find_empresa_id(extraction.empresa)
    confidence = CONFIDENCE_MAP.get(extraction.confianza or "", 0.50)
    fecha      = extraction.fecha or date.today().isoformat()

    notas = extraction.notas or ""
    es_externo = False

    if not empresa_id and extraction.empresa:
        es_externo = True
        notas = f"[Empresa no registrada: '{extraction.empresa}'] {notas}".strip()

    record = {
        "empresa_id":         empresa_id,
        "empresa_nombre_raw": extraction.empresa,
        "estado":             "PENDIENTE",
        "fecha_recoleccion":  fecha,
        "fuente_origen":      "whatsapp",
        "mensaje_raw":        message.text,
        "imagen_url":         imagen_url,
        "notas":              notas or None,
        "extraido_por_ia":    True,
        "ia_confidence":      confidence,
    }

    recoleccion    = db.insert("recolecciones", record)
    recoleccion_id = recoleccion.get("id")

    # Insertar cada material extraído
    kg_total = 0.0
    if recoleccion_id and extraction.materiales:
        for item in extraction.materiales:
            if not item.material or item.cantidad is None:
                continue
            material_id = _find_material_id(item.material)
            notas_det   = item.unidad or ""
            if not material_id:
                notas_det = f"[Material no encontrado: '{item.material}'] {notas_det}".strip()
            db.insert("detalle_recoleccion", {
                "recoleccion_id": recoleccion_id,
                "material_id":    material_id,
                "cantidad":       item.cantidad,
                "notas":          notas_det or None,
            })
            kg_total += item.cantidad

    # Si la empresa no está registrada, guardar como contribuyente externo
    if es_externo and extraction.empresa and kg_total > 0:
        _save_externo(extraction.empresa, kg_total)

    return recoleccion


def get_pendientes() -> list:
    return db.get("vista_pendientes")


def aprobar(record_id: str, corrections: dict) -> dict:
    data = {**corrections, "estado": "APROBADO", "validado_at": datetime.now(timezone.utc).isoformat()}
    return db.update("recolecciones", "id", record_id, data)


def rechazar(record_id: str, motivo: str) -> dict:
    return db.update("recolecciones", "id", record_id, {
        "estado":           "RECHAZADO",
        "rechazado_motivo": motivo,
    })
