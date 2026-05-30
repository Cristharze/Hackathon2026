"""
Simulador de mensajes WhatsApp para testing local.
Corre este script para enviar mensajes de prueba al servidor sin necesitar WhatsApp real.

Uso:
    python simulator.py
"""

import requests

BASE_URL = "http://localhost:8000"

test_cases = [
    {
        "name": "Texto simple",
        "payload": {
            "text": "Buenas, acabo de recoger 45 kg de carton en Tigo Bolivia, Santa Cruz centro",
            "phone": "59171234567",
        },
    },
    {
        "name": "Con fecha explícita",
        "payload": {
            "text": "Hoy 28 de mayo recogi 12 bolsas de plastico PET en Farmacorp av monseñor",
            "phone": "59171234567",
        },
    },
    {
        "name": "Mensaje ambiguo (confianza baja)",
        "payload": {
            "text": "ya pase por la empresa, llevo bastante cosa",
            "phone": "59171234567",
        },
    },
    {
        "name": "Múltiples materiales",
        "payload": {
            "text": "En Banco BNB: 20kg papel, 8kg carton y 3kg plastico. Todo junto son como 31 kilos",
            "phone": "59171234567",
        },
    },
    {
        "name": "Con imagen URL pública de prueba",
        "payload": {
            "text": "planilla del dia, recogi carton en farmacorp",
            "phone": "59171234567",
        },
    },
]


def run_tests():
    print("=" * 60)
    print("SIMULADOR DE MENSAJES - FUNDARES")
    print("=" * 60)

    for i, case in enumerate(test_cases, 1):
        print(f"\n[{i}] {case['name']}")
        print(f"    Payload: {case['payload']}")

        try:
            r = requests.post(f"{BASE_URL}/simulate", json=case["payload"], timeout=30)
            r.raise_for_status()
            result = r.json()
            extraction = result.get("extraction", {})
            print(f"    Empresa:    {extraction.get('empresa')}")
            print(f"    Material:   {extraction.get('material')}")
            print(f"    Cantidad:   {extraction.get('cantidad')} {extraction.get('unidad')}")
            print(f"    Fecha:      {extraction.get('fecha')}")
            print(f"    Confianza:  {extraction.get('confianza')}")
            print(f"    Notas:      {extraction.get('notas')}")
            print(f"    Record ID:  {result.get('record_id')}")
        except requests.exceptions.ConnectionError:
            print("    ERROR: El servidor no esta corriendo. Ejecuta: uvicorn main:app --reload")
        except Exception as e:
            print(f"    ERROR: {e}")

    print("\n" + "=" * 60)
    print("Simulacion completada. Revisa Supabase para ver los registros.")


if __name__ == "__main__":
    run_tests()
