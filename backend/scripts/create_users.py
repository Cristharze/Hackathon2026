"""
Script para crear usuarios de las 22 empresas en Supabase Auth.
Corre con: python scripts/create_users.py
"""
import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SERVICE_KEY  = os.getenv("SUPABASE_SERVICE_KEY", "")

HEADERS = {
    "apikey":        SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type":  "application/json",
}

EMPRESAS = [
    ("Ecomanager",                   "ecomanager",   "Eco"),
    ("Ascensores",                   "ascensores",   "Asc"),
    ("Ciagro",                       "ciagro",       "Cia"),
    ("BAS",                          "bas",          "Bas"),
    ("Curupau S.R.L.",               "curupau",      "Cur"),
    ("Interlogi",                    "interlogi",    "Int"),
    ("Construpanel",                 "construpanel", "Con"),
    ("PXB",                          "pxb",          "Pxb"),
    ("Cedare",                       "cedare",       "Ced"),
    ("REEcicla",                     "reecicla",     "Ree"),
    ("Sofia",                        "sofia",        "Sof"),
    ("Newrest",                      "newrest",      "New"),
    ("Bufalo",                       "bufalo",       "Buf"),
    ("INEA S.R.L.",                  "inea",         "Ine"),
    ("Tropiflor",                    "tropiflor",    "Tro"),
    ("Banco de la Nacion Argentina", "bna",          "Bna"),
    ("Las Lomas",                    "laslomas",     "Las"),
    ("Inplaz",                       "inplaz",       "Inp"),
    ("Mecpetrol",                    "mecpetrol",    "Mec"),
    ("Bago",                         "bago",         "Bag"),
    ("Empacar S.A.",                 "empacar",      "Emp"),
    ("Batebol S.A.",                 "batebol",      "Bat"),
]

ADMIN = ("admin@fundares.bo", "Admin@Fundares2026", "FUNDARES_ADMIN")


def get_empresa_id(nombre: str) -> str | None:
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/empresas?nombre=ilike.%{nombre}%&select=id&limit=1",
        headers=HEADERS
    )
    data = r.json()
    return data[0]["id"] if data else None


def create_auth_user(email: str, password: str) -> str | None:
    r = requests.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers=HEADERS,
        json={"email": email, "password": password, "email_confirm": True},
    )
    if r.status_code in (200, 201):
        return r.json().get("id")
    print(f"  [!] Auth error {r.status_code}: {r.text[:100]}")
    return None


def insert_usuario(email: str, nombre: str, rol: str, empresa_id: str | None) -> bool:
    data = {
        "email":         email,
        "password_hash": "supabase_auth",
        "rol":           rol,
        "nombre":        nombre,
        "empresa_id":    empresa_id,
    }
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/usuarios",
        headers={**HEADERS, "Prefer": "return=minimal"},
        json=data,
    )
    return r.status_code in (200, 201)


def main():
    print("=== Creando usuarios de Fundares ===\n")

    # Admin
    print("[ ADMIN ]")
    email, password, rol = ADMIN
    uid = create_auth_user(email, password)
    if uid:
        insert_usuario(email, "Admin Fundares", rol, None)
        print(f"  OK {email} | {password}")
    else:
        print(f"  -- {email} (puede que ya exista)")

    print("\n[ EMPRESAS ]")
    print(f"{'Empresa':<35} {'Email':<35} {'Contraseña'}")
    print("-" * 85)

    for nombre, slug, prefix in EMPRESAS:
        email    = f"{slug}@fundares.bo"
        password = f"{prefix}@Fundares2026"

        uid        = create_auth_user(email, password)
        empresa_id = get_empresa_id(nombre)

        if uid:
            insert_usuario(email, nombre, "EMPRESA_ALIADA", empresa_id)
            print(f"  OK {nombre:<33} {email:<35} {password}")
        else:
            print(f"  -- {nombre:<33} (puede que ya exista)")

    print("\n=== Listo. Guarda estas credenciales en un lugar seguro. ===")


if __name__ == "__main__":
    main()
