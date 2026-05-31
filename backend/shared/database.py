import os
import requests as _requests

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SERVICE_KEY  = os.getenv("SUPABASE_SERVICE_KEY", "")


def headers(extra: dict | None = None) -> dict:
    h = {
        "apikey":        SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "return=representation",
    }
    if extra:
        h.update(extra)
    return h


def rest(table: str) -> str:
    return f"{SUPABASE_URL}/rest/v1/{table}"


def storage_url(bucket: str, path: str = "") -> str:
    return f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}"


def storage_public_url(bucket: str, path: str) -> str:
    return f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}"


def get(table: str, params: str = "") -> list:
    r = _requests.get(f"{rest(table)}?{params}", headers=headers(), timeout=10)
    r.raise_for_status()
    return r.json()


def insert(table: str, data: dict) -> dict:
    r = _requests.post(rest(table), headers=headers(), json=data, timeout=10)
    r.raise_for_status()
    result = r.json()
    return result[0] if isinstance(result, list) and result else (result or {})


def update(table: str, eq_field: str, eq_value: str, data: dict) -> dict:
    r = _requests.patch(
        f"{rest(table)}?{eq_field}=eq.{eq_value}",
        headers=headers(), json=data, timeout=10,
    )
    r.raise_for_status()
    result = r.json()
    return result[0] if isinstance(result, list) and result else (result or {})


def delete(table: str, eq_field: str, eq_value: str) -> None:
    h = headers()
    h.pop("Prefer", None)
    r = _requests.delete(
        f"{rest(table)}?{eq_field}=eq.{eq_value}",
        headers=h, timeout=10,
    )
    r.raise_for_status()


def ilike_one(table: str, field: str, value: str, select: str = "id") -> dict | None:
    encoded = _requests.utils.quote(f"%{value}%")
    rows = get(table, f"{field}=ilike.{encoded}&select={select}&limit=1")
    return rows[0] if rows else None
