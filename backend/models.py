from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ExtractionResult(BaseModel):
    empresa: Optional[str] = None
    material: Optional[str] = None
    cantidad: Optional[float] = None
    unidad: Optional[str] = None
    fecha: Optional[str] = None
    confianza: Optional[str] = None  # "alta", "media", "baja"
    notas: Optional[str] = None


class RecoleccionRecord(BaseModel):
    whatsapp_message_id: str
    phone_from: str
    raw_text: Optional[str] = None
    image_url: Optional[str] = None
    empresa: Optional[str] = None
    material: Optional[str] = None
    cantidad: Optional[float] = None
    unidad: Optional[str] = None
    fecha_recoleccion: Optional[str] = None
    confianza_ia: Optional[str] = None
    notas_ia: Optional[str] = None
    estado: str = "pendiente"
    created_at: Optional[datetime] = None


class WhatsAppMessage(BaseModel):
    message_id: str
    phone_from: str
    text: Optional[str] = None
    image_url: Optional[str] = None
    timestamp: str
