import os
import uuid
import httpx
import requests
from shared import database as db

BUCKET = "recolecciones-imagenes"


def upload_from_url(image_url: str) -> str | None:
    """Descarga imagen y la sube a Supabase Storage. Retorna URL permanente."""
    try:
        if "twilio.com" in image_url:
            sid   = os.getenv("TWILIO_ACCOUNT_SID", "")
            token = os.getenv("TWILIO_AUTH_TOKEN", "")
            r = httpx.get(image_url, auth=(sid, token), follow_redirects=True, timeout=30)
        else:
            wa_token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
            hdrs     = {"Authorization": f"Bearer {wa_token}"} if wa_token else {}
            r = httpx.get(image_url, headers=hdrs, follow_redirects=True, timeout=30)

        r.raise_for_status()
        content_type = r.headers.get("content-type", "image/jpeg").split(";")[0]
        ext      = "jpg" if "jpeg" in content_type else content_type.split("/")[-1]
        filename = f"{uuid.uuid4()}.{ext}"

        upload_headers = db.headers({"Content-Type": content_type, "Prefer": ""})
        upload_headers.pop("Prefer", None)

        res = requests.post(
            db.storage_url(BUCKET, filename),
            headers=upload_headers,
            data=r.content,
            timeout=30,
        )
        res.raise_for_status()
        return db.storage_public_url(BUCKET, filename)

    except Exception as e:
        print(f"[storage] Error subiendo imagen: {e}")
        return image_url  # fallback a URL original
