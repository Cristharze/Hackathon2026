import os
from datetime import date, datetime, timezone
from supabase import create_client, Client
from models import WhatsAppMessage, ExtractionResult

_client: Client = None

CONFIDENCE_MAP = {"alta": 0.90, "media": 0.70, "baja": 0.40}


def get_client() -> Client:
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        _client = create_client(url, key)
    return _client


def _find_empresa_id(db: Client, nombre: str) -> str | None:
    if not nombre:
        return None
    r = db.table("empresas").select("id").ilike("nombre", f"%{nombre}%").limit(1).execute()
    return r.data[0]["id"] if r.data else None


def _find_material_id(db: Client, material: str) -> str | None:
    if not material:
        return None
    # Busca primero por nombre, luego por código
    r = db.table("materiales").select("id").ilike("nombre", f"%{material}%").limit(1).execute()
    if r.data:
        return r.data[0]["id"]
    r = db.table("materiales").select("id").ilike("codigo", f"%{material}%").limit(1).execute()
    return r.data[0]["id"] if r.data else None


def save_recoleccion(message: WhatsAppMessage, extraction: ExtractionResult) -> dict:
    db = get_client()

    empresa_id = _find_empresa_id(db, extraction.empresa)
    confidence = CONFIDENCE_MAP.get(extraction.confianza, 0.50)
    fecha = extraction.fecha or date.today().isoformat()

    notas = extraction.notas or ""
    if not empresa_id and extraction.empresa:
        notas = f"[Empresa no encontrada en BD: '{extraction.empresa}'] {notas}".strip()

    record = {
        "empresa_id": empresa_id,
        "estado": "PENDIENTE",
        "fecha_recoleccion": fecha,
        "fuente_origen": "whatsapp",
        "mensaje_raw": message.text,
        "imagen_url": message.image_url,
        "notas": notas or None,
        "extraido_por_ia": True,
        "ia_confidence": confidence,
    }

    r = db.table("recolecciones").insert(record).execute()
    recoleccion = r.data[0] if r.data else {}
    recoleccion_id = recoleccion.get("id")

    # Guardar detalle del material si se pudo extraer
    if recoleccion_id and extraction.material and extraction.cantidad:
        material_id = _find_material_id(db, extraction.material)
        if material_id:
            db.table("detalle_recoleccion").insert({
                "recoleccion_id": recoleccion_id,
                "material_id": material_id,
                "cantidad": extraction.cantidad,
                "notas": extraction.unidad,
            }).execute()

    return recoleccion


def get_pendientes() -> list:
    db = get_client()
    r = db.table("vista_pendientes").select("*").execute()
    return r.data


def aprobar_recoleccion(record_id: str, corrections: dict) -> dict:
    db = get_client()
    updates = {
        **corrections,
        "estado": "APROBADO",
        "validado_at": datetime.now(timezone.utc).isoformat(),
    }
    r = db.table("recolecciones").update(updates).eq("id", record_id).execute()
    return r.data[0] if r.data else {}


def rechazar_recoleccion(record_id: str, motivo: str) -> dict:
    db = get_client()
    r = db.table("recolecciones").update({
        "estado": "RECHAZADO",
        "rechazado_motivo": motivo,
    }).eq("id", record_id).execute()
    return r.data[0] if r.data else {}
