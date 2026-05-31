import uuid
import time
import os
from fastapi import APIRouter, Request, Query, HTTPException
from fastapi.responses import PlainTextResponse
from shared.models import WhatsAppMessage, ExtractionResult
from modules.extraccion import extractor
from modules.storage import service as storage
from modules.recolecciones import repository

router = APIRouter(tags=["webhook"])

VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "fundares_token_2026")


def _extract(msg: WhatsAppMessage) -> ExtractionResult:
    if msg.text and msg.image_url:
        return extractor.extract_from_text_and_image(msg.text, msg.image_url)
    elif msg.image_url:
        return extractor.extract_from_image(msg.image_url)
    elif msg.text:
        return extractor.extract_from_text(msg.text)
    return ExtractionResult(confianza="baja", notas="Mensaje sin texto ni imagen")


def _process(msg: WhatsAppMessage) -> dict:
    imagen_permanente = storage.upload_from_url(msg.image_url) if msg.image_url else None
    extraction = _extract(msg)
    record = repository.save(msg, extraction, imagen_permanente)
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
        text     = None
        image_url = None

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

    print("=== TWILIO FIELDS ===")
    for key, value in form.items():
        print(f"  {key}: {value}")
    print("====================")

    wa_msg = WhatsAppMessage(
        message_id  = str(form.get("MessageSid", str(uuid.uuid4()))),
        phone_from  = str(form.get("From", "")).replace("whatsapp:", ""),
        text        = str(form.get("Body", "")).strip() or None,
        image_url   = str(form.get("MediaUrl0", "")).strip() or None,
        timestamp   = str(int(time.time())),
    )

    try:
        _process(wa_msg)
    except Exception as e:
        print(f"[webhook/twilio] Error: {e}")

    return PlainTextResponse(
        "<?xml version='1.0' encoding='UTF-8'?><Response></Response>",
        media_type="application/xml",
    )
