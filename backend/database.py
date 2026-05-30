import os
import uuid
import httpx
from datetime import date, datetime, timezone
from supabase import create_client, Client
from models import WhatsAppMessage, ExtractionResult

_client: Client = None

CONFIDENCE_MAP = {"alta": 0.90, "media": 0.70, "baja": 0.40}
STORAGE_BUCKET = "recolecciones-imagenes"


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
    r = db.table("materiales").select("id").ilike("nombre", f"%{material}%").limit(1).execute()
    if r.data:
        return r.data[0]["id"]
    r = db.table("materiales").select("id").ilike("codigo", f"%{material}%").limit(1).execute()
    return r.data[0]["id"] if r.data else None


def _upload_image_to_storage(image_url: str) -> str | None:
    """Descarga la imagen y la sube a Supabase Storage. Retorna la URL permanente."""
    try:
        # Descargar imagen (con auth de Twilio si aplica)
        if "twilio.com" in image_url:
            sid   = os.getenv("TWILIO_ACCOUNT_SID", "")
            token = os.getenv("TWILIO_AUTH_TOKEN", "")
            r = httpx.get(image_url, auth=(sid, token), follow_redirects=True, timeout=30)
        else:
            wa_token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
            headers  = {"Authorization": f"Bearer {wa_token}"} if wa_token else {}
            r = httpx.get(image_url, headers=headers, follow_redirects=True, timeout=30)

        r.raise_for_status()
        content_type = r.headers.get("content-type", "image/jpeg")
        ext = "jpg" if "jpeg" in content_type else content_type.split("/")[-1]
        filename = f"{uuid.uuid4()}.{ext}"

        db = get_client()
        db.storage.from_(STORAGE_BUCKET).upload(
            path=filename,
            file=r.content,
            file_options={"content-type": content_type},
        )

        public_url = db.storage.from_(STORAGE_BUCKET).get_public_url(filename)
        return public_url

    except Exception as e:
        print(f"Error subiendo imagen a storage: {e}")
        return image_url  # fallback: guardar URL original si falla


def save_recoleccion(message: WhatsAppMessage, extraction: ExtractionResult) -> dict:
    db = get_client()

    empresa_id = _find_empresa_id(db, extraction.empresa)
    confidence = CONFIDENCE_MAP.get(extraction.confianza, 0.50)
    fecha = extraction.fecha or date.today().isoformat()

    # Subir imagen a Supabase Storage si hay una
    imagen_url = None
    if message.image_url:
        imagen_url = _upload_image_to_storage(message.image_url)

    notas = extraction.notas or ""
    if not empresa_id and extraction.empresa:
        notas = f"[Empresa no encontrada en BD: '{extraction.empresa}'] {notas}".strip()

    record = {
        "empresa_id": empresa_id,
        "empresa_nombre_raw": extraction.empresa,   # siempre se guarda aunque no haga match
        "estado": "PENDIENTE",
        "fecha_recoleccion": fecha,
        "fuente_origen": "whatsapp",
        "mensaje_raw": message.text,
        "imagen_url": imagen_url,
        "notas": notas or None,
        "extraido_por_ia": True,
        "ia_confidence": confidence,
    }

    r = db.table("recolecciones").insert(record).execute()
    recoleccion = r.data[0] if r.data else {}
    recoleccion_id = recoleccion.get("id")

    # Guardar detalle del material extraído
    if recoleccion_id and extraction.material and extraction.cantidad:
        material_id = _find_material_id(db, extraction.material)
        if material_id:
            db.table("detalle_recoleccion").insert({
                "recoleccion_id": recoleccion_id,
                "material_id": material_id,
                "cantidad": extraction.cantidad,
                "notas": extraction.unidad,
            }).execute()
        else:
            print(f"Material no encontrado en BD: '{extraction.material}'")

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
