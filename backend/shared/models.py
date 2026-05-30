from pydantic import BaseModel
from typing import Optional


class ExtractionResult(BaseModel):
    empresa: Optional[str] = None
    material: Optional[str] = None
    cantidad: Optional[float] = None
    unidad: Optional[str] = None
    fecha: Optional[str] = None
    confianza: Optional[str] = None  # "alta", "media", "baja"
    notas: Optional[str] = None


class WhatsAppMessage(BaseModel):
    message_id: str
    phone_from: str
    text: Optional[str] = None
    image_url: Optional[str] = None
    timestamp: str
