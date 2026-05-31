from __future__ import annotations
import os
import uuid
import httpx
import requests
from datetime import date, datetime, timezone
from models import WhatsAppMessage, ExtractionResult

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SERVICE_KEY  = os.getenv("SUPABASE_SERVICE_KEY", "")

CONFIDENCE_MAP = {"alta": 0.90, "media": 0.70, "baja": 0.40}
STORAGE_BUCKET = "recolecciones-imagenes"


def _headers():
    return {
        "apikey":        SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "return=representation",
    }


def _get(table: str, params: str = "") -> list:
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    r = requests.get(url, headers=_headers(), timeout=10)
    r.raise_for_status()
    return r.json()


def _post(table: str, data: dict) -> dict:
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    r = requests.post(url, headers=_headers(), json=data, timeout=10)
    r.raise_for_status()
    result = r.json()
    return result[0] if isinstance(result, list) and result else (result or {})


def _patch(table: str, match_field: str, match_value: str, data: dict) -> dict:
    url = f"{SUPABASE_URL}/rest/v1/{table}?{match_field}=eq.{match_value}"
    r = requests.patch(url, headers=_headers(), json=data, timeout=10)
    r.raise_for_status()
    result = r.json()
    return result[0] if isinstance(result, list) and result else (result or {})


def _find_empresa_id(nombre: str) -> str | None:
    if not nombre:
        return None
    encoded = requests.utils.quote(f"%{nombre}%")
    rows = _get("empresas", f"nombre=ilike.{encoded}&select=id&limit=1")
    return rows[0]["id"] if rows else None


def _find_material_id(material: str) -> str | None:
    if not material:
        return None
    encoded = requests.utils.quote(f"%{material}%")
    rows = _get("materiales", f"nombre=ilike.{encoded}&select=id&limit=1")
    if rows:
        return rows[0]["id"]
    rows = _get("materiales", f"codigo=ilike.{encoded}&select=id&limit=1")
    return rows[0]["id"] if rows else None


def _upload_image_to_storage(image_url: str) -> str | None:
    """Descarga la imagen y la sube a Supabase Storage. Retorna la URL permanente."""
    try:
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
        ext      = "jpg" if "jpeg" in content_type else content_type.split("/")[-1]
        filename = f"{uuid.uuid4()}.{ext}"

        storage_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{filename}"
        upload_headers = {
            "apikey":        SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type":  content_type,
        }
        requests.post(storage_url, headers=upload_headers, data=r.content, timeout=30).raise_for_status()

        return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{filename}"

    except Exception as e:
        print(f"Error subiendo imagen a storage: {e}")
        return image_url  # fallback: guardar URL original


def save_recoleccion(message: WhatsAppMessage, extraction: ExtractionResult) -> dict:
    empresa_id = _find_empresa_id(extraction.empresa)
    confidence = CONFIDENCE_MAP.get(extraction.confianza or "", 0.50)
    fecha = extraction.fecha or date.today().isoformat()

    imagen_url = None
    if message.image_url:
        imagen_url = _upload_image_to_storage(message.image_url)

    notas = extraction.notas or ""
    if not empresa_id and extraction.empresa:
        notas = f"[Empresa no encontrada en BD: '{extraction.empresa}'] {notas}".strip()

    record = {
        "empresa_id":          empresa_id,
        "empresa_nombre_raw":  extraction.empresa,
        "estado":              "APROBADO",
        "fecha_recoleccion":   fecha,
        "fuente_origen":       "whatsapp",
        "mensaje_raw":         message.text,
        "imagen_url":          imagen_url,
        "notas":               notas or None,
        "extraido_por_ia":     True,
        "ia_confidence":       confidence,
    }

    recoleccion = _post("recolecciones", record)
    recoleccion_id = recoleccion.get("id")

    # Guardar detalle del material si se pudo extraer
    if recoleccion_id and extraction.material and extraction.cantidad is not None:
        material_id = _find_material_id(extraction.material)
        notas_detalle = extraction.unidad or ""
        if not material_id:
            notas_detalle = f"[Material no encontrado en BD: '{extraction.material}'] {notas_detalle}".strip()
        _post("detalle_recoleccion", {
            "recoleccion_id": recoleccion_id,
            "material_id":    material_id,
            "cantidad":       extraction.cantidad,
            "notas":          notas_detalle or None,
        })

    return recoleccion


def get_pendientes() -> list:
    return _get("vista_pendientes")


def aprobar_recoleccion(record_id: str, corrections: dict) -> dict:
    data = {
        **corrections,
        "estado":      "APROBADO",
        "validado_at": datetime.now(timezone.utc).isoformat(),
    }
    return _patch("recolecciones", "id", record_id, data)


def rechazar_recoleccion(record_id: str, motivo: str) -> dict:
    return _patch("recolecciones", "id", record_id, {
        "estado":           "RECHAZADO",
        "rechazado_motivo": motivo,
    })
