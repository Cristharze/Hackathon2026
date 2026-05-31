import anthropic
import base64
import httpx
import os
import json
from shared.models import ExtractionResult
from modules.extraccion.prompts import SYSTEM_PROMPT

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = "claude-haiku-4-5-20251001"


def extract_from_text(text: str) -> ExtractionResult:
    response = client.messages.create(
        model=MODEL,
        max_tokens=512,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"Extrae los datos de este mensaje del recolector:\n\n{text}"}],
    )
    return _parse(response.content[0].text)


def extract_from_image(image_url: str) -> ExtractionResult:
    image_data, media_type = _download(image_url)
    response = client.messages.create(
        model=MODEL,
        max_tokens=512,
        system=SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": image_data}},
                {"type": "text", "text": "Extrae los datos de recolección de residuos que aparecen en esta imagen."},
            ],
        }],
    )
    return _parse(response.content[0].text)


def extract_from_text_and_image(text: str, image_url: str) -> ExtractionResult:
    image_data, media_type = _download(image_url)
    response = client.messages.create(
        model=MODEL,
        max_tokens=512,
        system=SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": image_data}},
                {"type": "text", "text": f"El recolector envió esta imagen con el texto: '{text}'\n\nExtrae los datos combinando ambos."},
            ],
        }],
    )
    return _parse(response.content[0].text)


def _parse(raw: str) -> ExtractionResult:
    raw = raw.strip()
    if raw.startswith("```"):
        lines = [l for l in raw.splitlines() if not l.strip().startswith("```")]
        raw = "\n".join(lines).strip()
    data = json.loads(raw)
    return ExtractionResult(**data)


def _download(url: str) -> tuple[str, str]:
    if "twilio.com" in url:
        sid   = os.getenv("TWILIO_ACCOUNT_SID", "")
        token = os.getenv("TWILIO_AUTH_TOKEN", "")
        r = httpx.get(url, auth=(sid, token), follow_redirects=True, timeout=30)
    else:
        wa_token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
        headers  = {"Authorization": f"Bearer {wa_token}"} if wa_token else {}
        r = httpx.get(url, headers=headers, follow_redirects=True, timeout=30)
    r.raise_for_status()
    content_type = r.headers.get("content-type", "image/jpeg").split(";")[0]
    return base64.standard_b64encode(r.content).decode("utf-8"), content_type
