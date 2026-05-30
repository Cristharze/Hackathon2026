import os
import uuid
import httpx
from shared.database import get_client

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
            headers  = {"Authorization": f"Bearer {wa_token}"} if wa_token else {}
            r = httpx.get(image_url, headers=headers, follow_redirects=True, timeout=30)

        r.raise_for_status()
        content_type = r.headers.get("content-type", "image/jpeg").split(";")[0]
        ext      = "jpg" if "jpeg" in content_type else content_type.split("/")[-1]
        filename = f"{uuid.uuid4()}.{ext}"

        db = get_client()
        db.storage.from_(BUCKET).upload(
            path=filename,
            file=r.content,
            file_options={"content-type": content_type},
        )
        return db.storage.from_(BUCKET).get_public_url(filename)

    except Exception as e:
        print(f"[storage] Error subiendo imagen: {e}")
        return image_url  # fallback a URL original
