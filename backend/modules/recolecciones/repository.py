from datetime import date, datetime, timezone
from shared.database import get_client
from shared.models import WhatsAppMessage, ExtractionResult

CONFIDENCE_MAP = {"alta": 0.90, "media": 0.70, "baja": 0.40}


def _find_empresa_id(nombre: str) -> str | None:
    if not nombre:
        return None
    db = get_client()
    r = db.table("empresas").select("id").ilike("nombre", f"%{nombre}%").limit(1).execute()
    return r.data[0]["id"] if r.data else None


def _find_material_id(material: str) -> str | None:
    if not material:
        return None
    db = get_client()
    r = db.table("materiales").select("id").ilike("nombre", f"%{material}%").limit(1).execute()
    if r.data:
        return r.data[0]["id"]
    r = db.table("materiales").select("id").ilike("codigo", f"%{material}%").limit(1).execute()
    return r.data[0]["id"] if r.data else None


def save(message: WhatsAppMessage, extraction: ExtractionResult, imagen_url: str | None) -> dict:
    db = get_client()

    empresa_id = _find_empresa_id(extraction.empresa)
    confidence = CONFIDENCE_MAP.get(extraction.confianza, 0.50)
    fecha      = extraction.fecha or date.today().isoformat()

    notas = extraction.notas or ""
    if not empresa_id and extraction.empresa:
        notas = f"[Empresa no encontrada en BD: '{extraction.empresa}'] {notas}".strip()

    record = {
        "empresa_id":          empresa_id,
        "empresa_nombre_raw":  extraction.empresa,
        "estado":              "PENDIENTE",
        "fecha_recoleccion":   fecha,
        "fuente_origen":       "whatsapp",
        "mensaje_raw":         message.text,
        "imagen_url":          imagen_url,
        "notas":               notas or None,
        "extraido_por_ia":     True,
        "ia_confidence":       confidence,
    }

    r = db.table("recolecciones").insert(record).execute()
    recoleccion    = r.data[0] if r.data else {}
    recoleccion_id = recoleccion.get("id")

    if recoleccion_id and extraction.material and extraction.cantidad:
        material_id = _find_material_id(extraction.material)
        if material_id:
            db.table("detalle_recoleccion").insert({
                "recoleccion_id": recoleccion_id,
                "material_id":    material_id,
                "cantidad":       extraction.cantidad,
                "notas":          extraction.unidad,
            }).execute()
        else:
            print(f"[recolecciones] Material no encontrado: '{extraction.material}'")

    return recoleccion


def get_pendientes() -> list:
    db = get_client()
    return db.table("vista_pendientes").select("*").execute().data


def aprobar(record_id: str, corrections: dict) -> dict:
    db = get_client()
    updates = {**corrections, "estado": "APROBADO", "validado_at": datetime.now(timezone.utc).isoformat()}
    r = db.table("recolecciones").update(updates).eq("id", record_id).execute()
    return r.data[0] if r.data else {}


def rechazar(record_id: str, motivo: str) -> dict:
    db = get_client()
    r = db.table("recolecciones").update({
        "estado": "RECHAZADO",
        "rechazado_motivo": motivo,
    }).eq("id", record_id).execute()
    return r.data[0] if r.data else {}
