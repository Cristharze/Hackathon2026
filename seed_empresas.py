"""
Seed de recolecciones realistas para todas las empresas aliadas.
3-4 materiales por recoleccion, datos de los ultimos 18 meses.
"""
import requests, random, uuid
from datetime import date, timedelta, timezone, datetime

URL = "https://nwylpcpsokekbpiostyx.supabase.co"
KEY = "sb_secret_ZAiyqahGPpZcLc2Nk3TIsw_y9FWWtn4"
H   = {
    "apikey": KEY, "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json", "Prefer": "return=representation",
}

def get(table, q=""): return requests.get(f"{URL}/rest/v1/{table}?{q}", headers=H).json()
def post(table, data):
    r = requests.post(f"{URL}/rest/v1/{table}", headers=H, json=data)
    res = r.json()
    return (res[0] if isinstance(res, list) else res) if r.ok else None

# ── Datos base ────────────────────────────────────────────────────────────────
empresas  = get("empresas", "select=id,nombre")
materiales= get("materiales", "select=id,nombre")

print(f"Empresas: {len(empresas)} | Materiales: {len(materiales)}")

# Agrupar materiales en categorías para asignar según sector
RECICLABLES_COMUNES = [m for m in materiales if m["nombre"] in ["Cartón","Papel","Plástico PET","Plástico mixto"]]
RECICLABLES_METAL   = [m for m in materiales if m["nombre"] in ["Aluminio","Acero / Hojalata","Cobre"]]
RECICLABLES_ESPECIAL= [m for m in materiales if m["nombre"] in ["Electrónico (RAEE)","Vidrio","Aceite vegetal","Madera","Textiles"]]
TODOS               = materiales

def elegir_materiales(n=3):
    """Elige n materiales variados garantizando al menos 2 comunes."""
    pool = RECICLABLES_COMUNES.copy()
    extras = RECICLABLES_METAL + RECICLABLES_ESPECIAL
    random.shuffle(pool); random.shuffle(extras)
    seleccion = pool[:2] + extras[:max(0, n-2)]
    random.shuffle(seleccion)
    return seleccion[:n]

def fecha_aleatoria(meses_atras_min, meses_atras_max):
    today = date.today()
    dias  = random.randint(meses_atras_min * 30, meses_atras_max * 30)
    return today - timedelta(days=dias)

# ── Seed por empresa ─────────────────────────────────────────────────────────
total_rec = 0
total_det = 0

for empresa in empresas:
    eid  = empresa["id"]
    name = empresa["nombre"]

    # 8-12 recolecciones distribuidas en los últimos 16 meses
    n_recolecciones = random.randint(8, 12)

    for _ in range(n_recolecciones):
        fecha = fecha_aleatoria(1, 16)
        mats  = elegir_materiales(n=random.randint(3, 4))

        # Crear recoleccion
        rec = post("recolecciones", {
            "empresa_id":         eid,
            "empresa_nombre_raw": name,
            "estado":             "APROBADO",
            "fecha_recoleccion":  fecha.isoformat(),
            "fuente_origen":      "whatsapp",
            "mensaje_raw":        f"{name}: recolección de {', '.join(m['nombre'] for m in mats)}",
            "extraido_por_ia":    True,
            "ia_confidence":      round(random.uniform(0.82, 0.98), 2),
            "validado_at":        datetime.now(timezone.utc).isoformat(),
        })
        if not rec or not rec.get("id"):
            continue
        rec_id = rec["id"]
        total_rec += 1

        # Crear detalles de materiales
        for mat in mats:
            kg = round(random.uniform(8, 95), 1)
            post("detalle_recoleccion", {
                "recoleccion_id": rec_id,
                "material_id":    mat["id"],
                "cantidad":       kg,
                "notas":          "kg",
            })
            total_det += 1

    print(f"  OK {name[:30]:30} → {n_recolecciones} recolecciones")

print(f"\nTotal: {total_rec} recolecciones, {total_det} detalles de materiales")
print("Listo. Recarga el browser para ver los datos en los reportes.")
