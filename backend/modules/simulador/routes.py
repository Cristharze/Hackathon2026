import uuid
import time
from fastapi import APIRouter
from shared.models import WhatsAppMessage
from modules.extraccion import extractor
from modules.storage import service as storage
from modules.recolecciones import repository
from modules.webhook.routes import _extract

router = APIRouter(tags=["simulador"])


@router.post("/simulate")
async def simulate_message(payload: dict):
    """
    Simula un mensaje del recolector sin WhatsApp.
    Body: { "text": "...", "image_url": "...", "phone": "59170000000" }
    """
    wa_msg = WhatsAppMessage(
        message_id  = str(uuid.uuid4()),
        phone_from  = payload.get("phone", "59170000000"),
        text        = payload.get("text"),
        image_url   = payload.get("image_url"),
        timestamp   = str(int(time.time())),
    )
    imagen_permanente = storage.upload_from_url(wa_msg.image_url) if wa_msg.image_url else None
    extraction = _extract(wa_msg)
    record = repository.save(wa_msg, extraction, imagen_permanente)
    return {"status": "ok", "record_id": record.get("id"), "extraction": extraction.model_dump()}
