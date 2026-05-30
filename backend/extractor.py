import anthropic
import base64
import httpx
import os
import json
import re
from models import ExtractionResult

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """Eres un asistente especializado en extraer datos de recolección de residuos reciclables para Fundares Bolivia.

El recolector manda mensajes informando sobre materiales recogidos en empresas aliadas. Tu tarea es extraer exactamente:
- empresa: nombre de la empresa donde se recogió (ej: "Tigo", "Banco BNB", "Farmacorp")
- material: tipo de residuo (ej: "cartón", "plástico PET", "papel", "vidrio", "metal", "electrónico")
- cantidad: número (ej: 15.5)
- unidad: unidad de medida (ej: "kg", "toneladas", "bolsas", "cajas")
- fecha: fecha de recolección en formato YYYY-MM-DD (si no se menciona, usa la fecha de hoy)
- confianza: "alta" si todos los datos son claros, "media" si algo es ambiguo, "baja" si hay mucha incertidumbre
- notas: cualquier observación relevante o dato que no pudo ser extraído claramente

IMPORTANTE:
- Si hay varios materiales en un mensaje, extrae solo el principal o el primero mencionado
- Si no puedes determinar un campo, déjalo en null
- Responde SOLO con un JSON válido, sin texto adicional, sin markdown, sin explicaciones

Ejemplo de respuesta:
{"empresa": "Tigo Bolivia", "material": "cartón", "cantidad": 45.0, "unidad": "kg", "fecha": "2026-05-30", "confianza": "alta", "notas": null}"""


def extract_from_text(text: str) -> ExtractionResult:
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": f"Extrae los datos de este mensaje del recolector:\n\n{text}"}
        ]
    )
    raw = response.content[0].text.strip()
    data = json.loads(_clean_json(raw))
    return ExtractionResult(**data)


def extract_from_image(image_url: str) -> ExtractionResult:
    image_data = _download_image_as_base64(image_url)
    media_type = _detect_media_type(image_url)

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_data,
                        },
                    },
                    {
                        "type": "text",
                        "text": "Extrae los datos de recolección de residuos que aparecen en esta imagen (puede ser una foto de materiales, una planilla escrita a mano, o una nota)."
                    }
                ],
            }
        ],
    )
    raw = response.content[0].text.strip()
    data = json.loads(_clean_json(raw))
    return ExtractionResult(**data)


def extract_from_text_and_image(text: str, image_url: str) -> ExtractionResult:
    image_data = _download_image_as_base64(image_url)
    media_type = _detect_media_type(image_url)

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_data,
                        },
                    },
                    {
                        "type": "text",
                        "text": f"El recolector envió esta imagen junto con el siguiente texto: '{text}'\n\nExtrae los datos de recolección combinando la información del texto y la imagen."
                    }
                ],
            }
        ],
    )
    raw = response.content[0].text.strip()
    data = json.loads(_clean_json(raw))
    return ExtractionResult(**data)


def _clean_json(text: str) -> str:
    text = re.sub(r'```(?:json)?\s*', '', text)
    text = text.replace('```', '')
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1:
        return text[start:end + 1].strip()
    return text.strip()


def _download_image_as_base64(url: str) -> str:
    if "twilio.com" in url:
        sid   = os.getenv("TWILIO_ACCOUNT_SID", "")
        token = os.getenv("TWILIO_AUTH_TOKEN", "")
        response = httpx.get(url, auth=(sid, token), timeout=30, follow_redirects=True)
    else:
        wa_token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
        headers  = {"Authorization": f"Bearer {wa_token}"} if wa_token else {}
        response = httpx.get(url, headers=headers, timeout=30)
    response.raise_for_status()
    return base64.standard_b64encode(response.content).decode("utf-8")


def _detect_media_type(url: str) -> str:
    url_lower = url.lower()
    if ".png" in url_lower:
        return "image/png"
    if ".gif" in url_lower:
        return "image/gif"
    if ".webp" in url_lower:
        return "image/webp"
    return "image/jpeg"
