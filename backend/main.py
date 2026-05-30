import os
import json
import uuid
import time
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request, Query, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

import extractor
import database
from models import WhatsAppMessage, ExtractionResult

app = FastAPI(title="Fundares WhatsApp Extractor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "fundares_token_2026")


# ── WhatsApp webhook verification (GET) ────────────────────────────────────────
@app.get("/webhook")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
):
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Token inválido")


# ── WhatsApp webhook receiver (POST) ───────────────────────────────────────────
@app.post("/webhook")
async def receive_message(request: Request):
    body = await request.json()

    try:
        entry = body["entry"][0]["changes"][0]["value"]
        messages = entry.get("messages", [])

        if not messages:
            return {"status": "no_messages"}

        msg = messages[0]
        message_id = msg["id"]
        phone_from = msg["from"]
        timestamp = msg["timestamp"]
        msg_type = msg["type"]

        text = None
        image_url = None

        if msg_type == "text":
            text = msg["text"]["body"]

        elif msg_type == "image":
            image_id = msg["image"]["id"]
            image_url = await _get_whatsapp_image_url(image_id)
            text = msg["image"].get("caption", None)

        elif msg_type == "document":
            return {"status": "tipo_no_soportado", "type": msg_type}

        wa_message = WhatsAppMessage(
            message_id=message_id,
            phone_from=phone_from,
            text=text,
            image_url=image_url,
            timestamp=timestamp,
        )

        extraction = _extract(wa_message)
        record = database.save_recoleccion(wa_message, extraction)

        return {"status": "ok", "record_id": record.get("id"), "extraction": extraction.model_dump()}

    except Exception as e:
        print(f"Error procesando webhook: {e}")
        return {"status": "error", "detail": str(e)}


async def _get_whatsapp_image_url(image_id: str) -> str:
    import httpx
    token = os.getenv("WHATSAPP_ACCESS_TOKEN")
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"https://graph.facebook.com/v19.0/{image_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        r.raise_for_status()
        return r.json()["url"]


def _extract(msg: WhatsAppMessage) -> ExtractionResult:
    if msg.text and msg.image_url:
        return extractor.extract_from_text_and_image(msg.text, msg.image_url)
    elif msg.image_url:
        return extractor.extract_from_image(msg.image_url)
    elif msg.text:
        return extractor.extract_from_text(msg.text)
    return ExtractionResult(confianza="baja", notas="Mensaje sin texto ni imagen")


# ── Twilio WhatsApp webhook ────────────────────────────────────────────────────
@app.post("/webhook/twilio")
async def twilio_webhook(request: Request):
    form = await request.form()

    print("=== TWILIO FIELDS ===")
    for key, value in form.items():
        print(f"  {key}: {value}")
    print("====================")

    phone_from = str(form.get("From", "")).replace("whatsapp:", "")
    body_text  = str(form.get("Body", "")).strip() or None
    media_url  = str(form.get("MediaUrl0", "")).strip() or None
    message_id = str(form.get("MessageSid", str(uuid.uuid4())))

    wa_message = WhatsAppMessage(
        message_id=message_id,
        phone_from=phone_from,
        text=body_text,
        image_url=media_url,
        timestamp=str(int(time.time())),
    )

    try:
        extraction = _extract(wa_message)
        database.save_recoleccion(wa_message, extraction)
    except Exception as e:
        print(f"Error procesando mensaje Twilio: {e}")

    return PlainTextResponse("<?xml version='1.0' encoding='UTF-8'?><Response></Response>",
                             media_type="application/xml")


# ── Endpoint de simulación (para testing sin WhatsApp real) ────────────────────
@app.post("/simulate")
async def simulate_message(payload: dict):
    """
    Simula un mensaje del recolector sin necesitar WhatsApp.
    Body: { "text": "...", "image_url": "...", "phone": "59170000000" }
    """
    wa_message = WhatsAppMessage(
        message_id=str(uuid.uuid4()),
        phone_from=payload.get("phone", "59170000000"),
        text=payload.get("text"),
        image_url=payload.get("image_url"),
        timestamp=str(int(time.time())),
    )
    extraction = _extract(wa_message)
    record = database.save_recoleccion(wa_message, extraction)
    return {"status": "ok", "record_id": record.get("id"), "extraction": extraction.model_dump()}


# ── Endpoints para el módulo de validación (Fundares admin) ───────────────────
@app.get("/recolecciones/pendientes")
async def get_pendientes():
    return database.get_pendientes()


@app.patch("/recolecciones/{record_id}/aprobar")
async def aprobar(record_id: str, corrections: dict = {}):
    return database.aprobar_recoleccion(record_id, corrections)


@app.patch("/recolecciones/{record_id}/rechazar")
async def rechazar(record_id: str, payload: dict = {}):
    motivo = payload.get("motivo", "")
    return database.rechazar_recoleccion(record_id, motivo)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Fundares Extractor"}
