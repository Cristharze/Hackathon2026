import uuid
import time
import os
import re
from fastapi import APIRouter, Request, Query, HTTPException
from fastapi.responses import PlainTextResponse
from shared.models import WhatsAppMessage, ExtractionResult, MaterialItem
from modules.storage import service as storage
from modules.recolecciones import repository

router = APIRouter(tags=["webhook"])

VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "fundares_token_2026")

# ── Mapeo de materiales para el extractor regex ────────────────────────────────
MATERIAL_MAP = {
    "carton": "Cartón", "cartón": "Cartón",
    "papel": "Papel",
    "pet": "Plástico PET", "plastico pet": "Plástico PET", "plástico pet": "Plástico PET",
    "plastico": "Plástico mixto", "plástico": "Plástico mixto",
    "vidrio": "Vidrio",
    "metal": "Aluminio", "aluminio": "Aluminio",
    "hdpe": "Plástico HDPE",
    "electronico": "Electrónico (RAEE)", "electrónico": "Electrónico (RAEE)",
    "aceite": "Aceite vegetal",
    "madera": "Madera",
    "textil": "Textiles", "textiles": "Textiles",
}


def _regex_extract(text: str) -> ExtractionResult:
    """Extrae empresa y materiales con regex — sin costo de API."""
    empresa = None

    # Empresa antes de coma
    m = re.match(r'^([A-Za-záéíóúÁÉÍÓÚñÑ][A-Za-záéíóúÁÉÍÓÚñÑ\s\.]+?)\s*,', text)
    if m:
        cand = m.group(1).strip()
        if len(cand) > 2 and not cand.lower().startswith(("hoy","ayer","recogi","recogí")):
            empresa = cand

    # Empresa tras "en"
    if not empresa:
        m2 = re.search(r'\ben\s+([A-ZÁÉÍÓÚ][A-Za-záéíóúÁÉÍÓÚñÑ\s]+?)(?:\s+hoy|\s*$|,)', text)
        if m2:
            empresa = m2.group(1).strip()

    # Materiales: "Xkg de material"
    materiales = []
    patron = re.compile(
        r'(\d+(?:[.,]\d+)?)\s*kg\s+(?:de\s+)?([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+?)(?=\s+y\s+\d|\s*,|\s*\.|$)',
        re.IGNORECASE
    )
    for hit in patron.finditer(text):
        kg_str = hit.group(1).replace(",", ".")
        mat_str = hit.group(2).strip().lower()
        nombre = MATERIAL_MAP.get(mat_str)
        if not nombre:
            for key, val in MATERIAL_MAP.items():
                if key in mat_str or mat_str in key:
                    nombre = val
                    break
        if nombre and float(kg_str) > 0:
            materiales.append(MaterialItem(material=nombre, cantidad=float(kg_str), unidad="kg"))

    conf = "alta" if empresa and materiales else ("media" if empresa or materiales else "baja")
    return ExtractionResult(
        empresa=empresa,
        materiales=materiales or None,
        confianza=conf,
        notas=None,
    )


def _extract(msg: WhatsAppMessage) -> ExtractionResult:
    """Intenta IA primero; si falla, usa regex."""
    # 1. Intentar con IA
    try:
        from modules.extraccion import extractor as ai
        if msg.text and msg.image_url:
            return ai.extract_from_text_and_image(msg.text, msg.image_url)
        elif msg.image_url:
            return ai.extract_from_image(msg.image_url)
        elif msg.text:
            return ai.extract_from_text(msg.text)
    except Exception as e:
        print(f"[extractor/IA] Falló ({e}), usando regex...")

    # 2. Fallback regex
    if msg.text:
        return _regex_extract(msg.text)

    # 3. Sin texto ni imagen
    return ExtractionResult(confianza="baja", notas="Mensaje sin texto reconocible")


def _process(msg: WhatsAppMessage) -> dict:
    imagen_permanente = None
    if msg.image_url:
        try:
            imagen_permanente = storage.upload_from_url(msg.image_url)
        except Exception as e:
            print(f"[storage] Error subiendo imagen: {e}")

    extraction = _extract(msg)
    print(f"[extraccion] empresa='{extraction.empresa}' mats={len(extraction.materiales or [])} conf={extraction.confianza}")

    record = repository.save(msg, extraction, imagen_permanente)
    print(f"[DB] guardado id={record.get('id')} empresa_id={record.get('empresa_id')}")
    return {"status": "ok", "record_id": record.get("id"), "extraction": extraction.model_dump()}


# ── Meta WhatsApp Business API ─────────────────────────────────────────────────
@router.get("/webhook")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
):
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Token inválido")


@router.post("/webhook")
async def receive_meta(request: Request):
    body = await request.json()
    try:
        entry    = body["entry"][0]["changes"][0]["value"]
        messages = entry.get("messages", [])
        if not messages:
            return {"status": "no_messages"}

        msg      = messages[0]
        msg_type = msg["type"]
        text, image_url = None, None

        if msg_type == "text":
            text = msg["text"]["body"]
        elif msg_type == "image":
            import httpx
            token = os.getenv("WHATSAPP_ACCESS_TOKEN")
            r = httpx.get(f"https://graph.facebook.com/v19.0/{msg['image']['id']}",
                          headers={"Authorization": f"Bearer {token}"})
            image_url = r.json()["url"]
            text = msg["image"].get("caption")

        wa_msg = WhatsAppMessage(
            message_id=msg["id"], phone_from=msg["from"],
            text=text, image_url=image_url, timestamp=msg["timestamp"],
        )
        return _process(wa_msg)
    except Exception as e:
        print(f"[webhook/meta] Error: {e}")
        return {"status": "error", "detail": str(e)}


# ── Twilio WhatsApp ────────────────────────────────────────────────────────────
@router.post("/webhook/twilio")
async def receive_twilio(request: Request):
    form = await request.form()

    wa_msg = WhatsAppMessage(
        message_id  = str(form.get("MessageSid", str(uuid.uuid4()))),
        phone_from  = str(form.get("From", "")).replace("whatsapp:", ""),
        text        = str(form.get("Body", "")).strip() or None,
        image_url   = str(form.get("MediaUrl0", "")).strip() or None,
        timestamp   = str(int(time.time())),
    )

    print(f"[twilio] De: {wa_msg.phone_from} | Msg: {(wa_msg.text or '')[:80]}")

    try:
        result = _process(wa_msg)
        print(f"[twilio] OK → {result}")
    except Exception as e:
        print(f"[twilio] Error crítico: {e}")
        # Guardar aunque sea el mensaje crudo sin extracción
        try:
            from shared import database as db
            db.insert("recolecciones", {
                "estado":            "APROBADO",
                "fecha_recoleccion": __import__("datetime").date.today().isoformat(),
                "fuente_origen":     "whatsapp",
                "mensaje_raw":       wa_msg.text,
                "extraido_por_ia":   False,
                "ia_confidence":     0.0,
                "notas":             f"Guardado sin extracción: {e}",
            })
            print("[twilio] Mensaje guardado sin extracción como fallback")
        except Exception as e2:
            print(f"[twilio] Fallback también falló: {e2}")

    return PlainTextResponse(
        "<?xml version='1.0' encoding='UTF-8'?><Response></Response>",
        media_type="application/xml",
    )
