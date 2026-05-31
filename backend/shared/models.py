from pydantic import BaseModel
from typing import Optional, List


class MaterialItem(BaseModel):
    material: Optional[str] = None
    cantidad: Optional[float] = None
    unidad: Optional[str] = None


class ExtractionResult(BaseModel):
    empresa: Optional[str] = None
    materiales: Optional[List[MaterialItem]] = None
    fecha: Optional[str] = None
    confianza: Optional[str] = None  # "alta", "media", "baja"
    notas: Optional[str] = None


class WhatsAppMessage(BaseModel):
    message_id: str
    phone_from: str
    text: Optional[str] = None
    image_url: Optional[str] = None
    timestamp: str
